'use client'

import { useQuery } from '@tanstack/react-query'
import { getWorkoutDayById } from '@/core/services/programService'
import { useWorkoutSession } from '@/core/hooks/useWorkoutSession'
import { SetsConfig } from '@/core/types/workout.types'
import ExerciseCard from './ExerciseCard'
import RestTimerOverlay from './RestTimerOverlay'
import { Button } from '@/components/ui/button'
import { createClient } from '@/core/services/supabaseClient'
import { Check, ChevronRight, PlayCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Props { workoutDayId: string }

// ── Mini timeline row ─────────────────────────────────────────────────────────
function ExerciseRow({
  config, status,
}: {
  config: SetsConfig
  status: 'done' | 'current' | 'upcoming'
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2.5 transition-colors',
      status === 'current'  && 'bg-primary/8',
      status === 'done'     && 'opacity-40',
      status === 'upcoming' && 'opacity-60',
    )}>
      {/* Status icon */}
      <div className={cn(
        'h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
        status === 'done'     && 'bg-green-500/20 text-green-600 dark:text-green-400',
        status === 'current'  && 'bg-primary text-primary-foreground',
        status === 'upcoming' && 'border border-border text-muted-foreground',
      )}>
        {status === 'done'    ? <Check className="h-3.5 w-3.5" /> : null}
        {status === 'current' ? <ChevronRight className="h-3.5 w-3.5" /> : null}
      </div>

      {/* Name + info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm truncate',
          status === 'current' && 'font-semibold text-foreground',
          status !== 'current' && 'font-normal',
        )}>
          {config.exercise?.name ?? '—'}
        </p>
        <p className="text-xs text-muted-foreground">
          {config.sets_count} × {config.rep_range_min}–{config.rep_range_max}
        </p>
      </div>

      {/* Muscle badge */}
      {config.exercise?.muscle_group && (
        <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
          {config.exercise.muscle_group}
        </span>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SessionPage({ workoutDayId }: Props) {
  const router = useRouter()
  const {
    startSession, finishSession,
    activeWorkout, currentExerciseIndex, currentSetNumber, restSecondsLeft,
  } = useWorkoutSession()

  const handleFinishSession = async () => {
    await finishSession()
    router.push('/history')
  }

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await createClient().auth.getSession()
      return data.session
    },
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

  // ── Pre-session screen ──────────────────────────────────────────────────────
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

  // ── Session finished ────────────────────────────────────────────────────────
  if (!currentConfig) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">Séance terminée !</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {exercises.length} exercice{exercises.length > 1 ? 's' : ''} complété{exercises.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleFinishSession}>Enregistrer et quitter</Button>
      </div>
    )
  }

  // ── Active session ──────────────────────────────────────────────────────────
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets_count, 0)
  const completedSets = exercises
    .slice(0, currentExerciseIndex)
    .reduce((acc, ex) => acc + ex.sets_count, 0) + (currentSetNumber - 1)
  const progressPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0

  return (
    <div className="space-y-4 pb-24">

      {/* Progress bar + header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Exercice {currentExerciseIndex + 1} / {exercises.length}</span>
          <span className="flex items-center gap-1.5">
            <span>Série {currentSetNumber} / {currentConfig.sets_count}</span>
            <span className="text-primary font-semibold">{progressPct}%</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Current exercise name */}
        <div className="pt-1">
          <h2 className="text-xl font-bold leading-tight">{currentConfig.exercise?.name}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentConfig.exercise?.muscle_group}
          </p>
        </div>
      </div>

      {/* Rest overlay or exercise card */}
      {isResting && <RestTimerOverlay />}
      {!isResting && <ExerciseCard config={currentConfig} />}

      {/* Timeline */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-2 border-b bg-muted/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Séance
          </p>
        </div>
        <div className="divide-y divide-border/60">
          {exercises.map((ex, idx) => (
            <ExerciseRow
              key={ex.id}
              config={ex}
              status={
                idx < currentExerciseIndex  ? 'done' :
                idx === currentExerciseIndex ? 'current' : 'upcoming'
              }
            />
          ))}
        </div>
      </div>

      {/* Terminate button */}
      <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleFinishSession}>
        Terminer la séance
      </Button>
    </div>
  )
}
