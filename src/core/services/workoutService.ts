import { createClient } from './supabaseClient'
import { SetLog, Workout } from '../types/workout.types'

const db = () => createClient()

export async function startWorkout(workoutDayId: string, userId: string): Promise<Workout> {
  const { data, error } = await db()
    .from('workouts')
    .insert({ workout_day_id: workoutDayId, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function endWorkout(workoutId: string, notes?: string): Promise<void> {
  const { error } = await db()
    .from('workouts')
    .update({ ended_at: new Date().toISOString(), notes: notes ?? null })
    .eq('id', workoutId)
  if (error) throw error
}

export async function logSet(payload: {
  workout_id: string
  sets_config_id: string
  set_number: number
  weight_kg: number
  weight_left_kg?: number | null
  weight_right_kg?: number | null
  reps_done: number
  rest_taken_seconds?: number
}): Promise<SetLog> {
  const { data, error } = await db().from('set_logs').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateEquipmentType(setsConfigId: string, equipmentType: string): Promise<void> {
  const { error } = await db()
    .from('sets_config')
    .update({ equipment_type: equipmentType })
    .eq('id', setsConfigId)
  if (error) throw error
}

export async function getLastPerformance(setsConfigId: string): Promise<SetLog[]> {
  const { data, error } = await db()
    .from('set_logs')
    .select('*, workouts!inner(ended_at)')
    .eq('sets_config_id', setsConfigId)
    .not('workouts.ended_at', 'is', null)
    .order('logged_at', { ascending: false })
    .limit(10)
  if (error) throw error
  return (data ?? []) as SetLog[]
}

export async function getSetLogHistory(setsConfigId: string): Promise<SetLog[]> {
  const { data, error } = await db()
    .from('set_logs')
    .select('*')
    .eq('sets_config_id', setsConfigId)
    .order('logged_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getWorkoutHistory(userId: string): Promise<Workout[]> {
  const { data, error } = await db()
    .from('workouts')
    .select('*, workout_days(name)')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
