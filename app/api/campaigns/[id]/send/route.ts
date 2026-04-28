import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const workerUrl = process.env.WHATSAPP_WORKER_URL
  if (!workerUrl) return NextResponse.json({ error: 'WHATSAPP_WORKER_URL not set. Deploy the worker to Railway first.' }, { status: 503 })

  const { data: campaign, error } = await supabase.from('whatsapp_campaigns').select('id, status, message').eq('id', id).single()
  if (error || !campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  if (campaign.status === 'running') return NextResponse.json({ error: 'Already running' }, { status: 400 })
  if (campaign.status === 'completed') return NextResponse.json({ error: 'Already completed' }, { status: 400 })

  await supabase.from('whatsapp_campaigns').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', id)

  const { data: messages } = await supabase.from('whatsapp_messages').select('id, phone, name').eq('campaign_id', id).eq('status', 'pending')
  if (!messages?.length) {
    await supabase.from('whatsapp_campaigns').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id)
    return NextResponse.json({ ok: true, queued: 0 })
  }

  fetch(`${workerUrl}/send-bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.WHATSAPP_WORKER_SECRET ?? '' },
    body: JSON.stringify({ campaign_id: id, message: campaign.message, messages, supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL, supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }),
  }).catch(() => {})

  return NextResponse.json({ ok: true, queued: messages.length })
}
