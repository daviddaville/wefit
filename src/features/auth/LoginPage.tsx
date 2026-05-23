'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/core/services/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Dumbbell, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react'

type Mode = 'password' | 'magic'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('Email ou mot de passe incorrect.')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (err) setError(err.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Dumbbell className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AI-RepCoach</h1>
          <p className="text-sm text-muted-foreground">Votre coach de progression haltères</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Connexion</CardTitle>
            <CardDescription>
              {mode === 'password' ? 'Connectez-vous avec votre mot de passe.' : 'Recevez un lien de connexion par email.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {sent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p className="text-sm font-medium">Lien envoyé !</p>
                <p className="text-xs text-muted-foreground">
                  Vérifiez <strong>{email}</strong>
                </p>
              </div>
            ) : mode === 'password' ? (
              <form onSubmit={handlePassword} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="david@wefit.test"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Connexion…' : (
                    <><Lock className="mr-2 h-4 w-4" />Se connecter</>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email-magic">Email</Label>
                  <Input
                    id="email-magic"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Envoi…' : (
                    <><Mail className="mr-2 h-4 w-4" />Envoyer le lien magique</>
                  )}
                </Button>
              </form>
            )}

            {!sent && (
              <>
                <Separator />
                <Button
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => { setMode(mode === 'password' ? 'magic' : 'password'); setError(null) }}
                >
                  {mode === 'password' ? 'Connexion par lien magique' : 'Connexion par mot de passe'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
