'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Workout } from '@/core/types/workout.types'
import { getWorkoutDetail } from '@/core/services/workoutService'
import { ChevronDown, ChevronUp, Dumbbell, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  workout: Workout & { workout_day?: { name: string } }
}

export default function WorkoutSummary({ workout }: Props) {
  const [open, setOpen] = useState(false)

  const date = new Date(workout.started_at)
  const duration = workout.ended_at
    ? Math.round((new Date(workout.ended_at).getTime() - date.getTime()) / 60000)
    : null

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['workout-detail', workout.id],
    queryFn: () => getWorkoutDetail(workout.id),
    enabled: open,
  })

  // Group logs by exercise
  const byExercise = logs.reduce<Record<string, typeof logs>>((acc, log) => {
    const name = (log.sets_config as any)?.exercise?.name ?? 'Inconnu'
    if (!acc[name]) acc[name] = []
    acc[name].push(log)
    return acc
  }, {})

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header — always visible, clickable */}
      <button
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {workout.workout_day?.name ?? 'Séance'}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            {duration !== null && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {duration} min
              </span>
            )}
          </div>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        }
      </button>

      {/* Detail — expanded */}
      {open && (
        <div className="border-t">
          {isLoading ? (
            <div className="px-4 py-3 space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-8 rounded bg-muted animate-pulse" />)}
            </div>
          ) : Object.keys(byExercise).length === 0 ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">Aucune série enregistrée.</p>
          ) : (
            Object.entries(byExercise).map(([name, sets]) => (
              <div key={name} className="px-4 py-3 border-b last:border-b-0">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <p className="text-sm font-medium">{name}</p>
                </div>
                <div className="space-y-1">
                  {sets.map(s => {
                    const left  = s.weight_left_kg
                    const right = s.weight_right_kg
                    const weightStr = left != null && right != null
                      ? left === right
                        ? `${left} kg`
                        : `G ${left} / D ${right} kg`
                      : `${s.weight_kg} kg`
                    return (
                      <div key={s.id} className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Série {s.set_number}</span>
                        <span className="tabular-nums font-medium text-foreground">
                          {weightStr} × {s.reps_done} reps
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
