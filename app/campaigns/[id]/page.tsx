'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, Pause, CheckCheck, Eye, Send, XCircle, Clock, Loader2, Download } from 'lucide-react'

interface Message { id:string; phone:string; name:string; status:'pending'|'sent'|'delivered'|'read'|'failed'; error_message:string|null; sent_at:string|null; delivered_at:string|null; read_at:string|null }
interface Campaign { id:string; name:string; message:string; status:string; total_contacts:number; sent_count:number; delivered_count:number; read_count:number; failed_count:number; created_at:string; started_at:string|null; completed_at:string|null }

const statusIcon:Record<string,React.ReactNode> = {
  pending:<Clock className="w-4 h-4 text-slate-400"/>, sent:<Send className="w-4 h-4 text-blue-500"/>,
  delivered:<CheckCheck className="w-4 h-4 text-teal-500"/>, read:<Eye className="w-4 h-4 text-orange-500"/>, failed:<XCircle className="w-4 h-4 text-red-500"/>
}
const statusBadge:Record<string,string> = { draft:'bg-slate-100 text-slate-600', running:'bg-blue-100 text-blue-700', paused:'bg-yellow-100 text-yellow-700', completed:'bg-green-100 text-green-700', failed:'bg-red-100 text-red-700' }

export default function CampaignDetail() {
  const { id } = useParams<{id:string}>()
  const [campaign, setCampaign] = useState<Campaign|null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    const [c, m] = await Promise.all([fetch(`/api/campaigns/${id}`), fetch(`/api/campaigns/${id}/messages`)])
    if (c.ok) setCampaign(await c.json())
    if (m.ok) setMessages((await m.json()).data)
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 8000); return () => clearInterval(t) }, [fetchData])

  async function sendCampaign() {
    setActionLoading(true)
    const res = await fetch(`/api/campaigns/${id}/send`, { method:'POST' })
    if (!res.ok) { const d = await res.json(); alert(d.error??'Failed') }
    await fetchData(); setActionLoading(false)
  }

  async function pauseCampaign() {
    setActionLoading(true)
    await fetch(`/api/campaigns/${id}/pause`, { method:'POST' })
    await fetchData(); setActionLoading(false)
  }

  function exportCSV() {
    const rows = [['Name','Phone','Status','Sent At','Delivered','Read','Error']]
    messages.forEach(m => rows.push([m.name??'',m.phone,m.status,m.sent_at??'',m.delivered_at??'',m.read_at??'',m.error_message??'']))
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'})); a.download=`${campaign?.name}_report.csv`; a.click()
  }

  const filtered = filter==='all' ? messages : messages.filter(m => m.status===filter)
  const pct = campaign?.total_contacts ? Math.round((campaign.sent_count/campaign.total_contacts)*100) : 0

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-300"/></div>
  if (!campaign) return <p className="text-center py-20 text-slate-400">Not found.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/campaigns" className="p-2 hover:bg-slate-200 rounded-lg mt-0.5"><ArrowLeft className="w-5 h-5 text-slate-500"/></Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">{campaign.name}</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge[campaign.status]}`}>{campaign.status}</span>
            </div>
            <p className="text-slate-400 text-sm mt-1">{new Date(campaign.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"><Download className="w-4 h-4"/>Export</button>
          {(campaign.status==='draft'||campaign.status==='paused') && (
            <button onClick={sendCampaign} disabled={actionLoading} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>}
              {campaign.status==='paused'?'Resume':'Send Campaign'}
            </button>
          )}
          {campaign.status==='running' && (
            <button onClick={pauseCampaign} disabled={actionLoading} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Pause className="w-4 h-4"/>}Pause
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[{l:'Total',v:campaign.total_contacts,c:'text-slate-900'},{l:'Sent',v:campaign.sent_count,c:'text-blue-600'},{l:'Delivered',v:campaign.delivered_count,c:'text-teal-600'},{l:'Read',v:campaign.read_count,c:'text-orange-500'},{l:'Failed',v:campaign.failed_count,c:'text-red-500'}].map(s => (
          <div key={s.l} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <p className={`text-3xl font-bold ${s.c}`}>{s.v}</p><p className="text-xs text-slate-500 mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex justify-between text-sm mb-2"><span className="text-slate-600 font-medium">Progress</span><span className="text-slate-500">{campaign.sent_count}/{campaign.total_contacts} · {pct}%</span></div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all" style={{width:`${pct}%`}}/></div>
        {campaign.completed_at && <p className="text-xs text-green-600 mt-2">Completed {new Date(campaign.completed_at).toLocaleString()}</p>}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <p className="text-sm font-medium text-slate-600 mb-2">Message</p>
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-slate-700 max-w-sm">{campaign.message}</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 gap-4 flex-wrap">
          <h3 className="font-semibold text-slate-900">Recipients ({filtered.length})</h3>
          <div className="flex items-center gap-2">
            {['all','pending','sent','delivered','read','failed'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${filter===s?'bg-slate-800 text-white':'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <th className="text-left px-6 py-3">Name</th><th className="text-left px-6 py-3">Phone</th><th className="text-left px-6 py-3">Status</th><th className="text-left px-6 py-3">Sent</th><th className="text-left px-6 py-3">Delivered</th><th className="text-left px-6 py-3">Read</th><th className="text-left px-6 py-3">Error</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length===0 && <tr><td colSpan={7} className="text-center py-10 text-slate-400">No messages</td></tr>}
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-900">{m.name??'—'}</td>
                  <td className="px-6 py-3 text-slate-600 font-mono text-xs">{m.phone}</td>
                  <td className="px-6 py-3"><span className="flex items-center gap-1.5">{statusIcon[m.status]}<span className="text-slate-600 capitalize">{m.status}</span></span></td>
                  <td className="px-6 py-3 text-slate-400 text-xs">{m.sent_at?new Date(m.sent_at).toLocaleTimeString():'—'}</td>
                  <td className="px-6 py-3 text-slate-400 text-xs">{m.delivered_at?new Date(m.delivered_at).toLocaleTimeString():'—'}</td>
                  <td className="px-6 py-3 text-slate-400 text-xs">{m.read_at?new Date(m.read_at).toLocaleTimeString():'—'}</td>
                  <td className="px-6 py-3 text-red-400 text-xs max-w-xs truncate">{m.error_message??'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
