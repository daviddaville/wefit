import { create } from 'zustand'
import { SetLog, SetState, SetsConfig, Workout } from '../types/workout.types'

interface SessionState {
  activeWorkout: Workout | null
  currentExerciseIndex: number
  currentSetNumber: number
  setLogs: SetLog[]
  setStates: Record<string, SetState>
  restSecondsLeft: number
  restTotal: number

  setActiveWorkout: (workout: Workout | null) => void
  logSet: (log: SetLog) => void
  startRest: (exerciseConfigId: string, durationSeconds: number) => void
  tickRest: (secondsLeft: number) => void
  completeRest: () => void
  nextExercise: () => void
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

  setActiveWorkout: workout => set({ activeWorkout: workout }),
  logSet: log => set(s => ({ setLogs: [...s.setLogs, log] })),
  startRest: (id, duration) =>
    set(s => ({
      setStates: { ...s.setStates, [id]: 'resting' },
      restSecondsLeft: duration,
      restTotal: duration,
    })),
  tickRest: secondsLeft => set({ restSecondsLeft: secondsLeft }),
  completeRest: () => set({ restSecondsLeft: 0 }),
  nextExercise: () =>
    set(s => ({
      currentExerciseIndex: s.currentExerciseIndex + 1,
      currentSetNumber: 1,
    })),
  reset: () =>
    set({
      activeWorkout: null,
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      setLogs: [],
      setStates: {},
      restSecondsLeft: 0,
      restTotal: 0,
    }),
}))
