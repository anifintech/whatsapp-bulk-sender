const { createClient } = require('@supabase/supabase-js')
const { getSocket } = require('./whatsapp')

const DELAY_MS = 1200

async function sendBulk({ campaign_id, message, messages, supabase_url, supabase_key }) {
  const supabase = createClient(supabase_url, supabase_key)
  const sock = getSocket()
  if (!sock) {
    await supabase.from('whatsapp_campaigns').update({ status: 'failed' }).eq('id', campaign_id)
    return
  }

  for (const msg of messages) {
    const { data: camp } = await supabase.from('whatsapp_campaigns').select('status').eq('id', campaign_id).single()
    if (camp?.status === 'paused') return

    try {
      await sock.sendMessage(`${msg.phone}@s.whatsapp.net`, { text: message.replace(/\{name\}/gi, msg.name ?? '') })
      await supabase.from('whatsapp_messages').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', msg.id)
    } catch (err) {
      await supabase.from('whatsapp_messages').update({ status: 'failed', error_message: String(err?.message ?? err) }).eq('id', msg.id)
    }
    await new Promise(r => setTimeout(r, DELAY_MS))
  }
  await supabase.from('whatsapp_campaigns').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', campaign_id)
}

module.exports = { sendBulk }
