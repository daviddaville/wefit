'use client'

import { useQuery } from '@tanstack/react-query'
import { getProgramWorkoutDays } from '@/core/services/programService'
import { useWorkoutSession } from '@/core/hooks/useWorkoutSession'
import ExerciseCard from './ExerciseCard'
import RestTimerOverlay from './RestTimerOverlay'
import { Button } from '@/components/ui/button'
import { createClient } from '@/core/services/supabaseClient'

interface Props {
  workoutDayId: string
}

export default function SessionPage({ workoutDayId }: Props) {
  const { startSession, finishSession, activeWorkout, currentExerciseIndex, restSecondsLeft } =
    useWorkoutSession()

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await createClient().auth.getSession()
      return data.session
    },
  })

  const { data: days = [] } = useQuery({
    queryKey: ['workout-days-for-session', workoutDayId],
    queryFn: async () => {
      const programId = workoutDayId
      return getProgramWorkoutDays(programId)
    },
  })

  const workoutDay = days.find(d => d.id === workoutDayId)
  const exercises = workoutDay?.sets_config ?? []
  const currentConfig = exercises[currentExerciseIndex]
  const isResting = restSecondsLeft > 0

  const handleStart = async () => {
    if (!session?.user.id) return
    await startSession(workoutDayId, session.user.id)
  }

  if (!activeWorkout) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <h2 className="text-xl font-semibold">{workoutDay?.name ?? 'Séance'}</h2>
        <Button size="lg" onClick={handleStart}>
          Démarrer la séance
        </Button>
      </div>
    )
  }

  if (!currentConfig) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <h2 className="text-xl font-semibold">Séance terminée !</h2>
        <Button onClick={() => finishSession()}>Enregistrer et quitter</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Exercice {currentExerciseIndex + 1} / {exercises.length}
        </span>
        <Button variant="ghost" size="sm" onClick={() => finishSession()}>
          Terminer
        </Button>
      </div>

      {isResting && <RestTimerOverlay />}
      {!isResting && currentConfig && <ExerciseCard config={currentConfig} />}
    </div>
  )
}
