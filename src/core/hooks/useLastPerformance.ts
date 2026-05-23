import { useQuery } from '@tanstack/react-query'
import { getLastPerformance } from '../services/workoutService'

export function useLastPerformance(setsConfigId: string) {
  return useQuery({
    queryKey: ['last-performance', setsConfigId],
    queryFn: () => getLastPerformance(setsConfigId),
    staleTime: 1000 * 60 * 5,
    enabled: !!setsConfigId,
  })
}
