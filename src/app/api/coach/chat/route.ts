import OpenAI from 'openai'
import { NextRequest } from 'next/server'
import { PERSONAS, PersonaId } from '@/core/config/coachPersonas'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function buildSystemPrompt(personaId: PersonaId, userContext: any) {
  const persona = PERSONAS[personaId] ?? PERSONAS.motivateur
  const ctx = userContext ? [
    userContext.name           && `Prénom : ${userContext.name}`,
    userContext.age            && `Âge : ${userContext.age} ans`,
    userContext.height_cm      && `Taille : ${userContext.height_cm} cm`,
    userContext.weight_kg      && `Poids : ${userContext.weight_kg} kg`,
    userContext.goal_weight_kg && `Objectif : ${userContext.goal_weight_kg} kg`,
    userContext.currentProgram && `Programme : ${userContext.currentProgram}`,
  ].filter(Boolean).join('\n') : ''

  return `${persona.systemPrompt}
${ctx ? `\n--- Athlète ---\n${ctx}\n---------------\n` : ''}
Réponds en français. Sois concis (2-4 phrases max) sauf si une analyse est demandée.`
}

export async function POST(req: NextRequest) {
  // Parse body
  let body: any
  try {
    body = await req.json()
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Corps de requête invalide' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const { messages = [], personaId = 'motivateur', userContext } = body
  const systemPrompt = buildSystemPrompt(personaId as PersonaId, userContext)

  // Non-streaming for reliability — we'll upgrade once confirmed working
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 600,
      temperature: 0.85,
    })

    const content = completion.choices[0]?.message?.content ?? ''
    return new Response(content, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: any) {
    const detail = err?.message ?? String(err)
    console.error('[coach/chat] OpenAI error:', detail)
    return new Response(JSON.stringify({ error: detail }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
