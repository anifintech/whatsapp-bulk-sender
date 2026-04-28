import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import QRCode from 'qrcode'

let sock = null, qrDataUrl = null, isConnected = false, connectedPhone = null

export const getStatus = () => ({ connected: isConnected, phone: connectedPhone, qr: qrDataUrl })
export const getSocket = () => sock

export async function whatsapp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const { version } = await fetchLatestBaileysVersion()
  sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }), printQRInTerminal: true })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) { qrDataUrl = await QRCode.toDataURL(qr); isConnected = false }
    if (connection === 'close') {
      isConnected = false; qrDataUrl = null
      if (new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) setTimeout(whatsapp, 5000)
    }
    if (connection === 'open') { isConnected = true; qrDataUrl = null; connectedPhone = sock.user?.id?.split(':')[0] ?? null; console.log('Connected:', connectedPhone) }
  })
}
