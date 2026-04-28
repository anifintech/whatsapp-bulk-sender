import { NextResponse } from 'next/server'

export async function GET() {
  const workerUrl = process.env.WHATSAPP_WORKER_URL
  if (!workerUrl) return NextResponse.json({ connected: false })
  try {
    const res = await fetch(`${workerUrl}/status`, { headers: { 'x-api-key': process.env.WHATSAPP_WORKER_SECRET ?? '' }, signal: AbortSignal.timeout(5000) })
    if (!res.ok) return NextResponse.json({ connected: false })
    return NextResponse.json(await res.json())
  } catch { return NextResponse.json({ connected: false }) }
}
