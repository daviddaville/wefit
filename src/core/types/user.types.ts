export interface UserProfile {
  id: string
  email: string
  full_name: string
  first_name: string | null
  last_name: string | null
  age: number | null
  height_cm: number | null
  weight_kg: number | null
  goal_weight_kg: number | null
  created_at: string
}
