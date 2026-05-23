import { createClient } from './supabaseClient'
import { WorkoutDay } from '../types/workout.types'
import { Program } from '../types/program.types'

const db = () => createClient()

export async function getActiveProgram(userId: string): Promise<Program | null> {
  const { data, error } = await db()
    .from('programs')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()
  if (error) return null
  return data
}

export async function getProgramWorkoutDays(programId: string): Promise<WorkoutDay[]> {
  const { data, error } = await db()
    .from('workout_days')
    .select('*, sets_config(*, exercises(*))')
    .eq('program_id', programId)
    .order('day_order')
  if (error) throw error
  return data ?? []
}
