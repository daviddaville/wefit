'use client'

import { useState } from 'react'
import { SetsConfig } from '@/core/types/workout.types'
import { useWorkoutSession } from '@/core/hooks/useWorkoutSession'
import { useLastPerformance } from '@/core/hooks/useLastPerformance'
import { useProgressionLogic } from '@/core/hooks/useProgressionLogic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, Clock, Target } from 'lucide-react'
import WeightRepInput from './WeightRepInput'
import StartSetButton from './StartSetButton'

interface Props {
  config: SetsConfig
}

export default function ExerciseCard({ config }: Props) {
  const { finishSet, currentSetNumber } = useWorkoutSession()
  const { data: lastPerf = [] } = useLastPerformance(config.id)
  const { suggestedWeight } = useProgressionLogic(config)

  const lastSet = lastPerf.find(l => l.set_number === currentSetNumber)
  const [weight, setWeight] = useState(suggestedWeight || lastSet?.weight_kg || 0)
  const [reps, setReps] = useState(lastSet?.reps_done || config.rep_range_min)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base leading-tight">{config.exercise?.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{config.exercise?.muscle_group}</p>
          </div>
          <Badge variant="outline" className="shrink-0 gap-1 text-xs">
            <Target className="h-3 w-3" />
            {currentSetNumber}/{config.sets_count}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="secondary" className="gap-1 text-xs">
            <Target className="h-3 w-3" />
            {config.rep_range_min}–{config.rep_range_max} reps
          </Badge>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Clock className="h-3 w-3" />
            {config.rest_seconds}s repos
          </Badge>
          {lastSet && (
            <Badge className="gap-1 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              <TrendingUp className="h-3 w-3" />
              {lastSet.weight_kg} kg × {lastSet.reps_done}
            </Badge>
          )}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4 space-y-4">
        <WeightRepInput weight={weight} reps={reps} onWeightChange={setWeight} onRepsChange={setReps} />
        <StartSetButton onFinish={() => finishSet(config, weight, reps)} />
      </CardContent>
    </Card>
  )
}
