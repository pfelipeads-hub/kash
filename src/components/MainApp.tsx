import { useState } from 'react'
import type { UserData } from '../types'
import { apiSaveUserData } from '../api'
import Dashboard from './Dashboard'
import Transactions from './Transactions'
import Goals from './Goals'

interface Props {
  token: string
  userData: UserData
  onDataChange: (data: UserData) => void
  onLogout: () => void
}

type Tab = 'home' | 'lancamentos' | 'meta'

export default function MainApp({ token, userData, onDataChange, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [saving, setSaving] = useState(false)

  async function saveData(updates: Partial<UserData>) {
    const newData = { ...userData, ...updates }
    onDataChange(newData)
    setSaving(true)
    try {
      await apiSaveUserData(token, updates)
    } catch {
      // Data is updated locally; sync failure is non-fatal
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      label: 'Início',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'lancamentos',
      label: 'Lançamentos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: 'meta',
      label: 'Meta',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700/50 px-5 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Kash</p>
            <p className="text-slate-400 text-xs leading-tight">
              Olá, {userData.username.split(' ')[0]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <div className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-emerald-500 animate-spin" />
          )}
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {activeTab === 'home' && (
          <Dashboard userData={userData} onDataChange={saveData} />
        )}
        {activeTab === 'lancamentos' && (
          <Transactions userData={userData} onDataChange={saveData} />
        )}
        {activeTab === 'meta' && (
          <Goals userData={userData} onDataChange={saveData} />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-800 border-t border-slate-700/50 flex z-10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
              activeTab === tab.id ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
