'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { getWorkoutDayById, addExerciseToDay, removeExerciseFromDay, updateSetsConfig } from '@/core/services/programService'
import { getExerciseCatalog } from '@/core/services/exerciseService'
import { SetsConfig } from '@/core/types/workout.types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trash2, Plus, Search, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props { dayId: string; programId: string }

// Inline sets/reps editor
function ConfigEditor({ config, onSave }: { config: SetsConfig; onSave: (u: Partial<SetsConfig>) => void }) {
  const [open, setOpen] = useState(false)
  const [sets, setSets]   = useState(config.sets_count)
  const [rmin, setRmin]   = useState(config.rep_range_min)
  const [rmax, setRmax]   = useState(config.rep_range_max)
  const [rest, setRest]   = useState(config.rest_seconds)

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        {config.sets_count}×{config.rep_range_min}–{config.rep_range_max} · {config.rest_seconds}s
        <ChevronDown className="h-3 w-3" />
      </button>
    )
  }

  return (
    <div className="mt-2 space-y-2 bg-muted/40 rounded-lg p-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Séries</label>
          <Input type="number" value={sets} min={1} max={10}
            onChange={e => setSets(Number(e.target.value))}
            className="h-8 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Repos (s)</label>
          <Input type="number" value={rest} min={0} step={15}
            onChange={e => setRest(Number(e.target.value))}
            className="h-8 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Reps min</label>
          <Input type="number" value={rmin} min={1}
            onChange={e => setRmin(Number(e.target.value))}
            className="h-8 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Reps max</label>
          <Input type="number" value={rmax} min={1}
            onChange={e => setRmax(Number(e.target.value))}
            className="h-8 text-sm mt-1" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => { onSave({ sets_count: sets, rep_range_min: rmin, rep_range_max: rmax, rest_seconds: rest }); setOpen(false) }}>
          Enregistrer
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Exercise picker
function ExercisePicker({ dayId, currentCount, onAdd }: { dayId: string; currentCount: number; onAdd: () => void }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercise-catalog'],
    queryFn: () => getExerciseCatalog(),
    enabled: open,
  })

  const { mutate: add, isPending } = useMutation({
    mutationFn: (exerciseId: string) => addExerciseToDay(dayId, exerciseId, {
      sets_count: 3, rep_range_min: 8, rep_range_max: 12, rest_seconds: 90,
      order: currentCount + 1,
    }),
    onSuccess: () => { onAdd(); setOpen(false); setSearch('') },
  })

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.muscle_group ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (!open) {
    return (
      <Button variant="outline" className="w-full gap-2 border-dashed" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Ajouter un exercice
      </Button>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-3 border-b flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>✕</Button>
      </div>
      <div className="max-h-64 overflow-y-auto divide-y">
        {filtered.slice(0, 30).map(ex => (
          <button
            key={ex.id}
            disabled={isPending}
            onClick={() => add(ex.id)}
            className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors flex items-center justify-between gap-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{ex.name}</p>
              <p className="text-xs text-muted-foreground">{ex.muscle_group}</p>
            </div>
            <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">Aucun exercice trouvé</p>
        )}
      </div>
    </div>
  )
}

export default function EditDayPage({ dayId, programId }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: day, isLoading } = useQuery({
    queryKey: ['workout-day', dayId],
    queryFn: () => getWorkoutDayById(dayId),
  })

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => removeExerciseFromDay(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout-day', dayId] }),
  })

  const { mutate: update } = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SetsConfig> }) =>
      updateSetsConfig(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout-day', dayId] }),
  })

  const sets = day?.sets_config ?? []

  return (
    <div className="space-y-4 pb-8">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.push(`/program`)}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Programme
      </Button>

      <div>
        <h2 className="text-xl font-bold">{day?.name ?? '…'}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{sets.length} exercice{sets.length > 1 ? 's' : ''}</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <Card className="overflow-hidden">
          {sets.map((s, idx) => (
            <div key={s.id}>
              {idx > 0 && <Separator />}
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.exercise?.name ?? '—'}</p>
                    <Badge variant="secondary" className="text-xs h-4 mt-0.5">
                      {s.exercise?.muscle_group}
                    </Badge>
                    <ConfigEditor
                      config={s}
                      onSave={updates => update({ id: s.id, updates })}
                    />
                  </div>
                  <button
                    onClick={() => remove(s.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </div>
          ))}
          {sets.length === 0 && (
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Aucun exercice. Ajoutez-en un ci-dessous.</p>
            </CardContent>
          )}
        </Card>
      )}

      <ExercisePicker
        dayId={dayId}
        currentCount={sets.length}
        onAdd={() => {
          queryClient.invalidateQueries({ queryKey: ['workout-day', dayId] })
          queryClient.invalidateQueries({ queryKey: ['workout-days'] })
        }}
      />
    </div>
  )
}
