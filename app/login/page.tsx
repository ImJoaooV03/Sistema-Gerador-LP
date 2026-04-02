'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="w-full max-w-sm px-6 relative">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-[10px] bg-accent flex items-center justify-center font-syne font-extrabold text-sm text-bg-base shadow-accent-glow">
            LP
          </div>
          <div>
            <div className="font-syne font-bold text-text-1 tracking-tight">Sistema LP</div>
            <div className="text-[11px] text-text-3 font-mono">v1.0 · equipe</div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="font-syne font-bold text-2xl text-text-1 tracking-tight mb-1">Entrar</h1>
          <p className="text-text-2 text-sm">Acesso restrito à equipe</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-[10px] uppercase tracking-widest text-text-3 font-mono">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="voce@equipe.com"
              className="bg-surface border-border-default text-text-1 placeholder:text-text-3"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-[10px] uppercase tracking-widest text-text-3 font-mono">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="bg-surface border-border-default text-text-1 placeholder:text-text-3"
            />
          </div>

          {error && (
            <p className="text-red-lp text-sm font-mono">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-bg-base font-semibold hover:bg-accent/90 mt-2"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
