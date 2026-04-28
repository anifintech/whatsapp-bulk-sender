'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, MessageSquare, Loader2, Trash2, Play } from 'lucide-react'

interface Campaign { id:string; name:string; status:string; total_contacts:number; sent_count:number; delivered_count:number; read_count:number; failed_count:number; created_at:string }

const statusColor:Record<string,string> = { draft:'bg-slate-100 text-slate-600', running:'bg-blue-100 text-blue-700', paused:'bg-yellow-100 text-yellow-700', completed:'bg-green-100 text-green-700', failed:'bg-red-100 text-red-700' }

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/campaigns').then(r => r.json()).then(d => { setCampaigns(d.data); setLoading(false) })
  }, [])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    await fetch(`/api/campaigns/${id}`, { method:'DELETE' })
    setCampaigns(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Campaigns</h2><p className="text-slate-500 text-sm mt-1">{campaigns.length} total</p></div>
        <Link href="/campaigns/new" className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><Plus className="w-4 h-4"/>New Campaign</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        {loading && <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-300"/></div>}
        {!loading && campaigns.length===0 && (
          <div className="text-center py-16">
            <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
            <p className="text-slate-400 mb-4">No campaigns yet.</p>
            <Link href="/campaigns/new" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"><Plus className="w-4 h-4"/>Create first campaign</Link>
          </div>
        )}
        <div className="divide-y divide-slate-50">
          {campaigns.map(c => {
            const pct = c.total_contacts ? Math.round((c.sent_count/c.total_contacts)*100) : 0
            return (
              <div key={c.id} className="px-6 py-5 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Link href={`/campaigns/${c.id}`} className="font-semibold text-slate-900 hover:text-blue-600 truncate">{c.name}</Link>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${statusColor[c.status]}`}>{c.status}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{c.sent_count}/{c.total_contacts} sent</span><span>{pct}%</span></div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{width:`${pct}%`}}/></div>
                    </div>
                    <div className="flex gap-4 mt-3 text-xs">
                      <span className="text-teal-600">✔ {c.delivered_count} delivered</span>
                      <span className="text-orange-500">👁 {c.read_count} read</span>
                      <span className="text-red-500">✗ {c.failed_count} failed</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/campaigns/${c.id}`} className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">View</Link>
                    {(c.status==='draft'||c.status==='paused') && (
                      <Link href={`/campaigns/${c.id}`} className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-1"><Play className="w-3 h-3"/>Send</Link>
                    )}
                    <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
