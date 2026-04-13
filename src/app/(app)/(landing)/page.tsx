import { redirect } from 'next/navigation'
import { getAuthUser } from '@/features/auth/actions/auth.actions'

export default async function Home() {
  const user = await getAuthUser()
  redirect((user ? '/feed' : '/login') as never)
}
