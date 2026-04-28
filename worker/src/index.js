const express = require('express')
const { whatsapp, getStatus } = require('./whatsapp')
const { sendBulk } = require('./sender')

const app = express()
app.use(express.json({ limit: '10mb' }))
const API_KEY = process.env.API_KEY ?? ''

function auth(req, res, next) {
  if (API_KEY && req.headers['x-api-key'] !== API_KEY) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

app.get('/health', (_, res) => res.json({ ok: true }))

app.get('/status', auth, (_, res) => res.json(getStatus()))

// QR code page — open in browser to scan
app.get('/qr', (req, res) => {
  const { connected, phone, qr } = getStatus()
  if (connected) {
    return res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#f0fdf4">
      <h2 style="color:#16a34a">✅ WhatsApp Connected!</h2>
      <p>Phone: <strong>${phone}</strong></p>
    </body></html>`)
  }
  if (!qr) {
    return res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:40px">
      <h2>⏳ Waiting for QR code...</h2>
      <p>Please wait a few seconds and refresh this page.</p>
      <meta http-equiv="refresh" content="3">
    </body></html>`)
  }
  res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#f9fafb">
    <h2>Scan this QR code with WhatsApp</h2>
    <p>WhatsApp → Linked Devices → Link a Device</p>
    <img src="${qr}" style="width:280px;height:280px;border:4px solid #22c55e;border-radius:12px;margin:20px auto;display:block"/>
    <p style="color:#6b7280;font-size:14px">Page auto-refreshes every 5 seconds</p>
    <meta http-equiv="refresh" content="5">
  </body></html>`)
})

app.post('/send-bulk', auth, async (req, res) => {
  const { campaign_id, message, messages, supabase_url, supabase_key } = req.body
  if (!campaign_id || !message || !messages?.length) return res.status(400).json({ error: 'Missing fields' })
  res.json({ ok: true, queued: messages.length })
  sendBulk({ campaign_id, message, messages, supabase_url, supabase_key }).catch(console.error)
})

app.listen(process.env.PORT ?? 3001, () => console.log('Worker running'))

whatsapp().catch(console.error)
