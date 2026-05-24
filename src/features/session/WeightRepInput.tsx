'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Link, Unlink } from 'lucide-react'
import { cn } from '@/lib/utils'

function Stepper({
  label, value, onDecrement, onIncrement, unit,
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

interface SingleProps {
  mode: 'single'
  weight: number
  reps: number
  onWeightChange: (v: number) => void
  onRepsChange: (v: number) => void
}

interface DualProps {
  mode: 'dual'
  weightLeft: number
  weightRight: number
  reps: number
  onWeightLeftChange: (v: number) => void
  onWeightRightChange: (v: number) => void
  onRepsChange: (v: number) => void
}

type Props = SingleProps | DualProps

export default function WeightRepInput(props: Props) {
  const { reps, onRepsChange } = props

  // Start linked if both sides are equal
  const [linked, setLinked] = useState(
    props.mode === 'dual' ? props.weightLeft === props.weightRight : false,
  )

  const repsNode = (
    <Stepper
      label="Reps"
      value={reps}
      unit=""
      onDecrement={() => onRepsChange(Math.max(1, reps - 1))}
      onIncrement={() => onRepsChange(reps + 1)}
    />
  )

  if (props.mode === 'dual') {
    const setLeft = (v: number) => {
      props.onWeightLeftChange(v)
      if (linked) props.onWeightRightChange(v)
    }
    const setRight = (v: number) => {
      props.onWeightRightChange(v)
      if (linked) props.onWeightLeftChange(v)
    }

    const toggleLinked = () => {
      if (!linked) {
        // Sync right to left when linking
        props.onWeightRightChange(props.weightLeft)
      }
      setLinked(l => !l)
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-around py-2 relative">
          <Stepper
            label="Haltère G"
            value={props.weightLeft}
            unit="kg"
            onDecrement={() => setLeft(Math.max(0, props.weightLeft - 0.5))}
            onIncrement={() => setLeft(props.weightLeft + 0.5)}
          />

          {/* Link toggle */}
          <button
            onClick={toggleLinked}
            className={cn(
              'flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors',
              linked
                ? 'text-primary bg-primary/10 hover:bg-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            {linked
              ? <Link className="h-4 w-4" />
              : <Unlink className="h-4 w-4" />
            }
            <span className="text-[10px] font-medium leading-none">
              {linked ? 'Lié' : 'Libre'}
            </span>
          </button>

          <Stepper
            label="Haltère D"
            value={props.weightRight}
            unit="kg"
            onDecrement={() => setRight(Math.max(0, props.weightRight - 0.5))}
            onIncrement={() => setRight(props.weightRight + 0.5)}
          />
        </div>
        <div className="flex justify-center border-t pt-3">
          {repsNode}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-around py-2">
      <Stepper
        label="Poids"
        value={props.weight}
        unit="kg"
        onDecrement={() => props.onWeightChange(Math.max(0, props.weight - 0.5))}
        onIncrement={() => props.onWeightChange(props.weight + 0.5)}
      />
      <div className="h-12 w-px bg-border" />
      {repsNode}
    </div>
  )
}
