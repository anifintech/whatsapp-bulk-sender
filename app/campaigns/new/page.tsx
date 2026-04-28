'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Loader2, Users } from 'lucide-react'

export default function NewCampaignPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [targetTag, setTargetTag] = useState('__all__')
  const [tags, setTags] = useState<{tag:string;count:number}[]>([])
  const [total, setTotal] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/contacts/tags').then(r => r.json()).then(d => { setTags(d.tags??[]); setTotal(d.total??0) })
  }, [])

  const selectedCount = targetTag==='__all__' ? total : (tags.find(t => t.tag===targetTag)?.count??0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!name.trim()||!message.trim()) return
    setSaving(true)
    const res = await fetch('/api/campaigns', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name, message, target_tag: targetTag==='__all__'?null:targetTag }) })
    if (res.ok) { const d = await res.json(); router.push(`/campaigns/${d.id}`) }
    else { alert('Failed to create campaign'); setSaving(false) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/campaigns" className="p-2 hover:bg-slate-200 rounded-lg"><ArrowLeft className="w-5 h-5 text-slate-500"/></Link>
        <div><h2 className="text-2xl font-bold text-slate-900">New Campaign</h2><p className="text-slate-500 text-sm">Compose your bulk message</p></div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Campaign Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. May Offer 2026" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Send To</label>
          <select value={targetTag} onChange={e => setTargetTag(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="__all__">All Contacts ({total})</option>
            {tags.map(t => <option key={t.tag} value={t.tag}>{t.tag} ({t.count})</option>)}
          </select>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Users className="w-3 h-3"/>{selectedCount} contacts will receive this</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={6} placeholder={"Hi {name}, special offer just for you…"} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"/>
          <p className="text-xs text-slate-400 mt-1">Use <code className="bg-slate-100 px-1 rounded">{'{name}'}</code> to personalise</p>
        </div>
        {message && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs text-green-600 font-medium mb-2">Preview</p>
            <div className="bg-white rounded-lg px-4 py-3 text-sm text-slate-700 shadow-sm max-w-xs">{message.replace('{name}','John')}</div>
          </div>
        )}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving||!name.trim()||!message.trim()} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
            {saving ? 'Creating…' : 'Create Campaign'}
          </button>
          <Link href="/campaigns" className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
