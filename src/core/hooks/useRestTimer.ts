'use client'

import { useCallback, useRef } from 'react'
import { useSessionStore } from '../stores/sessionStore'
import { playEndSound } from '../utils/soundHelper'

export function useRestTimer() {
  const rafRef = useRef<number | null>(null)
  const { tickRest, completeRest } = useSessionStore()

  const startRestTimer = useCallback(
    (durationSeconds: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

      const endTime = Date.now() + durationSeconds * 1000

      const tick = () => {
        const remaining = Math.ceil((endTime - Date.now()) / 1000)
        if (remaining <= 0) {
          completeRest()
          playEndSound()
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200])
          }
          return
        }
        tickRest(remaining)
        rafRef.current = requestAnimationFrame(tick)
      }

      rafRef.current = requestAnimationFrame(tick)
    },
    [tickRest, completeRest],
  )

  const stopRestTimer = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  return { startRestTimer, stopRestTimer }
}
