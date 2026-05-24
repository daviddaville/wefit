import { create } from 'zustand'
import { SetLog, SetState, SetsConfig, Workout } from '../types/workout.types'

interface WeightMemory {
  weight: number
  weightLeft: number | null
  weightRight: number | null
}

interface SessionState {
  activeWorkout: Workout | null
  currentExerciseIndex: number
  currentSetNumber: number
  setLogs: SetLog[]
  setStates: Record<string, SetState>
  restSecondsLeft: number
  restTotal: number
  pendingSetsCount: number
  weightMemory: Record<string, WeightMemory>   // keyed by sets_config id

  setActiveWorkout: (workout: Workout | null) => void
  logSet: (log: SetLog) => void
  startRest: (exerciseConfigId: string, durationSeconds: number, setsCount: number) => void
  tickRest: (secondsLeft: number) => void
  completeRest: () => void
  nextExercise: () => void
  rememberWeight: (configId: string, mem: WeightMemory) => void
  reset: () => void
}

export const useSessionStore = create<SessionState>(set => ({
  activeWorkout: null,
  currentExerciseIndex: 0,
  currentSetNumber: 1,
  setLogs: [],
  setStates: {},
  restSecondsLeft: 0,
  restTotal: 0,
  pendingSetsCount: 1,
  weightMemory: {},

  setActiveWorkout: workout => set({ activeWorkout: workout }),
  logSet: log => set(s => ({ setLogs: [...s.setLogs, log] })),
  startRest: (id, duration, setsCount) =>
    set(s => ({
      setStates: { ...s.setStates, [id]: 'resting' },
      restSecondsLeft: duration,
      restTotal: duration,
      pendingSetsCount: setsCount,
    })),
  tickRest: secondsLeft => set({ restSecondsLeft: secondsLeft }),
  completeRest: () =>
    set(s => {
      // Advance to next set or next exercise
      if (s.currentSetNumber < s.pendingSetsCount) {
        return { restSecondsLeft: 0, currentSetNumber: s.currentSetNumber + 1 }
      }
      return { restSecondsLeft: 0, currentExerciseIndex: s.currentExerciseIndex + 1, currentSetNumber: 1 }
    }),
  nextExercise: () =>
    set(s => ({
      currentExerciseIndex: s.currentExerciseIndex + 1,
      currentSetNumber: 1,
    })),
  rememberWeight: (configId, mem) =>
    set(s => ({ weightMemory: { ...s.weightMemory, [configId]: mem } })),
  reset: () =>
    set({
      activeWorkout: null,
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      setLogs: [],
      setStates: {},
      restSecondsLeft: 0,
      restTotal: 0,
      pendingSetsCount: 1,
      weightMemory: {},
    }),
}))
