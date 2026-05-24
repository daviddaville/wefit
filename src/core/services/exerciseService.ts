import { createClient } from './supabaseClient'
import { Exercise, ExerciseLevel, MuscleSide } from '../types/workout.types'

const db = () => createClient()

export async function getExerciseCatalog(filters?: {
  muscle_side?: MuscleSide
  level?: ExerciseLevel
}): Promise<Exercise[]> {
  let query = db().from('exercises').select('*').order('muscle_group').order('name')
  if (filters?.muscle_side) query = query.eq('muscle_side', filters.muscle_side)
  if (filters?.level)       query = query.eq('level', filters.level)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const { data, error } = await db().from('exercises').select('*').eq('id', id).single()
  if (error) return null
  return data
}
