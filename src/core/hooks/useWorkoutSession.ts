import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSessionStore } from '../stores/sessionStore'
import { useRestTimer } from './useRestTimer'
import { logSet as logSetService, startWorkout, endWorkout } from '../services/workoutService'
import { SetsConfig } from '../types/workout.types'

export function useWorkoutSession() {
  const store = useSessionStore()
  const { startRestTimer } = useRestTimer()
  const queryClient = useQueryClient()

  const startSession = useCallback(
    async (workoutDayId: string, userId: string) => {
      const workout = await startWorkout(workoutDayId, userId)
      store.setActiveWorkout(workout)
      return workout
    },
    [store],
  )

  const finishSet = useCallback(
    async (config: SetsConfig, weightKg: number, repsDone: number) => {
      if (!store.activeWorkout) return

      const log = await logSetService({
        workout_id: store.activeWorkout.id,
        sets_config_id: config.id,
        set_number: store.currentSetNumber,
        weight_kg: weightKg,
        reps_done: repsDone,
      })

      store.logSet(log)
      store.startRest(config.id, config.rest_seconds)
      startRestTimer(config.rest_seconds)

      queryClient.invalidateQueries({ queryKey: ['last-performance', config.id] })
    },
    [store, startRestTimer, queryClient],
  )

  const finishSession = useCallback(
    async (notes?: string) => {
      if (!store.activeWorkout) return
      await endWorkout(store.activeWorkout.id, notes)
      queryClient.invalidateQueries({ queryKey: ['workout-history'] })
      store.reset()
    },
    [store, queryClient],
  )

  return { startSession, finishSet, finishSession, ...store }
}
