import { api } from '../../lib/api'

export async function login(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password })
  return response.data?.data
}

export async function register(name: string, email: string, password: string) {
  const response = await api.post('/auth/register', { name, email, password })
  return response.data?.data
}
