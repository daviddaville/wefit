import { createClient } from './supabaseClient'
import { WorkoutDay, SetsConfig } from '../types/workout.types'
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
    .select('*, sets_config(*, exercise:exercises(*))')
    .eq('program_id', programId)
    .order('day_order')
  if (error) throw error
  return data ?? []
}

export async function getWorkoutDayById(workoutDayId: string): Promise<WorkoutDay | null> {
  const { data, error } = await db()
    .from('workout_days')
    .select('*, sets_config(*, exercise:exercises(*))')
    .eq('id', workoutDayId)
    .single()
  if (error) return null
  return data
}

export async function getUserPrograms(userId: string): Promise<Program[]> {
  const { data } = await db()
    .from('programs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createProgram(userId: string, name: string, description?: string): Promise<Program> {
  // Deactivate other programs first
  await db().from('programs').update({ is_active: false }).eq('user_id', userId)
  const { data, error } = await db()
    .from('programs')
    .insert({ user_id: userId, name, description: description ?? null, is_active: true })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function activateProgram(programId: string, userId: string): Promise<void> {
  await db().from('programs').update({ is_active: false }).eq('user_id', userId)
  await db().from('programs').update({ is_active: true }).eq('id', programId)
}

export async function createWorkoutDay(programId: string, name: string, order: number): Promise<WorkoutDay> {
  const { data, error } = await db()
    .from('workout_days')
    .insert({ program_id: programId, name, day_order: order, notes: null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteWorkoutDay(dayId: string): Promise<void> {
  const { error } = await db().from('workout_days').delete().eq('id', dayId)
  if (error) throw error
}

export async function addExerciseToDay(
  dayId: string,
  exerciseId: string,
  config: { sets_count: number; rep_range_min: number; rep_range_max: number; rest_seconds: number; order: number }
): Promise<SetsConfig> {
  const { data, error } = await db()
    .from('sets_config')
    .insert({
      workout_day_id: dayId,
      exercise_id: exerciseId,
      exercise_order: config.order,
      sets_count: config.sets_count,
      rep_range_min: config.rep_range_min,
      rep_range_max: config.rep_range_max,
      rest_seconds: config.rest_seconds,
    })
    .select('*, exercise:exercises(*)')
    .single()
  if (error) throw error
  return data
}

export async function removeExerciseFromDay(setsConfigId: string): Promise<void> {
  // Delete set_logs first to respect FK constraint
  await db().from('set_logs').delete().eq('sets_config_id', setsConfigId)
  const { error } = await db().from('sets_config').delete().eq('id', setsConfigId)
  if (error) throw error
}

export async function updateSetsConfig(
  id: string,
  updates: { sets_count?: number; rep_range_min?: number; rep_range_max?: number; rest_seconds?: number }
): Promise<void> {
  const { error } = await db().from('sets_config').update(updates).eq('id', id)
  if (error) throw error
}
