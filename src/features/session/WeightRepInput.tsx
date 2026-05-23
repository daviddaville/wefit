'use client'

import { Button } from '@/components/ui/button'
import { Minus, Plus } from 'lucide-react'

interface Props {
  weight: number
  reps: number
  onWeightChange: (v: number) => void
  onRepsChange: (v: number) => void
}

function Stepper({
  label,
  value,
  onDecrement,
  onIncrement,
  unit,
}: {
  label: string
  value: number
  onDecrement: () => void
  onIncrement: () => void
  unit: string
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-muted-foreground uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={onDecrement}>
          <Minus className="h-4 w-4" />
        </Button>
        <div className="min-w-16 text-center">
          <span className="font-mono text-3xl font-bold tabular-nums">{value}</span>
          <span className="text-xs text-muted-foreground ml-1">{unit}</span>
        </div>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={onIncrement}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function WeightRepInput({ weight, reps, onWeightChange, onRepsChange }: Props) {
  return (
    <div className="flex items-center justify-around py-2">
      <Stepper
        label="Poids"
        value={weight}
        unit="kg"
        onDecrement={() => onWeightChange(Math.max(0, weight - 0.5))}
        onIncrement={() => onWeightChange(weight + 0.5)}
      />
      <div className="h-12 w-px bg-border" />
      <Stepper
        label="Reps"
        value={reps}
        unit=""
        onDecrement={() => onRepsChange(Math.max(1, reps - 1))}
        onIncrement={() => onRepsChange(reps + 1)}
      />
    </div>
  )
}
