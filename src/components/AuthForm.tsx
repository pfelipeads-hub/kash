import { useState } from 'react'
import { apiLogin, apiRegister, apiGetUserData } from '../api'
import type { UserData } from '../types'

interface Props {
  onLogin: (token: string, data: UserData) => void
}

export default function AuthForm({ onLogin }: Props) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = isRegister
        ? await apiRegister(email, password, username)
        : await apiLogin(email, password)
      const userData = await apiGetUserData(result.token)
      onLogin(result.token, userData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-white text-3xl font-bold tracking-tight">Kash</h1>
        <p className="text-slate-400 text-sm mt-1">Controle financeiro inteligente</p>
      </div>

      <div className="w-full max-w-sm bg-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-white font-semibold text-lg mb-5">
          {isRegister ? 'Criar conta' : 'Entrar'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Nome</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                placeholder="Seu nome"
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-400 text-xs mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Aguarde...' : isRegister ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            className="text-slate-400 text-sm hover:text-emerald-400 transition-colors"
          >
            {isRegister ? 'Já tenho conta — Entrar' : 'Não tenho conta — Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}
