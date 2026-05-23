import { createClient } from './supabaseClient'
import { UserProfile } from '../types/user.types'

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
