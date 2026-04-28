import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search') ?? ''
  let query = supabase.from('whatsapp_contacts').select('*').order('created_at', { ascending: false })
  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE() {
  const { error } = await supabase.from('whatsapp_contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
