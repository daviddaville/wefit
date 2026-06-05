import OpenAI from 'openai'
import { NextRequest } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { PERSONAS, PersonaId } from '@/core/config/coachPersonas'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function db() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// ── Tools ─────────────────────────────────────────────────────────────────────

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_exercise_catalog',
      description: 'Récupère les exercices disponibles dans WeFit, filtrés par groupe musculaire si besoin.',
      parameters: {
        type: 'object',
        properties: {
          muscle_groups: {
            type: 'array',
            items: { type: 'string' },
            description: 'Groupes musculaires à filtrer (ex: ["Pectoraux","Biceps"]). Omit pour tout récupérer.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_program',
      description: 'Crée un programme d\'entraînement complet directement dans WeFit pour l\'athlète. Appelle d\'abord get_exercise_catalog pour utiliser uniquement des exercices existants.',
      parameters: {
        type: 'object',
        required: ['program_name', 'description', 'workout_days'],
        properties: {
          program_name: { type: 'string', description: 'Nom du programme' },
          description:  { type: 'string', description: 'Description courte' },
          workout_days: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'day_order', 'exercises'],
              properties: {
                name:      { type: 'string' },
                day_order: { type: 'number' },
                exercises: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['exercise_name', 'sets_count', 'rep_range_min', 'rep_range_max', 'rest_seconds'],
                    properties: {
                      exercise_name: { type: 'string', description: 'Nom exact de l\'exercice dans le catalogue' },
                      sets_count:    { type: 'number' },
                      rep_range_min: { type: 'number' },
                      rep_range_max: { type: 'number' },
                      rest_seconds:  { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
]

// ── Tool execution ─────────────────────────────────────────────────────────────

async function execGetCatalog(args: { muscle_groups?: string[] }): Promise<string> {
  let query = db().from('exercises').select('name, muscle_group, level').order('muscle_group').order('name')
  if (args.muscle_groups?.length) query = query.in('muscle_group', args.muscle_groups)
  const { data, error } = await query.limit(200)
  if (error) return JSON.stringify({ error: error.message })
  return JSON.stringify(data)
}

async function execCreateProgram(userId: string, args: any): Promise<string> {
  const supabase = db()

  // 1. Désactiver les programmes actifs existants
  await supabase.from('programs').update({ is_active: false }).eq('user_id', userId)

  // 2. Créer le programme
  const { data: prog, error: progErr } = await supabase
    .from('programs')
    .insert({ user_id: userId, name: args.program_name, description: args.description, is_active: true })
    .select()
    .single()
  if (progErr || !prog) return JSON.stringify({ ok: false, error: progErr?.message })

  // 3. Créer séances + exercices
  for (const day of args.workout_days ?? []) {
    const { data: dayData, error: dayErr } = await supabase
      .from('workout_days')
      .insert({ program_id: prog.id, name: day.name, day_order: day.day_order })
      .select()
      .single()
    if (dayErr || !dayData) continue

    for (let i = 0; i < (day.exercises ?? []).length; i++) {
      const ex = day.exercises[i]
      const { data: exRow } = await supabase
        .from('exercises')
        .select('id')
        .ilike('name', ex.exercise_name)
        .maybeSingle()
      if (!exRow) continue

      await supabase.from('sets_config').insert({
        workout_day_id: dayData.id,
        exercise_id:    exRow.id,
        exercise_order: i + 1,
        sets_count:     ex.sets_count    ?? 3,
        rep_range_min:  ex.rep_range_min ?? 8,
        rep_range_max:  ex.rep_range_max ?? 12,
        rest_seconds:   ex.rest_seconds  ?? 90,
        equipment_type: 'dumbbells',
      })
    }
  }

  return JSON.stringify({ ok: true, program_name: args.program_name, days: args.workout_days?.length })
}

// ── System prompt ──────────────────────────────────────────────────────────────

function buildSystemPrompt(personaId: PersonaId, userContext: any) {
  const persona = PERSONAS[personaId] ?? PERSONAS.motivateur
  const ctx = userContext ? [
    userContext.name           && `Prénom : ${userContext.name}`,
    userContext.age            && `Âge : ${userContext.age} ans`,
    userContext.height_cm      && `Taille : ${userContext.height_cm} cm`,
    userContext.weight_kg      && `Poids : ${userContext.weight_kg} kg`,
    userContext.goal_weight_kg && `Objectif : ${userContext.goal_weight_kg} kg`,
    userContext.currentProgram && `Programme actuel : ${userContext.currentProgram}`,
  ].filter(Boolean).join('\n') : ''

  return `${persona.systemPrompt}
${ctx ? `\n--- Athlète ---\n${ctx}\n---------------\n` : ''}
Réponds en français. Sois concis (2-4 phrases max) sauf si analyse demandée.

RÈGLES ABSOLUES :
1. Ne JAMAIS recommander une app concurrente (Strong, Hevy, FitBod, Strava…).
2. Pour créer un programme : appelle D'ABORD get_exercise_catalog, PUIS create_program avec des exercices du catalogue uniquement. Ne propose jamais un programme en texte libre sans l'avoir créé en BDD.
3. Après create_program, annonce à l'athlète que son programme est prêt dans l'onglet Programme de WeFit.`
}

// ── Handler ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Corps de requête invalide' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const { messages = [], personaId = 'motivateur', userContext, userId } = body
  const systemPrompt = buildSystemPrompt(personaId as PersonaId, userContext)

  const conversationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]

  try {
    // Tool use loop — max 5 rounds
    for (let round = 0; round < 5; round++) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: conversationMessages,
        tools: TOOLS,
        tool_choice: 'auto',
        max_tokens: 1000,
        temperature: 0.85,
      })

      const choice = completion.choices[0]
      conversationMessages.push(choice.message as OpenAI.Chat.ChatCompletionMessageParam)

      if (choice.finish_reason !== 'tool_calls') {
        return new Response(choice.message.content ?? '', {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }

      // Execute tool calls
      for (const toolCall of choice.message.tool_calls ?? []) {
        const args = JSON.parse(toolCall.function.arguments)
        let result: string

        if (toolCall.function.name === 'get_exercise_catalog') {
          result = await execGetCatalog(args)
        } else if (toolCall.function.name === 'create_program') {
          if (!userId) {
            result = JSON.stringify({ ok: false, error: 'userId manquant' })
          } else {
            result = await execCreateProgram(userId, args)
          }
        } else {
          result = JSON.stringify({ error: 'Outil inconnu' })
        }

        conversationMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        })
      }
    }

    return new Response('Désolé, je n\'ai pas pu terminer. Réessaie !', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: any) {
    console.error('[coach/chat] error:', err?.message)
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
