'use client'

import Link from 'next/link'
import { WorkoutDay } from '@/core/types/workout.types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAY_COLORS: Record<number, string> = {
  1: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  2: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  3: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  4: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
}

interface Props {
  workoutDays: WorkoutDay[]
}

export default function WorkoutSelector({ workoutDays }: Props) {
  if (!workoutDays.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Zap className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Aucune séance configurée.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-2.5">
      {workoutDays.map(day => (
        <Link key={day.id} href={`/session/${day.id}`}>
          <Card className="transition-colors hover:bg-accent cursor-pointer group">
            <CardContent className="flex items-center gap-4 py-4">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-bold',
                  DAY_COLORS[day.day_order] ?? 'bg-muted',
                )}
              >
                J{day.day_order}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium leading-tight">{day.name}</p>
                {day.notes && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{day.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {day.sets_config?.length ? (
                  <Badge variant="outline" className="text-xs">
                    {day.sets_config.length} ex.
                  </Badge>
                ) : null}
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
