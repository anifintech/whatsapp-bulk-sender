const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const QRCode = require('qrcode')

let sock = null, qrDataUrl = null, isConnected = false, connectedPhone = null

const getStatus = () => ({ connected: isConnected, phone: connectedPhone, qr: qrDataUrl })
const getSocket = () => sock

async function whatsapp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const { version } = await fetchLatestBaileysVersion()

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
      qrDataUrl = await QRCode.toDataURL(qr)
      isConnected = false
      console.log('Scan the QR code to connect WhatsApp')
    }
    if (connection === 'close') {
      isConnected = false
      qrDataUrl = null
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      if (reason !== DisconnectReason.loggedOut) setTimeout(whatsapp, 5000)
    }
    if (connection === 'open') {
      isConnected = true
      qrDataUrl = null
      connectedPhone = sock.user?.id?.split(':')[0] ?? null
      console.log('WhatsApp connected:', connectedPhone)
    }
  })
}

module.exports = { whatsapp, getStatus, getSocket }
