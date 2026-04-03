// app/page.tsx — redirect to /chat or /login
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await auth()
  if (session?.user) {
    redirect('/chat')
  } else {
    redirect('/login')
  }
}
