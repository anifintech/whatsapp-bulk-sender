import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '50')
  const { data, error } = await supabase.from('whatsapp_campaigns').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { name, message, target_tag } = await req.json()
  if (!name || !message) return NextResponse.json({ error: 'name and message required' }, { status: 400 })

  let q = supabase.from('whatsapp_contacts').select('id, name, phone')
  if (target_tag) q = q.contains('tags', [target_tag])
  const { data: contacts, error: cErr } = await q
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  const { data: campaign, error: campErr } = await supabase.from('whatsapp_campaigns')
    .insert({ name, message, total_contacts: contacts?.length ?? 0, status: 'draft' }).select('id').single()
  if (campErr) return NextResponse.json({ error: campErr.message }, { status: 500 })

  if (contacts?.length) {
    const { error: mErr } = await supabase.from('whatsapp_messages').insert(
      contacts.map(c => ({ campaign_id: campaign.id, contact_id: c.id, phone: c.phone, name: c.name, status: 'pending' }))
    )
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })
  }

  return NextResponse.json({ id: campaign.id })
}
