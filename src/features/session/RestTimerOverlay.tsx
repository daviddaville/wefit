'use client'

import { useSessionStore } from '@/core/stores/sessionStore'
import { formatRestTime, calcRestProgress } from '@/core/utils/restTimerHelper'

export default function RestTimerOverlay() {
  const { restSecondsLeft, restTotal } = useSessionStore()
  const progress = calcRestProgress(restTotal - restSecondsLeft, restTotal)

  return (
    <div className="rounded-xl border bg-card p-6 flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground uppercase tracking-widest">Repos</p>
      <span className="font-mono text-6xl font-bold tabular-nums">
        {formatRestTime(restSecondsLeft)}
      </span>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
