import { useQuery } from '@tanstack/react-query'
import { computeNextWeight } from '../utils/progressionEngine'
import { getSetLogHistory } from '../services/workoutService'
import { SetsConfig } from '../types/workout.types'

export function useProgressionLogic(config: SetsConfig) {
  const { data: history = [] } = useQuery({
    queryKey: ['set-log-history', config.id],
    queryFn: () => getSetLogHistory(config.id),
    staleTime: 1000 * 60 * 5,
  })

  const suggestedWeight = computeNextWeight(history, config)

  return { suggestedWeight, history }
}
