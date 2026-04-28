const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')

let sock = null, qrDataUrl = null, isConnected = false, connectedPhone = null
let restartCount = 0

const AUTH_DIR = './auth_info'

function clearAuthState() {
  try {
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true })
      console.log('Auth state cleared — will generate fresh QR')
    }
  } catch (e) {
    console.error('Failed to clear auth state:', e)
  }
}

const getStatus = () => ({ connected: isConnected, phone: connectedPhone, qr: qrDataUrl })
const getSocket = () => sock

async function whatsapp() {
  console.log('Initializing WhatsApp connection...')
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()
  console.log('Baileys version:', version)

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    connectTimeoutMs: 30000,
    defaultQueryTimeoutMs: 30000,
    keepAliveIntervalMs: 15000,
    syncFullHistory: false,
    markOnlineOnConnect: false,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      restartCount = 0
      console.log('QR code ready — visit /qr to scan')
      qrDataUrl = await QRCode.toDataURL(qr)
      isConnected = false
    }

    if (connection === 'close') {
      isConnected = false
      qrDataUrl = null
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log('Connection closed, reason:', statusCode)

      if (statusCode === DisconnectReason.loggedOut) {
        console.log('Logged out — clearing auth and restarting')
        clearAuthState()
        restartCount = 0
        setTimeout(whatsapp, 2000)
        return
      }

      // Reason 500 = restartRequired — clear auth after 3 attempts
      if (statusCode === 500) {
        restartCount++
        console.log(`Restart attempt ${restartCount}`)
        if (restartCount >= 3) {
          console.log('Too many restarts — clearing auth state to force new QR')
          clearAuthState()
          restartCount = 0
          setTimeout(whatsapp, 2000)
          return
        }
      } else {
        restartCount = 0
      }

      setTimeout(whatsapp, 5000)
    }

    if (connection === 'open') {
      isConnected = true
      qrDataUrl = null
      restartCount = 0
      connectedPhone = sock.user?.id?.split(':')[0] ?? null
      console.log('✅ WhatsApp connected:', connectedPhone)
    }
  })
}

module.exports = { whatsapp, getStatus, getSocket }
