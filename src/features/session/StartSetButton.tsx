'use client'

import { Button } from '@/components/ui/button'

interface Props {
  onFinish: () => void
}

export default function StartSetButton({ onFinish }: Props) {
  return (
    <Button onClick={onFinish} size="lg" className="w-full">
      Fin de série
    </Button>
  )
}
