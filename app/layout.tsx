import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { MessageCircle, Users, LayoutDashboard, Send } from 'lucide-react'

export const metadata: Metadata = {
  title: 'WhatsApp Bulk Sender',
  description: 'Send bulk WhatsApp messages with delivery tracking',
}

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/campaigns', label: 'Campaigns', icon: MessageCircle },
  { href: '/campaigns/new', label: 'New Campaign', icon: Send },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 min-h-screen flex">
        <aside className="w-64 bg-slate-900 flex-shrink-0 flex flex-col min-h-screen">
          <div className="h-16 px-6 flex items-center border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-white text-base">
                WA<span className="text-green-400">Bulk</span>
              </span>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-medium group"
              >
                <item.icon className="w-5 h-5 group-hover:text-green-400 transition-colors" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="px-4 py-4 border-t border-slate-800 text-xs text-slate-600 text-center">
            WhatsApp Bulk Sender v1.0
          </div>
        </aside>
        <div className="flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6">
            <h1 className="text-slate-900 font-bold text-lg">WhatsApp Bulk Sender</h1>
            <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Supabase Connected
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  )
}
