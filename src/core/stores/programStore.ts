import { create } from 'zustand'
import { Program } from '../types/program.types'
import { WorkoutDay } from '../types/workout.types'

interface ProgramState {
  activeProgram: Program | null
  workoutDays: WorkoutDay[]
  setActiveProgram: (program: Program | null) => void
  setWorkoutDays: (days: WorkoutDay[]) => void
}

export const useProgramStore = create<ProgramState>(set => ({
  activeProgram: null,
  workoutDays: [],
  setActiveProgram: program => set({ activeProgram: program }),
  setWorkoutDays: days => set({ workoutDays: days }),
}))
