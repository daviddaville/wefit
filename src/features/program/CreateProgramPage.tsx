'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createClient } from '@/core/services/supabaseClient'
import { createProgram, createWorkoutDay } from '@/core/services/programService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, X } from 'lucide-react'

const DEFAULT_DAYS = ['Haut A', 'Haut B', 'Bas A', 'Bas B']

export default function CreateProgramPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [days, setDays] = useState<string[]>(DEFAULT_DAYS)
  const [newDay, setNewDay] = useState('')

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await createClient().auth.getSession()
      return data.session
    },
  })

  const { mutate: submit, isPending } = useMutation({
    mutationFn: async () => {
      if (!session?.user.id) throw new Error('Non authentifié')
      const program = await createProgram(session.user.id, name.trim(), description.trim() || undefined)
      await Promise.all(
        days.map((dayName, i) => createWorkoutDay(program.id, dayName, i + 1))
      )
      return program
    },
    onSuccess: () => router.push('/program'),
  })

  const removeDay = (idx: number) => setDays(d => d.filter((_, i) => i !== idx))

  const addDay = () => {
    const trimmed = newDay.trim()
    if (!trimmed) return
    setDays(d => [...d, trimmed])
    setNewDay('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addDay() }
  }

  const canSubmit = name.trim().length > 0 && days.length > 0 && !isPending

  return (
    <div className="space-y-6 pb-8">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.push('/program')}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Programme
      </Button>

      <div>
        <h2 className="text-xl font-bold">Nouveau programme</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Définissez vos séances d'entraînement</p>
      </div>

      {/* Program info */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Nom du programme</label>
          <Input
            className="mt-1"
            placeholder="Ex : PPL, Full Body, 4 jours…"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Description (optionnel)</label>
          <Input
            className="mt-1"
            placeholder="Notes, objectifs…"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </div>

      {/* Workout days */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Séances ({days.length})
        </h3>

        <Card className="overflow-hidden">
          {days.map((day, idx) => (
            <div key={idx} className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t' : ''}`}>
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                {idx + 1}
              </div>
              <span className="flex-1 text-sm">{day}</span>
              <button
                onClick={() => removeDay(idx)}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {days.length === 0 && (
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">Ajoutez au moins une séance</p>
            </CardContent>
          )}
        </Card>

        {/* Add day input */}
        <div className="flex gap-2">
          <Input
            placeholder="Nom de la séance…"
            value={newDay}
            onChange={e => setNewDay(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button variant="outline" size="icon" onClick={addDay} disabled={!newDay.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button
        className="w-full"
        disabled={!canSubmit}
        onClick={() => submit()}
      >
        {isPending ? 'Création…' : 'Créer le programme'}
      </Button>
    </div>
  )
}
