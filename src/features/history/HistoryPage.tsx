'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createClient } from '@/core/services/supabaseClient'
import { getWorkoutHistory, getTodayActiveWorkout, endWorkout } from '@/core/services/workoutService'
import WorkoutSummary from './WorkoutSummary'
import { Button } from '@/components/ui/button'
import { PlayCircle, StopCircle, Clock } from 'lucide-react'

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const today    = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const day = new Date(d); day.setHours(0,0,0,0)
  if (day.getTime() === today.getTime())     return "Aujourd'hui"
  if (day.getTime() === yesterday.getTime()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function dayKey(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

export default function HistoryPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

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
    refetchOnMount: 'always',
  })

  const { data: activeWorkout } = useQuery({
    queryKey: ['today-active', session?.user.id],
    queryFn: () => getTodayActiveWorkout(session!.user.id),
    enabled: !!session?.user.id,
    refetchOnMount: 'always',
  })

  const { mutate: terminateSession, isPending: isTerminating } = useMutation({
    mutationFn: () => endWorkout(activeWorkout!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-history'] })
      queryClient.invalidateQueries({ queryKey: ['today-active'] })
    },
  })

  // Group completed workouts by calendar day
  const groupedByDay = useMemo(() => {
    const map = new Map<string, typeof history>()
    for (const w of history) {
      const key = dayKey(w.started_at)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(w)
    }
    return [...map.entries()]
  }, [history])

  const todayKey = new Date().toLocaleDateString('fr-FR')

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Today's active session banner */}
      {activeWorkout && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-sm font-semibold text-primary">Séance en cours</p>
            <p className="text-sm text-muted-foreground ml-auto">
              {(activeWorkout as any).workout_day?.name ?? ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm" className="flex-1 gap-2"
              onClick={() => router.push(`/session/${activeWorkout.workout_day_id}`)}
            >
              <PlayCircle className="h-4 w-4" />
              Reprendre
            </Button>
            <Button
              size="sm" variant="outline" className="flex-1 gap-2 text-destructive border-destructive/30"
              onClick={() => terminateSession()}
              disabled={isTerminating}
            >
              <StopCircle className="h-4 w-4" />
              Terminer
            </Button>
          </div>
        </div>
      )}

      {/* Daily groups */}
      {groupedByDay.length === 0 && !activeWorkout && (
        <p className="text-center text-sm text-muted-foreground py-12">
          Aucune séance enregistrée.
        </p>
      )}

      {groupedByDay.map(([key, workouts]) => (
        <div key={key} className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className={`text-sm font-semibold capitalize ${key === todayKey ? 'text-primary' : 'text-foreground'}`}>
              {formatDayLabel(workouts[0].started_at)}
            </h3>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {workouts.reduce((acc, w) => {
                if (!w.ended_at) return acc
                return acc + Math.round((new Date(w.ended_at).getTime() - new Date(w.started_at).getTime()) / 60000)
              }, 0)} min
            </div>
          </div>
          <div className="space-y-2">
            {workouts.map(w => <WorkoutSummary key={w.id} workout={w as any} />)}
          </div>
        </div>
      ))}
    </div>
  )
}
