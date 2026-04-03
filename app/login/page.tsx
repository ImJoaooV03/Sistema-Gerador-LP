'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const LP_SECTIONS = [
  { label: 'HERO',          width: '100%', delay: 0    },
  { label: 'MANCHETE',      width: '81%',  delay: 0.10 },
  { label: 'BENEFÍCIOS',    width: '93%',  delay: 0.20 },
  { label: 'PROVA SOCIAL',  width: '74%',  delay: 0.30 },
  { label: 'OFERTA',        width: '97%',  delay: 0.40 },
  { label: 'BÔNUS',         width: '67%',  delay: 0.50 },
  { label: 'CTA',           width: '88%',  delay: 0.60 },
]

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [mounted, setMounted]   = useState(false)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { createClient } = await import('@/lib/supabase/client')
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
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <style>{`
        @keyframes lp-bar-in {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes form-fade-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orb-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.04); }
        }
        .lp-bar  { animation: lp-bar-in 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .form-in { animation: form-fade-in 0.75s cubic-bezier(0.16,1,0.3,1) 0.15s both; }
        .blink   { animation: cursor-blink 1.1s ease-in-out infinite; }
        .orb-a   { animation: orb-pulse 5s ease-in-out infinite; }
        .orb-b   { animation: orb-pulse 5s ease-in-out 2.5s infinite; }
      `}</style>

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[58%] flex-col overflow-hidden border-r border-border-default">

        {/* Dot-grid bg */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(30,43,60,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Ambient glows */}
        <div className="orb-a absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(240,180,41,0.08) 0%, transparent 60%)' }} />
        <div className="orb-b absolute -bottom-28 right-10 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 60%)' }} />

        {/* Top-right corner glow */}
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
          style={{ background: 'linear-gradient(225deg, rgba(240,180,41,0.10) 0%, transparent 60%)' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-14 py-10">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[9px] bg-accent flex items-center justify-center font-syne font-extrabold text-[13px] text-bg-base shadow-accent-glow flex-shrink-0">
              LP
            </div>
            <span className="font-syne font-bold text-text-1 text-[15px] tracking-tight">Sistema LP</span>
          </div>

          {/* Center content */}
          <div className="my-auto">

            {/* Live indicator */}
            <div className="flex items-center gap-2 mb-7">
              <div className="w-1.5 h-1.5 rounded-full bg-teal shadow-teal-glow" />
              <span className="text-[9px] font-mono text-text-3 uppercase tracking-[2.5px]">Gerando estrutura</span>
              <span className="blink text-[11px] font-mono text-teal leading-none">▋</span>
            </div>

            {/* LP wireframe visualization */}
            <div className="space-y-[6px] mb-10">
              {LP_SECTIONS.map((sec, i) => {
                const isLast = i === LP_SECTIONS.length - 1
                return (
                  <div
                    key={sec.label}
                    className="lp-bar"
                    style={{ animationDelay: `${sec.delay}s` }}
                  >
                    <div
                      className="flex items-center gap-3 h-9 rounded-[4px] border-l-[2.5px] border-accent pl-3 pr-3"
                      style={{
                        width: sec.width,
                        background: isLast
                          ? 'rgba(240,180,41,0.08)'
                          : 'rgba(240,180,41,0.025)',
                        boxShadow: isLast
                          ? 'inset 0 0 24px rgba(240,180,41,0.06), 0 0 0 1px rgba(240,180,41,0.08)'
                          : 'none',
                      }}
                    >
                      <span className="text-[8.5px] font-mono text-text-3 tracking-[1.8px] flex-1 select-none">
                        {sec.label}
                      </span>
                      {isLast && (
                        <span className="blink w-[5px] h-[13px] rounded-sm bg-accent opacity-80" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Tagline */}
            <div>
              <h2 className="font-syne font-extrabold text-[34px] leading-[1.08] tracking-[-0.5px] text-text-1 mb-3">
                Gere landing pages<br />
                <span className="text-accent">de alta conversão</span><br />
                com IA.
              </h2>
              <p className="text-[13px] text-text-3 leading-relaxed max-w-[280px]">
                Combine referências reais com o briefing do projeto.<br />
                A IA monta — você refina.
              </p>
            </div>
          </div>

          {/* Tech badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {['Claude', 'GPT-4o', 'Multi-modelo', 'Automático'].map(badge => (
              <span
                key={badge}
                className="text-[9px] font-mono text-text-3 border border-border-default px-2.5 py-1 rounded-lg bg-surface"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 bg-surface relative overflow-hidden">

        {/* Subtle corner decoration */}
        <div className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none"
          style={{ background: 'radial-gradient(circle at bottom right, rgba(240,180,41,0.05) 0%, transparent 60%)' }} />

        <div className={`form-in w-full max-w-[360px] relative z-10 ${mounted ? '' : 'opacity-0'}`}>

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-[9px] bg-accent flex items-center justify-center font-syne font-extrabold text-[13px] text-bg-base shadow-accent-glow">
              LP
            </div>
            <span className="font-syne font-bold text-text-1 text-[15px]">Sistema LP</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-syne font-extrabold text-[30px] text-text-1 tracking-tight leading-tight mb-1.5">
              Entrar
            </h1>
            <p className="text-text-3 text-[13px]">Acesso restrito à equipe</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-[9px] uppercase tracking-[2.5px] text-text-3 font-mono"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="voce@equipe.com"
                className="w-full h-11 bg-elevated border border-border-default rounded-lg px-4 text-[13px] text-text-1 placeholder:text-text-3 font-mono outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(240,180,41,0.09)]"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-[9px] uppercase tracking-[2.5px] text-text-3 font-mono"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full h-11 bg-elevated border border-border-default rounded-lg px-4 text-[13px] text-text-1 placeholder:text-text-3 font-mono outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(240,180,41,0.09)]"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-red-lp/25 bg-red-lp/5">
                <span className="text-red-lp text-[11px]">✕</span>
                <span className="text-red-lp text-[12px] font-mono">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-1 bg-accent text-bg-base font-syne font-bold text-[14px] tracking-tight rounded-lg transition-all duration-200 hover:brightness-110 hover:shadow-accent-glow active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-[14px] h-[14px] border-2 border-bg-base/25 border-t-bg-base rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
