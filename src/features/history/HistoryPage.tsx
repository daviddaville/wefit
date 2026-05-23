'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/core/services/supabaseClient'
import { getWorkoutHistory } from '@/core/services/workoutService'
import WorkoutSummary from './WorkoutSummary'

export default function HistoryPage() {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await createClient().auth.getSession()
      return data.session
    },
  })

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['workout-history', session?.user.id],
    queryFn: () => getWorkoutHistory(session!.user.id),
    enabled: !!session?.user.id,
  })

  if (isLoading) return <p className="text-muted-foreground text-sm">Chargement...</p>
  if (!history.length) return <p className="text-muted-foreground text-sm">Aucune séance enregistrée.</p>

  return (
    <div className="space-y-3">
      {history.map(workout => (
        <WorkoutSummary key={workout.id} workout={workout} />
      ))}
    </div>
  )
}
