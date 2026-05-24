'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createClient } from '@/core/services/supabaseClient'
import { getActiveProgram, getProgramWorkoutDays } from '@/core/services/programService'
import { WorkoutDay } from '@/core/types/workout.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PlayCircle, Dumbbell } from 'lucide-react'

const DAY_COLOR: Record<string, string> = {
  'haut a': 'bg-blue-500',
  'haut b': 'bg-indigo-500',
  'bas a':  'bg-emerald-500',
  'bas b':  'bg-teal-500',
}

function dayColor(name: string) {
  return DAY_COLOR[name.toLowerCase()] ?? 'bg-primary'
}

function WorkoutDayCard({ day }: { day: WorkoutDay }) {
  const router = useRouter()
  const sets = day.sets_config ?? []

  // Group exercises by muscle_group
  const groups = sets.reduce<Record<string, string[]>>((acc, s) => {
    const g = s.exercise?.muscle_group ?? 'Autres'
    if (!acc[g]) acc[g] = []
    acc[g].push(s.exercise?.name ?? '—')
    return acc
  }, {})

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0 pt-0 px-0">
        <div className={`${dayColor(day.name)} px-4 py-3 flex items-center justify-between`}>
          <CardTitle className="text-base font-bold text-white">{day.name}</CardTitle>
          <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
            {sets.length} exercice{sets.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-0 py-0">
        {sets.length === 0 ? (
          <p className="text-sm text-muted-foreground px-4 py-4">Aucun exercice configuré</p>
        ) : (
          <>
            {Object.entries(groups).map(([group, names], idx) => (
              <div key={group}>
                {idx > 0 && <Separator />}
                <div className="px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </p>
                  {names.map((name, i) => {
                    const s = sets.find(sc => sc.exercise?.name === name)
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Dumbbell className="h-3 w-3 text-muted-foreground shrink-0" />
                          <p className="text-sm truncate">{name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-2">
                          {s?.sets_count} × {s?.rep_range_min}–{s?.rep_range_max}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            <Separator />
            <div className="px-4 py-3">
              <Button
                className="w-full gap-2"
                onClick={() => router.push(`/session/${day.id}`)}
              >
                <PlayCircle className="h-4 w-4" />
                Démarrer la séance
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function ProgramOverviewPage() {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await createClient().auth.getSession()
      return data.session
    },
  })

  const { data: program } = useQuery({
    queryKey: ['active-program', session?.user.id],
    queryFn: () => getActiveProgram(session!.user.id),
    enabled: !!session?.user.id,
  })

  const { data: days = [], isLoading } = useQuery({
    queryKey: ['workout-days', program?.id],
    queryFn: () => getProgramWorkoutDays(program!.id),
    enabled: !!program?.id,
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{program?.name ?? 'Programme'}</h2>
        {program?.name && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {days.length} séance{days.length > 1 ? 's' : ''} · rotation A/B
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        days.map(day => <WorkoutDayCard key={day.id} day={day} />)
      )}
    </div>
  )
}
