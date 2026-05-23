'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/core/services/supabaseClient'
import { getActiveProgram, getProgramWorkoutDays } from '@/core/services/programService'
import ExerciseList from './ExerciseList'

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

  const { data: days = [] } = useQuery({
    queryKey: ['workout-days', program?.id],
    queryFn: () => getProgramWorkoutDays(program!.id),
    enabled: !!program?.id,
  })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{program?.name ?? 'Programme'}</h2>
      {days.map(day => (
        <div key={day.id} className="space-y-2">
          <h3 className="font-medium text-base">{day.name}</h3>
          <ExerciseList sets={day.sets_config ?? []} />
        </div>
      ))}
    </div>
  )
}
