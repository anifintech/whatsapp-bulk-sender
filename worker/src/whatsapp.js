const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const QRCode = require('qrcode')

let sock = null, qrDataUrl = null, isConnected = false, connectedPhone = null

const getStatus = () => ({ connected: isConnected, phone: connectedPhone, qr: qrDataUrl })
const getSocket = () => sock

async function whatsapp() {
  console.log('Initializing WhatsApp connection...')
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  console.log('Auth state loaded')

  const { version } = await fetchLatestBaileysVersion()
  console.log('Baileys version:', version)

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    browser: ['WhatsApp Bulk Sender', 'Chrome', '1.0.0'],
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('QR code received, generating data URL...')
      qrDataUrl = await QRCode.toDataURL(qr)
      isConnected = false
      console.log('QR ready — visit /qr to scan')
    }
    if (connection === 'close') {
      isConnected = false
      qrDataUrl = null
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log('Connection closed, reason:', reason)
      if (reason !== DisconnectReason.loggedOut) {
        console.log('Reconnecting in 5s...')
        setTimeout(whatsapp, 5000)
      }
    }
    if (connection === 'open') {
      isConnected = true
      qrDataUrl = null
      connectedPhone = sock.user?.id?.split(':')[0] ?? null
      console.log('✅ WhatsApp connected:', connectedPhone)
    }
  })
}

module.exports = { whatsapp, getStatus, getSocket }
