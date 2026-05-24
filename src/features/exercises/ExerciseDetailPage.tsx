'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { getExerciseById } from '@/core/services/exerciseService'
import { ExerciseLevel } from '@/core/types/workout.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft, Dumbbell, Clock, AlertTriangle, FileText, Video, Ruler,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const LEVEL_META: Record<ExerciseLevel, { label: string; stars: string; color: string }> = {
  base:      { label: 'BASE',     stars: '★',   color: 'bg-amber-500   text-white' },
  advanced:  { label: 'AVANCÉS',  stars: '★★',  color: 'bg-orange-500  text-white' },
  finishing: { label: 'FINITION', stars: '★★★', color: 'bg-red-500     text-white' },
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

interface Props { exerciseId: string }

export default function ExerciseDetailPage({ exerciseId }: Props) {
  const router = useRouter()

  const { data: exercise, isLoading } = useQuery({
    queryKey: ['exercise', exerciseId],
    queryFn: () => getExerciseById(exerciseId),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-muted-foreground">Exercice introuvable.</p>
        <Button variant="ghost" onClick={() => router.back()}>Retour</Button>
      </div>
    )
  }

  const meta = LEVEL_META[exercise.level]
  const vidId = exercise.video_url ? youtubeId(exercise.video_url) : null

  return (
    <div className="space-y-4 pb-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Exercices
      </Button>

      {/* Hero header */}
      <div className={cn('rounded-xl px-4 py-4 space-y-2', meta.color)}>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
            {exercise.muscle_side === 'anterior' ? 'Muscles antérieurs' : 'Muscles postérieurs'}
          </Badge>
          <span className="text-lg">{meta.stars}</span>
        </div>
        <h1 className="text-lg font-bold leading-tight">{exercise.name}</h1>
        <p className="text-sm text-white/80">{meta.label}</p>
      </div>

      {/* Video */}
      {vidId ? (
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${vidId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex items-center justify-center aspect-video rounded-xl bg-muted text-muted-foreground gap-2 text-sm">
          <Video className="h-5 w-5" />
          Pas encore de vidéo
        </div>
      )}

      {/* Fiche type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Fiche type
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start gap-3">
            <Dumbbell className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Muscles travaillés</p>
              {exercise.muscles_principaux?.length ? (
                <div className="space-y-1.5">
                  <div>
                    <span className="text-xs font-semibold text-foreground">Principaux : </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {exercise.muscles_principaux.join(', ')}
                    </span>
                  </div>
                  {exercise.muscles_secondaires?.length ? (
                    <div>
                      <span className="text-xs font-semibold text-foreground">Secondaires : </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {exercise.muscles_secondaires.join(', ')}
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm font-medium">{exercise.muscle_group}</p>
              )}
            </div>
          </div>

          {exercise.equipment && (
            <div className="flex items-start gap-3">
              <Ruler className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Équipement</p>
                <p className="text-sm font-medium capitalize">{exercise.equipment}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Repos recommandé</p>
              <p className="text-sm font-medium">{exercise.default_rest_seconds}s</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {exercise.description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Exécution</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {exercise.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Joint warning */}
      {exercise.joint_notes && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-0.5">
              Prudence articulaire
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {exercise.joint_notes}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
