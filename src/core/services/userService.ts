import { createClient } from './supabaseClient'
import { UserProfile, WeightLog } from '../types/user.types'

const db = () => createClient()

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await db().from('users').select('*').eq('id', userId).single()
  if (error) return null
  return data
}

export async function upsertUserProfile(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile> {
  const { data, error } = await db().from('users').upsert(profile).select().single()
  if (error) throw error
  return data
}

export async function getWeightHistory(userId: string, days = 60): Promise<WeightLog[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data, error } = await db()
    .from('weight_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_date', since.toISOString().slice(0, 10))
    .order('logged_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function logWeight(userId: string, weight_kg: number, logged_date: string): Promise<WeightLog> {
  const { data, error } = await db()
    .from('weight_logs')
    .upsert({ user_id: userId, weight_kg, logged_date }, { onConflict: 'user_id,logged_date' })
    .select()
    .single()
  if (error) throw error
  return data
}
