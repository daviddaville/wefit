export function formatRestTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function calcRestProgress(elapsed: number, total: number): number {
  if (total === 0) return 100
  return Math.min(100, (elapsed / total) * 100)
}
