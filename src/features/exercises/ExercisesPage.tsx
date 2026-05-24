'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { getExerciseCatalog } from '@/core/services/exerciseService'
import { Exercise, ExerciseLevel, MuscleSide } from '@/core/types/workout.types'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ChevronRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Body region classification ────────────────────────────────────────────────
type BodyRegion = 'upper' | 'lower'

const normStr = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()

const REGION_BY_GROUP: Record<string, BodyRegion> = {
  pectoraux: 'upper', epaules: 'upper', deltoides: 'upper',
  biceps: 'upper', triceps: 'upper', dos: 'upper', dorsaux: 'upper',
  'avant-bras': 'upper', 'avants-bras': 'upper',
  trapezes: 'upper', nuque: 'upper', abdominaux: 'upper',
  quadriceps: 'lower', 'ischio-jambiers': 'lower', fessiers: 'lower',
  mollets: 'lower', lombaires: 'lower',
  'lombaires & ischio-jambiers': 'lower',
}

const REGION_BY_KEYWORD: Array<[RegExp, BodyRegion]> = [
  [/curl|biceps|triceps|pectoral|ecarte|developpe|pull.?over|epaule|delt|rowing|traction|tirage|nuque|trapeze/i, 'upper'],
  [/squat|fente|leg|mollet|fessier|ischio|lombaire|good.?morning|hack/i, 'lower'],
]

function getRegion(ex: Exercise): BodyRegion | null {
  const key = normStr(ex.muscle_group ?? '')
  if (REGION_BY_GROUP[key]) return REGION_BY_GROUP[key]
  const text = `${ex.name} ${ex.muscle_group}`
  for (const [re, region] of REGION_BY_KEYWORD) if (re.test(text)) return region
  return null
}

// ── Level metadata ────────────────────────────────────────────────────────────
const LEVEL_STARS: Record<ExerciseLevel, string> = {
  base: '★', advanced: '★★', finishing: '★★★',
}

// ── Filter types ──────────────────────────────────────────────────────────────
type SideTab   = MuscleSide | 'all'
type RegionTab = BodyRegion | 'all'

const SIDE_TABS: { value: SideTab; label: string }[] = [
  { value: 'all',       label: 'Tous'        },
  { value: 'anterior',  label: 'Antérieurs'  },
  { value: 'posterior', label: 'Postérieurs' },
]

const REGION_TABS: { value: RegionTab; label: string }[] = [
  { value: 'all',   label: 'Tout le corps' },
  { value: 'upper', label: 'Haut'          },
  { value: 'lower', label: 'Bas'           },
]

function FilterBar<T extends string>({
  tabs, value, onChange,
}: {
  tabs: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-lg border bg-muted/40 p-1 gap-1">
      {tabs.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'flex-1 rounded-md py-1.5 text-xs font-medium transition-colors',
            value === t.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export default function ExercisesPage() {
  const router = useRouter()
  const [side,   setSide]   = useState<SideTab>('all')
  const [region, setRegion] = useState<RegionTab>('all')

  const { data: allExercises = [], isLoading } = useQuery({
    queryKey: ['exercise-catalog'],
    queryFn: () => getExerciseCatalog(),
  })

  const exercises = allExercises.filter(ex => {
    if (side   !== 'all' && ex.muscle_side !== side) return false
    if (region !== 'all' && getRegion(ex) !== region) return false
    return true
  })

  // Group by muscle_group, sorted alphabetically
  const grouped = new Map<string, Exercise[]>()
  for (const ex of exercises) {
    const g = ex.muscle_group ?? 'Autres'
    if (!grouped.has(g)) grouped.set(g, [])
    grouped.get(g)!.push(ex)
  }
  const sortedGroups = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b, 'fr'))

  return (
    <div className="space-y-3">
      <FilterBar tabs={SIDE_TABS}   value={side}   onChange={setSide}   />
      <FilterBar tabs={REGION_TABS} value={region} onChange={setRegion} />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        sortedGroups.map(([group, exs]) => (
          <div key={group} className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
              {group}
            </p>
            <Card className="overflow-hidden">
              {exs.map((ex, idx) => (
                <div key={ex.id}>
                  {idx > 0 && <Separator />}
                  <button
                    className="w-full text-left"
                    onClick={() => router.push(`/exercises/${ex.id}`)}
                  >
                    <CardContent className="flex items-center justify-between py-3 px-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{ex.name}</p>
                        <span className="text-xs text-amber-500 font-medium mt-0.5 block">
                          {LEVEL_STARS[ex.level]}
                        </span>
                      </div>
                      {ex.joint_notes && (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mr-1" />
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </button>
                </div>
              ))}
            </Card>
          </div>
        ))
      )}

      {!isLoading && !exercises.length && (
        <p className="text-center text-sm text-muted-foreground py-12">
          Aucun exercice trouvé
        </p>
      )}
    </div>
  )
}
