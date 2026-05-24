'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PersonaId, PERSONAS } from '@/core/config/coachPersonas'
import { getExerciseCatalog } from '@/core/services/exerciseService'
import { createProgram, createWorkoutDay, addExerciseToDay } from '@/core/services/programService'
import { createClient } from '@/core/services/supabaseClient'
import { UserProfile } from '@/core/types/user.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, Loader2, Check, Dumbbell, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  personaId: PersonaId
  profile: UserProfile | null | undefined
  onClose: () => void
}

const GOALS = [
  { id: 'prise_de_masse',  label: 'Prise de masse',   emoji: '💪' },
  { id: 'perte_de_gras',   label: 'Perte de gras',    emoji: '🔥' },
  { id: 'forme_generale',  label: 'Forme générale',   emoji: '⚡' },
  { id: 'force',           label: 'Force',            emoji: '🏋' },
]

const LEVELS = [
  { id: 'debutant',       label: 'Débutant',      desc: '< 1 an' },
  { id: 'intermediaire',  label: 'Intermédiaire', desc: '1-3 ans' },
  { id: 'avance',         label: 'Avancé',        desc: '3+ ans' },
]

const EQUIPMENT_LIST = [
  { id: 'halteres',            label: 'Haltères' },
  { id: 'banc_plat',           label: 'Banc plat' },
  { id: 'banc_incline',        label: 'Banc inclinable' },
  { id: 'banc_rack',           label: 'Banc avec rack' },
  { id: 'barre_olympique',     label: 'Barre olympique' },
  { id: 'ez_bar',              label: 'EZ-bar' },
  { id: 'poulie_haute',        label: 'Poulie haute' },
  { id: 'poulie_basse',        label: 'Poulie basse' },
  { id: 'presse',              label: 'Presse à cuisses' },
  { id: 'smith_machine',       label: 'Smith machine' },
  { id: 'machine_convergente', label: 'Machine convergente' },
  { id: 'barre_fixe',          label: 'Barre de traction' },
  { id: 'barres_paralleles',   label: 'Barres parallèles' },
  { id: 'poids_de_corps',      label: 'Poids de corps uniquement' },
]

const DAYS_OPTIONS = [2, 3, 4, 5, 6]
const DURATION_OPTIONS = [30, 45, 60, 75, 90]

type Step = 'goals' | 'level' | 'schedule' | 'equipment' | 'limitations' | 'generating' | 'result'

interface GeneratedProgram {
  coach_message: string
  program_name: string
  description: string
  workout_days: {
    name: string
    day_order: number
    exercises: {
      exercise_name: string
      sets_count: number
      rep_range_min: number
      rep_range_max: number
      rest_seconds: number
    }[]
  }[]
}

export default function DiagnosticFlow({ personaId, profile, onClose }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const persona = PERSONAS[personaId]

  const [step,         setStep]         = useState<Step>('goals')
  const [goals,        setGoals]        = useState<string[]>([])
  const [level,        setLevel]        = useState<string>('')
  const [daysPerWeek,  setDaysPerWeek]  = useState(3)
  const [minutes,      setMinutes]      = useState(60)
  const [equipment,    setEquipment]    = useState<string[]>([])
  const [limitations,  setLimitations]  = useState('')
  const [generated,    setGenerated]    = useState<GeneratedProgram | null>(null)
  const [error,        setError]        = useState('')

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => (await createClient().auth.getSession()).data.session,
  })

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercise-catalog'],
    queryFn: () => getExerciseCatalog(),
  })

  const toggleGoal = (id: string) =>
    setGoals(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id])

  const toggleEquipment = (id: string) =>
    setEquipment(e => e.includes(id) ? e.filter(x => x !== id) : [...e, id])

  const generate = async () => {
    setStep('generating')
    setError('')
    try {
      const res = await fetch('/api/coach/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId,
          profile: {
            name: profile?.first_name ?? profile?.full_name?.split(' ')[0],
            age: profile?.age,
            height_cm: profile?.height_cm,
            weight_kg: profile?.weight_kg,
            goal_weight_kg: profile?.goal_weight_kg,
          },
          goals,
          level,
          daysPerWeek,
          minutesPerSession: minutes,
          equipment,
          limitations: limitations || undefined,
          exercises: exercises.map(e => ({ name: e.name, muscle_group: e.muscle_group, level: e.level })),
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setGenerated(data.program)
      setStep('result')
    } catch (e: any) {
      setError(e.message ?? 'Erreur inconnue')
      setStep('limitations')
    }
  }

  const { mutate: saveProgram, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!session?.user.id || !generated) throw new Error()
      const prog = await createProgram(session.user.id, generated.program_name, generated.description)
      for (const day of generated.workout_days) {
        const wd = await createWorkoutDay(prog.id, day.name, day.day_order)
        for (let i = 0; i < day.exercises.length; i++) {
          const ex = day.exercises[i]
          const found = exercises.find(e => e.name === ex.exercise_name)
          if (!found) continue
          await addExerciseToDay(wd.id, found.id, {
            sets_count: ex.sets_count,
            rep_range_min: ex.rep_range_min,
            rep_range_max: ex.rep_range_max,
            rest_seconds: ex.rest_seconds,
            order: i + 1,
          })
        }
      }
      return prog
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-program'] })
      queryClient.invalidateQueries({ queryKey: ['workout-days'] })
      router.push('/program')
    },
  })

  // ── Step: goals ─────────────────────────────────────────────────────────────
  if (step === 'goals') return (
    <div className="space-y-5 pb-8">
      <BackButton onClose={onClose} />
      <CoachSays persona={persona} text="Dis-moi ce que tu veux accomplir. Tu peux choisir plusieurs objectifs." />
      <div className="grid grid-cols-2 gap-3">
        {GOALS.map(g => (
          <button key={g.id} onClick={() => toggleGoal(g.id)}
            className={cn(
              'rounded-xl border p-4 text-left transition-all',
              goals.includes(g.id) ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/40',
            )}>
            <span className="text-2xl">{g.emoji}</span>
            <p className="text-sm font-medium mt-1">{g.label}</p>
          </button>
        ))}
      </div>
      <Button className="w-full" disabled={goals.length === 0}
        onClick={() => setStep('level')}>
        Continuer <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )

  // ── Step: level ──────────────────────────────────────────────────────────────
  if (step === 'level') return (
    <div className="space-y-5 pb-8">
      <BackButton onClose={() => setStep('goals')} />
      <CoachSays persona={persona} text="Quel est ton niveau d'expérience en musculation ?" />
      <div className="space-y-3">
        {LEVELS.map(l => (
          <button key={l.id} onClick={() => setLevel(l.id)} className="w-full text-left">
            <Card className={cn(
              'overflow-hidden transition-all',
              level === l.id ? 'border-primary ring-1 ring-primary' : 'hover:border-muted-foreground/40',
            )}>
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{l.label}</p>
                  <p className="text-xs text-muted-foreground">{l.desc}</p>
                </div>
                {level === l.id && <Check className="h-4 w-4 text-primary" />}
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
      <Button className="w-full" disabled={!level} onClick={() => setStep('schedule')}>
        Continuer <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )

  // ── Step: schedule ───────────────────────────────────────────────────────────
  if (step === 'schedule') return (
    <div className="space-y-5 pb-8">
      <BackButton onClose={() => setStep('level')} />
      <CoachSays persona={persona} text="Combien de fois par semaine tu peux t'entraîner, et combien de temps ?" />
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Jours par semaine</p>
          <div className="flex gap-2">
            {DAYS_OPTIONS.map(d => (
              <button key={d} onClick={() => setDaysPerWeek(d)}
                className={cn(
                  'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all',
                  daysPerWeek === d ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-muted-foreground/40',
                )}>
                {d}j
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Durée par séance</p>
          <div className="flex gap-2 flex-wrap">
            {DURATION_OPTIONS.map(d => (
              <button key={d} onClick={() => setMinutes(d)}
                className={cn(
                  'px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                  minutes === d ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-muted-foreground/40',
                )}>
                {d} min
              </button>
            ))}
          </div>
        </div>
      </div>
      <Button className="w-full" onClick={() => setStep('equipment')}>
        Continuer <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )

  // ── Step: equipment ──────────────────────────────────────────────────────────
  if (step === 'equipment') return (
    <div className="space-y-5 pb-8">
      <BackButton onClose={() => setStep('schedule')} />
      <CoachSays persona={persona} text="Quel matériel as-tu à disposition ?" />
      <div className="grid grid-cols-2 gap-2">
        {EQUIPMENT_LIST.map(e => (
          <button key={e.id} onClick={() => toggleEquipment(e.id)}
            className={cn(
              'rounded-lg border px-3 py-2.5 text-left text-sm transition-all',
              equipment.includes(e.id)
                ? 'border-primary bg-primary/5 font-medium'
                : 'hover:border-muted-foreground/40 text-muted-foreground',
            )}>
            {equipment.includes(e.id) && <Check className="h-3 w-3 inline mr-1 text-primary" />}
            {e.label}
          </button>
        ))}
      </div>
      <Button className="w-full" disabled={equipment.length === 0}
        onClick={() => setStep('limitations')}>
        Continuer <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )

  // ── Step: limitations ────────────────────────────────────────────────────────
  if (step === 'limitations') return (
    <div className="space-y-5 pb-8">
      <BackButton onClose={() => setStep('equipment')} />
      <CoachSays persona={persona} text="As-tu des blessures, limitations articulaires ou contre-indications ? (optionnel)" />
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <Input
        placeholder="Ex : douleurs épaule droite, pas de squats lourds…"
        value={limitations}
        onChange={e => setLimitations(e.target.value)}
      />
      <Button className="w-full gap-2" onClick={generate}>
        <Zap className="h-4 w-4" />
        Générer mon programme
      </Button>
      <button className="w-full text-xs text-muted-foreground text-center" onClick={generate}>
        Passer cette étape
      </button>
    </div>
  )

  // ── Step: generating ─────────────────────────────────────────────────────────
  if (step === 'generating') return (
    <div className="flex flex-col items-center gap-6 py-16">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl animate-pulse">
        {persona.emoji}
      </div>
      <div className="text-center space-y-1">
        <p className="font-semibold">{persona.name} crée ton programme…</p>
        <p className="text-sm text-muted-foreground">Analyse de ton profil et du catalogue d'exercices</p>
      </div>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )

  // ── Step: result ─────────────────────────────────────────────────────────────
  if (step === 'result' && generated) return (
    <div className="space-y-5 pb-8">
      <BackButton onClose={onClose} />

      {/* Coach message */}
      <div className="flex gap-3 rounded-xl bg-primary/5 border border-primary/20 p-4">
        <span className="text-2xl shrink-0">{persona.emoji}</span>
        <p className="text-sm leading-relaxed italic">"{generated.coach_message}"</p>
      </div>

      {/* Program name */}
      <div>
        <h2 className="text-xl font-bold">{generated.program_name}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{generated.description}</p>
      </div>

      {/* Days preview */}
      <div className="space-y-3">
        {generated.workout_days.map((day, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="bg-primary/10 px-4 py-2.5 flex items-center justify-between">
              <p className="font-semibold text-sm">{day.name}</p>
              <span className="text-xs text-muted-foreground">{day.exercises.length} exercices</span>
            </div>
            <CardContent className="py-2 px-4 space-y-1">
              {day.exercises.map((ex, j) => (
                <div key={j} className="flex items-center justify-between text-sm py-0.5">
                  <span className="truncate mr-2">{ex.exercise_name}</span>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {ex.sets_count}×{ex.rep_range_min}–{ex.rep_range_max}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button className="w-full gap-2" onClick={() => saveProgram()} disabled={isSaving}>
        {isSaving
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</>
          : <><Dumbbell className="h-4 w-4" /> Adopter ce programme</>
        }
      </Button>
      <Button variant="ghost" className="w-full text-muted-foreground" onClick={generate}>
        Régénérer
      </Button>
    </div>
  )

  return null
}

function BackButton({ onClose }: { onClose: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="-ml-2" onClick={onClose}>
      <ArrowLeft className="h-4 w-4 mr-1" />
      Retour
    </Button>
  )
}

function CoachSays({ persona, text }: { persona: import('@/core/config/coachPersonas').CoachPersona; text: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xl shrink-0">
        {persona.emoji}
      </div>
      <div className="flex-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
