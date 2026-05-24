'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/core/services/supabaseClient'
import { getUserProfile } from '@/core/services/userService'
import { getActiveProgram } from '@/core/services/programService'
import { PERSONAS, PersonaId, DEFAULT_PERSONA } from '@/core/config/coachPersonas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Send, Settings2, Zap, Dumbbell } from 'lucide-react'
import CoachConfigurator from './CoachConfigurator'
import DiagnosticFlow from './DiagnosticFlow'

interface Message { role: 'user' | 'assistant'; content: string }

const PERSONA_KEY = 'wefit_coach_persona'

export default function CoachPage() {
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  const [personaId,     setPersonaId]     = useState<PersonaId>(() => {
    if (typeof window === 'undefined') return DEFAULT_PERSONA
    return (localStorage.getItem(PERSONA_KEY) as PersonaId) ?? DEFAULT_PERSONA
  })
  const [messages,      setMessages]      = useState<Message[]>([])
  const [input,         setInput]         = useState('')
  const [isLoading,     setIsLoading]     = useState(false)
  const [showConfig,    setShowConfig]    = useState(false)
  const [showDiagnose,  setShowDiagnose]  = useState(false)

  const persona = PERSONAS[personaId]

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => (await createClient().auth.getSession()).data.session,
  })

  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: () => getUserProfile(session!.user.id),
    enabled: !!session?.user.id,
  })

  const { data: program } = useQuery({
    queryKey: ['active-program', session?.user.id],
    queryFn: () => getActiveProgram(session!.user.id),
    enabled: !!session?.user.id,
  })

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Greeting on persona change
  useEffect(() => {
    if (messages.length > 0) return
    const greeting: Message = {
      role: 'assistant',
      content: greetingFor(personaId, profile?.first_name ?? profile?.full_name?.split(' ')[0]),
    }
    setMessages([greeting])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId, profile])

  const handlePersonaChange = (id: PersonaId) => {
    localStorage.setItem(PERSONA_KEY, id)
    setPersonaId(id)
    setMessages([])
    setShowConfig(false)
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    setInput('')
    setIsLoading(true)

    const userMsg: Message = { role: 'user', content: text.trim() }
    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, userMsg, assistantMsg])

    try {
      const userContext = {
        name: profile?.first_name ?? profile?.full_name?.split(' ')[0],
        age: profile?.age,
        height_cm: profile?.height_cm,
        weight_kg: profile?.weight_kg,
        goal_weight_kg: profile?.goal_weight_kg,
        currentProgram: program?.name,
      }

      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          personaId,
          userContext,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }

      if (!res.body) throw new Error('Pas de stream')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(prev => {
          const last = prev[prev.length - 1]
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }]
        })
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: `⚠️ Erreur : ${err?.message ?? 'Connexion impossible'}` },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  if (showConfig) {
    return (
      <CoachConfigurator
        currentPersona={personaId}
        onSelect={handlePersonaChange}
        onClose={() => setShowConfig(false)}
      />
    )
  }

  if (showDiagnose) {
    return (
      <DiagnosticFlow
        personaId={personaId}
        profile={profile}
        onClose={() => setShowDiagnose(false)}
      />
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">

      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b shrink-0">
        <div className={cn(
          'h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0',
          'bg-primary/10',
        )}>
          {persona.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight">{persona.name}</p>
          <p className="text-xs text-muted-foreground">{persona.label}</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"
            onClick={() => setShowDiagnose(true)}>
            <Dumbbell className="h-3.5 w-3.5" />
            Diagnostic
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8"
            onClick={() => setShowConfig(true)}>
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
            {msg.role === 'assistant' && (
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-sm shrink-0 mt-0.5">
                {persona.emoji}
              </div>
            )}
            <div className={cn(
              'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'bg-muted rounded-tl-sm',
            )}>
              {msg.content || (isLoading && i === messages.length - 1
                ? <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                  </span>
                : null
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 no-scrollbar">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="shrink-0 rounded-full border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-2 border-t shrink-0">
        <Input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder={`Message ${persona.name}…`}
          className="flex-1 h-10"
          disabled={isLoading}
        />
        <Button
          size="icon"
          className="h-10 w-10 shrink-0"
          disabled={!input.trim() || isLoading}
          onClick={() => sendMessage(input)}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function greetingFor(personaId: PersonaId, firstName?: string): string {
  const name = firstName ? ` ${firstName}` : ''
  const greetings: Record<PersonaId, string> = {
    motivateur: `Hey${name} ! ⚡ APEX est là. Prêt à tout déchirer aujourd'hui ? Qu'est-ce qu'on attaque ?`,
    militaire:  `À vos ordres${name}. SERGENT en ligne. Quelle est la mission du jour ?`,
    bienveillant: `Bonjour${name} 😊 Je suis SAM, ton coach. Comment tu vas aujourd'hui ? Prêt à prendre soin de toi ?`,
    strict:     `${name ? name.trim() + ',' : ''} COACH MAX à l'appareil. Qu'est-ce qu'on travaille aujourd'hui ? Je veux du sérieux.`,
    scientifique: `Bonjour${name}. DR. FORGE ici. Analysons ensemble ta prochaine séance pour optimiser tes résultats.`,
    sarcastique: `Oh, te voilà${name}... REX à l'appareil. Alors, on est motivé aujourd'hui ou c'est encore "j'ai pas dormi" ? 😏`,
  }
  return greetings[personaId]
}

const QUICK_PROMPTS = [
  'Comment progresser plus vite ?',
  'Analyse ma dernière séance',
  'Que manger avant la séance ?',
  'Je suis fatigué, je m\'entraîne quand même ?',
  'Mon programme est-il adapté ?',
]
