import type { UserData } from './types'

export async function apiLogin(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro no login')
  return data as { token: string; user: { id: string; email: string; username: string } }
}

export async function apiRegister(email: string, password: string, username: string) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro no cadastro')
  return data as { token: string; user: { id: string; email: string; username: string } }
}

export async function apiGetUserData(token: string): Promise<UserData> {
  const res = await fetch('/api/user/data', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar dados')
  return data as UserData
}

export async function apiSaveUserData(token: string, payload: Partial<UserData>) {
  const res = await fetch('/api/user/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro ao salvar dados')
  return data
}
