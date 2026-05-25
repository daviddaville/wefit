'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getWorkoutDayById } from '@/core/services/programService'
import { useWorkoutSession } from '@/core/hooks/useWorkoutSession'
import { SetsConfig } from '@/core/types/workout.types'
import ExerciseCard from './ExerciseCard'
import RestTimerOverlay from './RestTimerOverlay'
import { Button } from '@/components/ui/button'
import { createClient } from '@/core/services/supabaseClient'
import { Check, ChevronRight, PlayCircle, Timer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Props { workoutDayId: string }

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h${String(m % 60).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function useElapsedTimer(startedAt: number | null) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!startedAt) return
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 1000)
    return () => clearInterval(id)
  }, [startedAt])
  return elapsed
}

function ExerciseRow({ config, status }: { config: SetsConfig; status: 'done' | 'current' | 'upcoming' }) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2.5 transition-colors',
      status === 'current'  && 'bg-primary/8',
      status === 'done'     && 'opacity-40',
      status === 'upcoming' && 'opacity-60',
    )}>
      <div className={cn(
        'h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
        status === 'done'     && 'bg-green-500/20 text-green-600 dark:text-green-400',
        status === 'current'  && 'bg-primary text-primary-foreground',
        status === 'upcoming' && 'border border-border text-muted-foreground',
      )}>
        {status === 'done'    ? <Check className="h-3.5 w-3.5" /> : null}
        {status === 'current' ? <ChevronRight className="h-3.5 w-3.5" /> : null}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm truncate',
          status === 'current' && 'font-semibold text-foreground',
        )}>
          {config.exercise?.name ?? '—'}
        </p>
        <p className="text-xs text-muted-foreground">
          {config.sets_count} × {config.rep_range_min}–{config.rep_range_max}
        </p>
      </div>
      {config.exercise?.muscle_group && (
        <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
          {config.exercise.muscle_group}
        </span>
      )}
    </div>
  )
}

export default function SessionPage({ workoutDayId }: Props) {
  const router = useRouter()
  const {
    startSession, finishSession,
    activeWorkout, currentExerciseIndex, currentSetNumber, restSecondsLeft,
    setLogs, sessionStartedAt,
  } = useWorkoutSession()

  const elapsed = useElapsedTimer(sessionStartedAt)

  const handleFinishSession = async () => {
    await finishSession()
    router.push('/history')
  }

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => (await createClient().auth.getSession()).data.session,
  })

  const { data: workoutDay, isLoading } = useQuery({
    queryKey: ['workout-day', workoutDayId],
    queryFn: () => getWorkoutDayById(workoutDayId),
  })

  const exercises = workoutDay?.sets_config ?? []
  const currentConfig = exercises[currentExerciseIndex]
  const isResting = restSecondsLeft > 0

  const handleStart = async () => {
    if (!session?.user.id || exercises.length === 0) return
    await startSession(workoutDayId, session.user.id)
  }

  // ── Pre-session ───────────────────────────────────────────────────────────────
  if (!activeWorkout) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <h2 className="text-xl font-semibold">{workoutDay?.name ?? 'Séance'}</h2>
        {!isLoading && exercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun exercice configuré.</p>
        ) : (
          <Button size="lg" className="gap-2" onClick={handleStart} disabled={isLoading || !workoutDay}>
            <PlayCircle className="h-5 w-5" />
            {isLoading ? 'Chargement…' : 'Démarrer la séance'}
          </Button>
        )}
      </div>
    )
  }

  // ── Session finished ──────────────────────────────────────────────────────────
  if (!currentConfig) {
    const totalVolume = setLogs.reduce((acc, l) => acc + (l.weight_kg ?? 0) * (l.reps_done ?? 0), 0)
    const totalSetsLogged = setLogs.length

    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">Séance terminée !</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {exercises.length} exercice{exercises.length > 1 ? 's' : ''} · {totalSetsLogged} séries
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <div className="rounded-xl border bg-card p-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{formatElapsed(elapsed)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Durée</p>
          </div>
          <div className="rounded-xl border bg-card p-3 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {totalVolume >= 1000
                ? `${(totalVolume / 1000).toFixed(1)}t`
                : `${Math.round(totalVolume)} kg`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Volume total</p>
          </div>
        </div>

        <Button onClick={handleFinishSession}>Enregistrer et quitter</Button>
      </div>
    )
  }

  // ── Active session ────────────────────────────────────────────────────────────
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets_count, 0)
  const completedSets = exercises
    .slice(0, currentExerciseIndex)
    .reduce((acc, ex) => acc + ex.sets_count, 0) + (currentSetNumber - 1)
  const progressPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0

  return (
    <div className="space-y-4 pb-24">

      {/* Chrono + progression */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {/* Elapsed timer — very visible */}
          <div className="flex items-center gap-1.5">
            <Timer className="h-4 w-4 text-primary" />
            <span className="font-mono text-xl font-bold tabular-nums text-primary">
              {formatElapsed(elapsed)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span>Série {currentSetNumber}/{currentConfig.sets_count}</span>
            <span className="font-semibold text-primary">{progressPct}%</span>
          </span>
        </div>

        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <h2 className="text-xl font-bold leading-tight">{currentConfig.exercise?.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{currentConfig.exercise?.muscle_group}</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {currentExerciseIndex + 1}/{exercises.length}
          </span>
        </div>
      </div>

      {isResting  && <RestTimerOverlay />}
      {!isResting && <ExerciseCard config={currentConfig} />}

      {/* Timeline */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-2 border-b bg-muted/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Séance</p>
        </div>
        <div className="divide-y divide-border/60">
          {exercises.map((ex, idx) => (
            <ExerciseRow
              key={ex.id}
              config={ex}
              status={idx < currentExerciseIndex ? 'done' : idx === currentExerciseIndex ? 'current' : 'upcoming'}
            />
          ))}
        </div>
      </div>

      <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleFinishSession}>
        Terminer la séance
      </Button>
    </div>
  )
}
