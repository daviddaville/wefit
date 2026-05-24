'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/core/services/supabaseClient'
import { getUserProfile, upsertUserProfile } from '@/core/services/userService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { User, Ruler, Scale, Target, CalendarDays, CheckCircle, AlertCircle } from 'lucide-react'
import WeightTracker from './WeightTracker'

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  })
  const userId = session?.user.id

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getUserProfile(userId!),
    enabled: !!userId,
  })

  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [age,       setAge]       = useState('')
  const [height,    setHeight]    = useState('')
  const [weight,    setWeight]    = useState('')
  const [goalWeight, setGoalWeight] = useState('')
  const [initialized, setInitialized] = useState(false)

  if (profile && !initialized) {
    setFirstName(profile.first_name ?? profile.full_name.split(' ')[0] ?? '')
    setLastName(profile.last_name ?? profile.full_name.split(' ').slice(1).join(' ') ?? '')
    setAge(profile.age?.toString() ?? '')
    setHeight(profile.height_cm?.toString() ?? '')
    setWeight(profile.weight_kg?.toString() ?? '')
    setGoalWeight(profile.goal_weight_kg?.toString() ?? '')
    setInitialized(true)
  }

  const { mutate: save, isPending, isSuccess, isError } = useMutation({
    mutationFn: () => {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      return upsertUserProfile({
        id: userId!,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        full_name: fullName || (profile?.full_name ?? ''),
        age: age ? parseInt(age, 10) : null,
        height_cm: height ? parseFloat(height) : null,
        weight_kg: weight ? parseFloat(weight) : null,
        goal_weight_kg: goalWeight ? parseFloat(goalWeight) : null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] })
    },
  })

  const weightNum   = parseFloat(weight)
  const goalNum     = parseFloat(goalWeight)
  const initialNum  = profile?.weight_kg ?? weightNum
  const progress    = !isNaN(weightNum) && !isNaN(goalNum) && initialNum !== goalNum
    ? Math.min(100, Math.max(0, Math.round(
        ((initialNum - weightNum) / (initialNum - goalNum)) * 100,
      )))
    : null

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Avatar header */}
      <div className="flex flex-col items-center gap-3 py-2">
        <Avatar className="h-20 w-20 text-xl">
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
            {firstName || lastName
              ? initials(firstName || '?', lastName || firstName || '?')
              : <User className="h-8 w-8" />}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="font-semibold text-lg leading-tight">
            {firstName || lastName ? `${firstName} ${lastName}`.trim() : '—'}
          </p>
          <p className="text-xs text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      {/* Progress toward goal */}
      {progress !== null && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Scale className="h-3 w-3" />{weightNum} kg
              </span>
              <span className="font-medium text-foreground">
                {progress}% vers l&apos;objectif
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />{goalNum} kg
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Identity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Identité
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">Prénom</Label>
              <Input
                id="first_name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="David"
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Dupont"
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="age" className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              Âge
            </Label>
            <Input
              id="age"
              type="number"
              min={10}
              max={100}
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="46"
              className="w-28"
            />
          </div>
        </CardContent>
      </Card>

      {/* Physique */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            Physique
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="height" className="flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
              Taille (cm)
            </Label>
            <Input
              id="height"
              type="number"
              min={100}
              max={250}
              step={0.5}
              value={height}
              onChange={e => setHeight(e.target.value)}
              placeholder="187"
              className="w-28"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="weight" className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                Poids (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                min={30}
                max={300}
                step={0.5}
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="112"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal" className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                Objectif (kg)
              </Label>
              <Input
                id="goal"
                type="number"
                min={30}
                max={300}
                step={0.5}
                value={goalWeight}
                onChange={e => setGoalWeight(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      {isSuccess && (
        <div className="flex items-center gap-2 rounded-md border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Profil enregistré
        </div>
      )}
      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Erreur lors de l&apos;enregistrement
        </div>
      )}

      <Button className="w-full" onClick={() => save()} disabled={isPending || !userId}>
        {isPending ? 'Enregistrement…' : 'Sauvegarder'}
      </Button>

      {/* Weight tracker */}
      {userId && (
        <WeightTracker userId={userId} goalWeight={profile?.goal_weight_kg} />
      )}
    </div>
  )
}
