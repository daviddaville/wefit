import OpenAI from 'openai'
import { NextRequest } from 'next/server'
import { PERSONAS, PersonaId } from '@/core/config/coachPersonas'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface DiagnoseRequest {
  personaId: PersonaId
  profile: {
    name?: string
    age?: number
    height_cm?: number
    weight_kg?: number
    goal_weight_kg?: number
  }
  goals: string[]           // ['prise_de_masse', 'perte_de_gras', 'forme']
  level: string             // 'debutant' | 'intermediaire' | 'avance'
  daysPerWeek: number
  minutesPerSession: number
  equipment: string[]
  limitations?: string
  exercises: { name: string; muscle_group: string; level: string }[]
}

export async function POST(req: NextRequest) {
  const body: DiagnoseRequest = await req.json()
  const persona = PERSONAS[body.personaId] ?? PERSONAS.motivateur

  const exerciseList = body.exercises
    .map(e => `- ${e.name} (${e.muscle_group}, ${e.level})`)
    .join('\n')

  const prompt = `${persona.systemPrompt}

Tu dois créer un programme d'entraînement personnalisé pour cet athlète.

## Profil
- Prénom : ${body.profile.name ?? 'Non renseigné'}
- Âge : ${body.profile.age ?? '?'} ans
- Taille : ${body.profile.height_cm ?? '?'} cm
- Poids : ${body.profile.weight_kg ?? '?'} kg
- Objectif poids : ${body.profile.goal_weight_kg ?? '?'} kg
- Objectifs : ${body.goals.join(', ')}
- Niveau : ${body.level}
- Disponibilité : ${body.daysPerWeek} jours/semaine, ${body.minutesPerSession} min/séance
- Matériel : ${body.equipment.join(', ')}
${body.limitations ? `- Limitations/blessures : ${body.limitations}` : ''}

## Exercices disponibles dans le catalogue
${exerciseList}

## Instructions
Crée un programme d'entraînement complet en JSON.
- Utilise UNIQUEMENT les exercices du catalogue ci-dessus (nom exact).
- Adapte le nombre de séances au nombre de jours disponibles.
- Adapte les exercices au matériel disponible.
- Adapte les sets/reps au niveau et aux objectifs.
- Donne un nom au programme qui reflète la personnalité du coach.
- Inclus un message de motivation du coach en intro.

Réponds UNIQUEMENT avec ce JSON (pas de markdown, pas d'explication) :
{
  "coach_message": "Message de motivation du coach en character",
  "program_name": "Nom du programme",
  "description": "Description courte",
  "workout_days": [
    {
      "name": "Nom de la séance",
      "day_order": 1,
      "exercises": [
        {
          "exercise_name": "Nom exact de l'exercice",
          "sets_count": 4,
          "rep_range_min": 8,
          "rep_range_max": 12,
          "rest_seconds": 90
        }
      ]
    }
  ]
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0].message.content ?? '{}'

  try {
    const program = JSON.parse(content)
    return Response.json({ ok: true, program })
  } catch {
    return Response.json({ ok: false, error: 'Parsing error', raw: content }, { status: 500 })
  }
}
