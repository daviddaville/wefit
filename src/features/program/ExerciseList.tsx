'use client'

import { SetsConfig } from '@/core/types/workout.types'

interface Props {
  sets: SetsConfig[]
}

export default function ExerciseList({ sets }: Props) {
  return (
    <div className="space-y-2">
      {sets.map(s => (
        <div key={s.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <div>
            <p className="font-medium">{s.exercise?.name}</p>
            <p className="text-xs text-muted-foreground">{s.exercise?.muscle_group}</p>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            {s.sets_count} × {s.rep_range_min}–{s.rep_range_max}
          </p>
        </div>
      ))}
    </div>
  )
}
