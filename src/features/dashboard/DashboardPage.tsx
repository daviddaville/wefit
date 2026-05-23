'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/core/services/supabaseClient'
import { getProgramWorkoutDays, getActiveProgram } from '@/core/services/programService'
import { Dumbbell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import WorkoutSelector from './WorkoutSelector'

export default function DashboardPage() {
  const supabase = createClient()

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession()
      return data.session
    },
  })

  const userId = session?.user.id

  const { data: program } = useQuery({
    queryKey: ['active-program', userId],
    queryFn: () => getActiveProgram(userId!),
    enabled: !!userId,
  })

  const { data: workoutDays = [], isLoading } = useQuery({
    queryKey: ['workout-days', program?.id],
    queryFn: () => getProgramWorkoutDays(program!.id),
    enabled: !!program?.id,
  })

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            Programme actif
          </p>
          <h2 className="text-lg font-semibold leading-tight">
            {program?.name ?? '—'}
          </h2>
        </div>
        {program && (
          <Badge variant="secondary" className="mt-1 gap-1">
            <Dumbbell className="h-3 w-3" />
            Actif
          </Badge>
        )}
      </div>

      <Separator />

      <div>
        <p className="text-xs text-muted-foreground mb-3">Choisir une séance</p>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <WorkoutSelector workoutDays={workoutDays} />
        )}
      </div>
    </div>
  )
}
