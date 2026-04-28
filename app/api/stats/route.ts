import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET() {
  const [{ count }, { data: campaigns }] = await Promise.all([
    supabase.from('whatsapp_contacts').select('*', { count: 'exact', head: true }),
    supabase.from('whatsapp_campaigns').select('sent_count, delivered_count, read_count, failed_count'),
  ])
  const t = (campaigns ?? []).reduce((a, c) => ({ sent: a.sent+(c.sent_count??0), delivered: a.delivered+(c.delivered_count??0), read: a.read+(c.read_count??0), failed: a.failed+(c.failed_count??0) }), { sent:0, delivered:0, read:0, failed:0 })
  return NextResponse.json({ totalContacts: count??0, totalCampaigns: campaigns?.length??0, totalSent: t.sent, totalDelivered: t.delivered, totalRead: t.read, totalFailed: t.failed })
}
