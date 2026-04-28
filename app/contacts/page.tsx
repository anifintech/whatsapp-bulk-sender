'use client'
import { useEffect, useRef, useState } from 'react'
import { Upload, Trash2, Search, Users, Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface Contact { id:string; name:string; phone:string; tags:string[]; notes:string; created_at:string }

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{added:number;skipped:number}|null>(null)
  const [deleting, setDeleting] = useState<string|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function fetchContacts() {
    setLoading(true)
    const res = await fetch(`/api/contacts?search=${encodeURIComponent(search)}`)
    if (res.ok) setContacts((await res.json()).data)
    setLoading(false)
  }

  useEffect(() => { fetchContacts() }, [search])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true); setUploadResult(null)
    const form = new FormData(); form.append('file', file)
    const res = await fetch('/api/contacts/import', { method:'POST', body:form })
    const data = await res.json()
    if (res.ok) { setUploadResult({ added:data.added, skipped:data.skipped }); fetchContacts() }
    else alert(data.error ?? 'Upload failed')
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact?')) return
    setDeleting(id)
    await fetch(`/api/contacts/${id}`, { method:'DELETE' })
    setContacts(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  async function handleDeleteAll() {
    if (!confirm(`Delete ALL ${contacts.length} contacts? Cannot be undone.`)) return
    await fetch('/api/contacts', { method:'DELETE' })
    setContacts([])
  }

  function downloadTemplate() {
    const csv = 'name,phone,tags,notes\nJohn Doe,919876543210,vip,AC repair\nJane Smith,919123456789,,'
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='template.csv'; a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Contacts</h2><p className="text-slate-500 text-sm mt-1">{contacts.length} total</p></div>
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg border border-slate-200"><Download className="w-4 h-4"/>Template</button>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
            {uploading ? 'Uploading…' : 'Upload CSV / Excel'}
          </button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleUpload}/>
        </div>
      </div>

      {uploadResult && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-green-600"/>
          <p className="text-sm text-green-700 font-medium"><strong>{uploadResult.added}</strong> added · <strong>{uploadResult.skipped}</strong> skipped (duplicates)</p>
          <button onClick={() => setUploadResult(null)} className="ml-auto text-green-500"><XCircle className="w-4 h-4"/></button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
        <strong>Columns:</strong> <code className="bg-blue-100 px-1 rounded">name</code>, <code className="bg-blue-100 px-1 rounded">phone</code> (required) · phone format: <code className="bg-blue-100 px-1 rounded">919876543210</code> (no +)
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
            <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          {contacts.length > 0 && <button onClick={handleDeleteAll} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4"/>Delete All</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <th className="text-left px-6 py-3">Name</th><th className="text-left px-6 py-3">Phone</th><th className="text-left px-6 py-3">Tags</th><th className="text-left px-6 py-3">Notes</th><th className="text-left px-6 py-3">Added</th><th className="px-6 py-3"/>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {loading && <tr><td colSpan={6} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300"/></td></tr>}
              {!loading && contacts.length===0 && <tr><td colSpan={6} className="text-center py-16"><Users className="w-10 h-10 text-slate-200 mx-auto mb-3"/><p className="text-slate-400">No contacts. Upload a CSV or Excel file.</p></td></tr>}
              {contacts.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-900">{c.name}</td>
                  <td className="px-6 py-3 text-slate-600 font-mono text-xs">{c.phone}</td>
                  <td className="px-6 py-3"><div className="flex flex-wrap gap-1">{(c.tags??[]).map(t => <span key={t} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{t}</span>)}</div></td>
                  <td className="px-6 py-3 text-slate-500 max-w-xs truncate">{c.notes}</td>
                  <td className="px-6 py-3 text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => handleDelete(c.id)} disabled={deleting===c.id} className="text-slate-300 hover:text-red-500 disabled:opacity-40">
                      {deleting===c.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
