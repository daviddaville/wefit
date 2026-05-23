'use client'

import { Workout } from '@/core/types/workout.types'

interface Props {
  workout: Workout & { workout_days?: { name: string } }
}

export default function WorkoutSummary({ workout }: Props) {
  const date = new Date(workout.started_at)
  const duration = workout.ended_at
    ? Math.round((new Date(workout.ended_at).getTime() - date.getTime()) / 60000)
    : null

  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <div className="flex items-center justify-between">
        <p className="font-medium">{workout.workout_days?.name ?? 'Séance'}</p>
        <span className="text-xs text-muted-foreground">
          {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      {duration !== null && (
        <p className="text-xs text-muted-foreground">{duration} min</p>
      )}
      {workout.notes && <p className="text-sm text-muted-foreground italic">{workout.notes}</p>}
    </div>
  )
}
