'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SetsConfig, EquipmentType } from '@/core/types/workout.types'
import { useWorkoutSession } from '@/core/hooks/useWorkoutSession'
import { useLastPerformance } from '@/core/hooks/useLastPerformance'
import { useProgressionLogic } from '@/core/hooks/useProgressionLogic'
import { updateEquipmentType } from '@/core/services/workoutService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, Clock, Target, Minus, Plus } from 'lucide-react'
import WeightRepInput from './WeightRepInput'
import StartSetButton from './StartSetButton'

interface Props {
  config: SetsConfig
}

const EQUIPMENT_OPTIONS: { value: EquipmentType; label: string }[] = [
  { value: 'dumbbells',     label: 'Haltères' },
  { value: 'ez_bar',        label: 'Barre Z'  },
  { value: 'straight_bar',  label: 'Barre ↕'  },
]

export default function ExerciseCard({ config }: Props) {
  const { finishSet, currentSetNumber, weightMemory, restOverride, setRestOverride } = useWorkoutSession()
  const { data: lastPerf = [] } = useLastPerformance(config.id)
  const { suggestedWeight } = useProgressionLogic(config)
  const router = useRouter()

  const lastSet = lastPerf.find(l => l.set_number === currentSetNumber)
  const defaultWeight = suggestedWeight || lastSet?.weight_kg || config.current_weight_kg || 0

  const mem = weightMemory[config.id]
  const currentRest = restOverride[config.id] ?? config.rest_seconds

  const [equipment, setEquipment] = useState<EquipmentType>(config.equipment_type ?? 'dumbbells')
  const [weight,      setWeight]     = useState(mem?.weight      ?? defaultWeight)
  const [weightLeft,  setWeightLeft]  = useState(mem?.weightLeft  ?? lastSet?.weight_left_kg  ?? defaultWeight)
  const [weightRight, setWeightRight] = useState(mem?.weightRight ?? lastSet?.weight_right_kg ?? defaultWeight)
  const [reps,        setReps]        = useState(mem?.reps        ?? lastSet?.reps_done        ?? config.rep_range_min)

  const handleEquipmentChange = async (eq: EquipmentType) => {
    setEquipment(eq)
    await updateEquipmentType(config.id, eq).catch(() => {})
  }

  const handleFinish = () => {
    if (equipment === 'dumbbells') {
      finishSet(config, (weightLeft + weightRight) / 2, reps, weightLeft, weightRight)
    } else {
      finishSet(config, weight, reps)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle
              className="text-base leading-tight cursor-pointer hover:text-primary transition-colors"
              onClick={() => config.exercise?.id && router.push(`/exercises/${config.exercise.id}`)}
            >
              {config.exercise?.name}
            </CardTitle>
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

          {/* Rest time — editable inline */}
          <div className="flex items-center gap-1 rounded-full border px-2 py-0.5 bg-secondary text-secondary-foreground text-xs">
            <Clock className="h-3 w-3" />
            <button
              className="hover:text-primary transition-colors"
              onClick={() => setRestOverride(config.id, Math.max(15, currentRest - 15))}
            >
              <Minus className="h-2.5 w-2.5" />
            </button>
            <span className="tabular-nums font-medium w-8 text-center">{currentRest}s</span>
            <button
              className="hover:text-primary transition-colors"
              onClick={() => setRestOverride(config.id, currentRest + 15)}
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          </div>

          {lastSet && (
            <Badge className="gap-1 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              <TrendingUp className="h-3 w-3" />
              {lastSet.weight_left_kg != null && lastSet.weight_right_kg != null
                ? lastSet.weight_left_kg === lastSet.weight_right_kg
                  ? `${lastSet.weight_left_kg} kg`
                  : `G ${lastSet.weight_left_kg} / D ${lastSet.weight_right_kg} kg`
                : `${lastSet.weight_kg} kg`} × {lastSet.reps_done}
            </Badge>
          )}
        </div>

        {/* Equipment selector */}
        <div className="flex gap-1 pt-2">
          {EQUIPMENT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleEquipmentChange(opt.value)}
              className={`flex-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                equipment === opt.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4 space-y-4">
        {equipment === 'dumbbells' ? (
          <WeightRepInput
            mode="dual"
            weightLeft={weightLeft}
            weightRight={weightRight}
            reps={reps}
            onWeightLeftChange={setWeightLeft}
            onWeightRightChange={setWeightRight}
            onRepsChange={setReps}
          />
        ) : (
          <WeightRepInput
            mode="single"
            weight={weight}
            reps={reps}
            onWeightChange={setWeight}
            onRepsChange={setReps}
          />
        )}
        <StartSetButton onFinish={handleFinish} />
      </CardContent>
    </Card>
  )
}
