import { useState, useEffect } from 'react'
import AuthForm from './components/AuthForm'
import MainApp from './components/MainApp'
import { apiGetUserData } from './api'
import type { UserData } from './types'

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kash_token'))
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    apiGetUserData(token)
      .then(setUserData)
      .catch(() => {
        localStorage.removeItem('kash_token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  function handleLogin(newToken: string, data: UserData) {
    localStorage.setItem('kash_token', newToken)
    setToken(newToken)
    setUserData(data)
  }

  function handleLogout() {
    localStorage.removeItem('kash_token')
    setToken(null)
    setUserData(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  if (!token || !userData) {
    return <AuthForm onLogin={handleLogin} />
  }

  return (
    <MainApp
      token={token}
      userData={userData}
      onDataChange={setUserData}
      onLogout={handleLogout}
    />
  )
}
