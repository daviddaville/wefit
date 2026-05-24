import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const geistSans = Geist({ variable: '--font-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI-RepCoach',
  description: 'Votre coach de progression haltères personnalisé',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
