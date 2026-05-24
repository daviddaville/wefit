import OpenAI from 'openai'
import { NextRequest } from 'next/server'
import { PERSONAS, PersonaId } from '@/core/config/coachPersonas'

export const dynamic = 'force-dynamic'

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
  goals: string[]
  level: string
  daysPerWeek: number
  minutesPerSession: number
  equipment: string[]
  limitations?: string
  exercises: { name: string; muscle_group: string; level: string }[]
}

// Keywords in exercise names that require specific equipment IDs
const EQUIPMENT_KEYWORDS: { pattern: RegExp; ids: string[] }[] = [
  { pattern: /poulie/i,       ids: ['poulie_haute', 'poulie_basse'] },
  { pattern: /presse/i,       ids: ['presse'] },
  { pattern: /smith/i,        ids: ['smith_machine'] },
  { pattern: /convergent/i,   ids: ['machine_convergente'] },
  { pattern: /pec.?deck/i,    ids: ['machine_convergente'] },
  { pattern: /traction/i,     ids: ['barre_fixe', 'poulie_haute'] },
  { pattern: /dips/i,         ids: ['barres_paralleles'] },
]

function filterByEquipment(
  exercises: DiagnoseRequest['exercises'],
  equipment: string[],
): DiagnoseRequest['exercises'] {
  const equipSet = new Set(equipment)
  return exercises.filter(ex => {
    for (const rule of EQUIPMENT_KEYWORDS) {
      if (rule.pattern.test(ex.name)) {
        // keep only if user has at least one of the required equipment items
        if (!rule.ids.some(id => equipSet.has(id))) return false
      }
    }
    return true
  })
}

export async function POST(req: NextRequest) {
  let body: DiagnoseRequest
  try {
    body = await req.json()
  } catch (e) {
    return Response.json({ ok: false, error: 'Corps de requête invalide' }, { status: 400 })
  }

  const persona = PERSONAS[body.personaId] ?? PERSONAS.motivateur

  // Filter exercises by selected equipment to avoid impossible suggestions
  const filteredExercises = filterByEquipment(body.exercises, body.equipment)

  // Limit to avoid token overflow
  const exerciseList = filteredExercises
    .slice(0, 150)
    .map((e: DiagnoseRequest['exercises'][number]) => `- ${e.name} (${e.muscle_group}, ${e.level})`)
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
- INTERDIT ABSOLU : n'utilise JAMAIS un exercice nécessitant du matériel absent de la liste ci-dessus.
- Adapte le nombre de séances au nombre de jours disponibles.
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

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content ?? '{}'

    try {
      const program = JSON.parse(content)
      return Response.json({ ok: true, program })
    } catch {
      console.error('[coach/diagnose] JSON parse error, raw:', content.slice(0, 200))
      return Response.json({ ok: false, error: 'Erreur de parsing JSON', raw: content }, { status: 500 })
    }
  } catch (err: any) {
    const detail = err?.message ?? String(err)
    console.error('[coach/diagnose] OpenAI error:', detail)
    return Response.json({ ok: false, error: detail }, { status: 500 })
  }
}
