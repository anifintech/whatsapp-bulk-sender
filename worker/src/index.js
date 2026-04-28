import express from 'express'
import { whatsapp, getStatus } from './whatsapp.js'
import { sendBulk } from './sender.js'

const app = express()
app.use(express.json({ limit: '10mb' }))
const API_KEY = process.env.API_KEY ?? ''

function auth(req, res, next) {
  if (API_KEY && req.headers['x-api-key'] !== API_KEY) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

app.get('/health', (_, res) => res.json({ ok: true }))
app.get('/status', auth, (_, res) => res.json(getStatus()))
app.post('/send-bulk', auth, async (req, res) => {
  const { campaign_id, message, messages, supabase_url, supabase_key } = req.body
  if (!campaign_id || !message || !messages?.length) return res.status(400).json({ error: 'Missing fields' })
  res.json({ ok: true, queued: messages.length })
  sendBulk({ campaign_id, message, messages, supabase_url, supabase_key }).catch(console.error)
})

app.listen(process.env.PORT ?? 3001, () => console.log('Worker running'))
whatsapp()
