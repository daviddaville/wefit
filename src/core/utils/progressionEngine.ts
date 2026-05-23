import { SetLog, SetsConfig } from '../types/workout.types'
import { SHOULDER_EXERCISES } from '../constants/muscleGroups'

function roundToPlate(weight: number): number {
  return Math.round(weight * 2) / 2
}

function groupBySession(history: SetLog[]): SetLog[][] {
  const sessions = new Map<string, SetLog[]>()
  for (const log of history) {
    const key = log.workout_id
    if (!sessions.has(key)) sessions.set(key, [])
    sessions.get(key)!.push(log)
  }
  return Array.from(sessions.values())
}

export function computeNextWeight(history: SetLog[], config: SetsConfig): number {
  const sessions = groupBySession(history)
  if (sessions.length === 0) return config.current_weight_kg ?? config.initial_weight_kg ?? 0

  const lastSession = sessions[0]
  const allSetsCompleted = lastSession.every(s => s.reps_done >= config.rep_range_max)
  const twoSetsFailed = lastSession.filter(s => s.reps_done < config.rep_range_min).length >= 2

  const isShoulderExercise = config.exercise?.name
    ? SHOULDER_EXERCISES.includes(config.exercise.name)
    : false
  const maxIncrease = isShoulderExercise ? 2.5 : Infinity
  const currentWeight = config.current_weight_kg ?? config.initial_weight_kg ?? 0

  if (allSetsCompleted) {
    const increase = Math.min(1.25, maxIncrease)
    return roundToPlate(currentWeight + increase)
  }
  if (twoSetsFailed) {
    return roundToPlate(currentWeight * 0.95)
  }
  return currentWeight
}
