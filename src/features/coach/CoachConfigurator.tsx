'use client'

import { PERSONAS, PersonaId } from '@/core/config/coachPersonas'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  currentPersona: PersonaId
  onSelect: (id: PersonaId) => void
  onClose: () => void
}

export default function CoachConfigurator({ currentPersona, onSelect, onClose }: Props) {
  return (
    <div className="space-y-4 pb-8">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={onClose}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Retour
      </Button>

      <div>
        <h2 className="text-xl font-bold">Choisis ton coach</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Chaque coach a sa personnalité — trouve celui qui te correspond.
        </p>
      </div>

      <div className="space-y-3">
        {Object.values(PERSONAS).map(p => {
          const isActive = p.id === currentPersona
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="w-full text-left"
            >
              <Card className={cn(
                'overflow-hidden transition-all',
                isActive ? 'border-primary ring-1 ring-primary' : 'hover:border-muted-foreground/40',
              )}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-2xl shrink-0">
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{p.name}</p>
                      <span className="text-xs text-muted-foreground">· {p.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {p.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>
    </div>
  )
}
