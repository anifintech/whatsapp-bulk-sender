'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Users, Send, CheckCheck, Eye, XCircle, Plus, Wifi, WifiOff, RefreshCw } from 'lucide-react'

interface Stats { totalContacts:number; totalCampaigns:number; totalSent:number; totalDelivered:number; totalRead:number; totalFailed:number }
interface Campaign { id:string; name:string; status:string; total_contacts:number; sent_count:number; delivered_count:number; read_count:number; failed_count:number; created_at:string }

const statusColor:Record<string,string> = { draft:'bg-slate-100 text-slate-600', running:'bg-blue-100 text-blue-700', paused:'bg-yellow-100 text-yellow-700', completed:'bg-green-100 text-green-700', failed:'bg-red-100 text-red-700' }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats|null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [worker, setWorker] = useState({ connected: false, phone: '' })
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    const [s, c, w] = await Promise.allSettled([fetch('/api/stats'), fetch('/api/campaigns?limit=5'), fetch('/api/worker/status')])
    if (s.status==='fulfilled' && s.value.ok) setStats(await s.value.json())
    if (c.status==='fulfilled' && c.value.ok) setCampaigns((await c.value.json()).data)
    if (w.status==='fulfilled' && w.value.ok) setWorker(await w.value.json())
    setLoading(false)
  }

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 15000); return () => clearInterval(t) }, [])

  const cards = [
    { label:'Contacts', value:stats?.totalContacts??0, icon:Users, color:'bg-blue-500' },
    { label:'Campaigns', value:stats?.totalCampaigns??0, icon:MessageSquare, color:'bg-purple-500' },
    { label:'Sent', value:stats?.totalSent??0, icon:Send, color:'bg-green-500' },
    { label:'Delivered', value:stats?.totalDelivered??0, icon:CheckCheck, color:'bg-teal-500' },
    { label:'Read', value:stats?.totalRead??0, icon:Eye, color:'bg-orange-500' },
    { label:'Failed', value:stats?.totalFailed??0, icon:XCircle, color:'bg-red-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Dashboard</h2><p className="text-slate-500 text-sm mt-1">Overview of your WhatsApp campaigns</p></div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"><RefreshCw className="w-4 h-4"/>Refresh</button>
          <Link href="/campaigns/new" className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"><Plus className="w-4 h-4"/>New Campaign</Link>
        </div>
      </div>

      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${worker.connected?'bg-green-50 border-green-200':'bg-red-50 border-red-200'}`}>
        {worker.connected ? <Wifi className="w-5 h-5 text-green-600"/> : <WifiOff className="w-5 h-5 text-red-500"/>}
        <div>
          <p className={`text-sm font-semibold ${worker.connected?'text-green-700':'text-red-600'}`}>WhatsApp Worker: {worker.connected ? `Connected${worker.phone?` — ${worker.phone}`:''}` : 'Disconnected'}</p>
          {!worker.connected && <p className="text-xs text-red-500">Deploy the worker to Railway and set WHATSAPP_WORKER_URL in .env.local</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className={`w-9 h-9 ${c.color} rounded-lg flex items-center justify-center mb-3`}><c.icon className="w-5 h-5 text-white"/></div>
            <p className="text-2xl font-bold text-slate-900">{loading?'—':c.value.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/contacts" className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all group">
          <Users className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform"/>
          <h3 className="font-semibold text-slate-900">Contacts</h3>
          <p className="text-sm text-slate-500">Upload CSV / Excel, manage your contact list</p>
        </Link>
        <Link href="/campaigns" className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:border-green-300 hover:shadow-md transition-all group">
          <MessageSquare className="w-8 h-8 text-green-500 mb-2 group-hover:scale-110 transition-transform"/>
          <h3 className="font-semibold text-slate-900">Campaigns</h3>
          <p className="text-sm text-slate-500">Create and send bulk WhatsApp messages</p>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Recent Campaigns</h3>
          <Link href="/campaigns" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-slate-50">
          {campaigns.length===0 && !loading && <p className="text-center text-slate-400 py-10 text-sm">No campaigns yet.</p>}
          {campaigns.map(c => (
            <Link key={c.id} href={`/campaigns/${c.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-medium text-slate-900 text-sm">{c.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-xs text-slate-500"><p>{c.sent_count}/{c.total_contacts} sent</p><p>{c.read_count} read</p></div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[c.status]??'bg-slate-100 text-slate-600'}`}>{c.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
