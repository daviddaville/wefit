import { create } from 'zustand'
import { SetLog, SetState, SetsConfig, Workout } from '../types/workout.types'

interface WeightMemory {
  weight: number
  weightLeft: number | null
  weightRight: number | null
  reps: number
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
  sessionStartedAt: number | null              // unix ms
  restOverride: Record<string, number>         // configId -> seconds

  setActiveWorkout: (workout: Workout | null) => void
  logSet: (log: SetLog) => void
  startRest: (exerciseConfigId: string, durationSeconds: number, setsCount: number) => void
  tickRest: (secondsLeft: number) => void
  completeRest: () => void
  nextExercise: () => void
  rememberWeight: (configId: string, mem: WeightMemory) => void
  setSessionStartedAt: (ts: number) => void
  setRestOverride: (configId: string, seconds: number) => void
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
  sessionStartedAt: null,
  restOverride: {},

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
  setSessionStartedAt: ts => set({ sessionStartedAt: ts }),
  setRestOverride: (configId, seconds) =>
    set(s => ({ restOverride: { ...s.restOverride, [configId]: seconds } })),
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
      sessionStartedAt: null,
      restOverride: {},
    }),
}))
