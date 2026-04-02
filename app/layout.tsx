import type { Metadata } from 'next'
import { Syne, JetBrains_Mono, DM_Sans } from 'next/font/google'
import './globals.css'

const syne = Syne({
  variable: '--font-syne-var',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

export const metadata: Metadata = {
  title: 'Sistema LP',
  description: 'Gerador de landing pages com IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${syne.variable} ${jetbrainsMono.variable} ${dmSans.variable} dark h-full`}
    >
      <body className="antialiased min-h-full">{children}</body>
    </html>
  )
}
