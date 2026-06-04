'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Workout } from '@/core/types/workout.types'
import { getWorkoutDetail } from '@/core/services/workoutService'
import { ChevronDown, ChevronUp, Dumbbell, Clock, Timer, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Props {
  workout: Workout & { workout_day?: { name: string } }
}

function formatDuration(ms: number) {
  const m = Math.floor(ms / 60000)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h${String(m % 60).padStart(2, '0')}`
  return `${m} min`
}

function weightStr(log: { weight_kg: number | null; weight_left_kg: number | null; weight_right_kg: number | null }) {
  const { weight_left_kg: l, weight_right_kg: r, weight_kg: w } = log
  if (l != null && r != null) return l === r ? `${l} kg` : `G ${l} / D ${r} kg`
  return `${w ?? 0} kg`
}

export default function WorkoutSummary({ workout }: Props) {
  const [open, setOpen] = useState(false)

  const started = new Date(workout.started_at)
  const duration = workout.ended_at
    ? new Date(workout.ended_at).getTime() - started.getTime()
    : null

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['workout-detail', workout.id],
    queryFn: () => getWorkoutDetail(workout.id),
    enabled: open,
  })

  // Group by exercise
  const byExercise = logs.reduce<Record<string, typeof logs>>((acc, log) => {
    const name = (log.sets_config as any)?.exercise?.name ?? 'Inconnu'
    if (!acc[name]) acc[name] = []
    acc[name].push(log)
    return acc
  }, {})

  const totalVolume = logs.reduce((acc, l) => acc + (l.weight_kg ?? 0) * (l.reps_done ?? 0), 0)
  const exerciseCount = Object.keys(byExercise).length

  return (
    <div className="rounded-xl border bg-card overflow-hidden">

      {/* Header */}
      <button
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {workout.workout_day?.name ?? 'Séance'}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground capitalize">
              {started.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {duration !== null && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Timer className="h-3 w-3" />
                {formatDuration(duration)}
              </span>
            )}
            {open && totalVolume > 0 && (
              <span className="flex items-center gap-1 text-xs text-primary font-medium">
                <Zap className="h-3 w-3" />
                {totalVolume >= 1000
                  ? `${(totalVolume / 1000).toFixed(1)} t`
                  : `${Math.round(totalVolume)} kg`} soulevés
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!open && (
            <span className="text-xs text-muted-foreground">
              {(workout as any).set_logs_count ?? ''}{exerciseCount > 0 ? `${exerciseCount} ex.` : ''}
            </span>
          )}
          {open
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>

      {/* Detail */}
      {open && (
        <div className="border-t">
          {isLoading ? (
            <div className="px-4 py-3 space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}
            </div>
          ) : Object.keys(byExercise).length === 0 ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">Aucune série enregistrée.</p>
          ) : (
            <>
              {Object.entries(byExercise).map(([name, sets]) => {
                const cfg = (sets[0].sets_config as any)
                const muscleGroup: string = cfg?.exercise?.muscle_group ?? ''
                const restSeconds: number = cfg?.rest_seconds ?? 0
                const repMin: number = cfg?.rep_range_min ?? 0
                const repMax: number = cfg?.rep_range_max ?? 0
                const setsTarget: number = cfg?.sets_count ?? 0
                const exVolume = sets.reduce((acc, s) => acc + (s.weight_kg ?? 0) * (s.reps_done ?? 0), 0)

                return (
                  <div key={name} className="px-4 py-3 border-b last:border-b-0 space-y-2">
                    {/* Exercise header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Dumbbell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <p className="text-sm font-medium truncate">{name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {muscleGroup && (
                          <Badge variant="secondary" className="text-xs h-4 px-1.5">
                            {muscleGroup}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Target + rest */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Objectif : {setsTarget}×{repMin}–{repMax}</span>
                      {restSeconds > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {restSeconds}s repos
                        </span>
                      )}
                      {exVolume > 0 && (
                        <span className="ml-auto text-primary font-medium">
                          {Math.round(exVolume)} kg
                        </span>
                      )}
                    </div>

                    {/* Sets table */}
                    <div className="rounded-lg bg-muted/40 divide-y divide-border/60 overflow-hidden">
                      <div className="grid grid-cols-3 px-3 py-1.5 text-xs text-muted-foreground font-medium">
                        <span>Série</span>
                        <span className="text-center">Poids</span>
                        <span className="text-right">Reps</span>
                      </div>
                      {sets.map(s => {
                        const overMin = (s.reps_done ?? 0) >= repMin
                        return (
                          <div key={s.id} className="grid grid-cols-3 px-3 py-1.5 text-xs">
                            <span className="text-muted-foreground">#{s.set_number}</span>
                            <span className="text-center tabular-nums font-medium">{weightStr(s)}</span>
                            <span className={`text-right tabular-nums font-semibold ${overMin ? 'text-green-500' : 'text-amber-500'}`}>
                              {s.reps_done} reps
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Footer — total volume */}
              {totalVolume > 0 && (
                <div className="px-4 py-2.5 bg-muted/30 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{exerciseCount} exercices · {logs.length} séries</span>
                  <span className="font-semibold text-primary flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {totalVolume >= 1000
                      ? `${(totalVolume / 1000).toFixed(1)} t`
                      : `${Math.round(totalVolume)} kg`} total
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
