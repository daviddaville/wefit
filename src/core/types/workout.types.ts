export type ExerciseLevel = 'base' | 'advanced' | 'finishing'
export type MuscleSide = 'anterior' | 'posterior'

export interface Exercise {
  id: string
  name: string
  muscle_group: string
  equipment: string | null
  default_rest_seconds: number
  joint_notes: string | null
  description: string | null
  video_url: string | null
  level: ExerciseLevel
  muscle_side: MuscleSide
  muscles_principaux: string[] | null
  muscles_secondaires: string[] | null
}

export type EquipmentType = 'dumbbells' | 'ez_bar' | 'straight_bar'

export interface SetsConfig {
  id: string
  workout_day_id: string
  exercise_id: string
  exercise_order: number
  sets_count: number
  rep_range_min: number
  rep_range_max: number
  rest_seconds: number
  initial_weight_kg: number | null
  current_weight_kg: number | null
  equipment_type: EquipmentType
  exercise?: Exercise
}

export interface WorkoutDay {
  id: string
  program_id: string
  name: string
  day_order: number
  notes: string | null
  sets_config?: SetsConfig[]
}

export interface Workout {
  id: string
  user_id: string
  workout_day_id: string
  started_at: string
  ended_at: string | null
  notes: string | null
}

export interface SetLog {
  id: string
  workout_id: string
  sets_config_id: string
  set_number: number
  weight_kg: number
  weight_left_kg: number | null
  weight_right_kg: number | null
  reps_done: number
  rest_taken_seconds: number | null
  logged_at: string
}

export type SetState = 'idle' | 'in_progress' | 'resting' | 'set_complete'
