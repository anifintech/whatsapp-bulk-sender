import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface Row { name: string; phone: string; tags?: string; notes?: string }

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const name = file.name.toLowerCase()
  let rows: Row[] = []

  if (name.endsWith('.csv')) {
    rows = Papa.parse<Row>(buffer.toString('utf-8'), { header: true, skipEmptyLines: true }).data
  } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const wb = XLSX.read(buffer, { type: 'buffer' })
    rows = XLSX.utils.sheet_to_json<Row>(wb.Sheets[wb.SheetNames[0]])
  } else {
    return NextResponse.json({ error: 'Only .csv, .xlsx, .xls supported' }, { status: 400 })
  }

  const contacts = rows
    .filter(r => r.name && r.phone)
    .map(r => ({
      name: String(r.name).trim(),
      phone: String(r.phone).replace(/\D/g, ''),
      tags: r.tags ? String(r.tags).split(',').map(t => t.trim()).filter(Boolean) : [],
      notes: r.notes ? String(r.notes).trim() : null,
    }))
    .filter(c => c.phone.length >= 10)

  if (!contacts.length) return NextResponse.json({ error: 'No valid contacts found. Check columns: name, phone' }, { status: 400 })

  const { data, error } = await supabase.from('whatsapp_contacts').upsert(contacts, { onConflict: 'phone', ignoreDuplicates: true }).select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const added = data?.length ?? 0
  return NextResponse.json({ added, skipped: contacts.length - added, total: contacts.length })
}
