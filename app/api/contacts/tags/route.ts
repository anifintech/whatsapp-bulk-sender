import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET() {
  const { data, error } = await supabase.from('whatsapp_contacts').select('tags')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const tagMap: Record<string, number> = {}
  for (const c of data ?? []) for (const t of c.tags ?? []) tagMap[t] = (tagMap[t] ?? 0) + 1
  return NextResponse.json({ tags: Object.entries(tagMap).map(([tag, count]) => ({ tag, count })), total: data?.length ?? 0 })
}
