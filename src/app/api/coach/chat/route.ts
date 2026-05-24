import OpenAI from 'openai'
import { NextRequest } from 'next/server'
import { PERSONAS, PersonaId } from '@/core/config/coachPersonas'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function buildSystemPrompt(personaId: PersonaId, userContext: any) {
  const persona = PERSONAS[personaId] ?? PERSONAS.motivateur

  const ctx = userContext ? [
    userContext.name        && `Prénom : ${userContext.name}`,
    userContext.age         && `Âge : ${userContext.age} ans`,
    userContext.height_cm   && `Taille : ${userContext.height_cm} cm`,
    userContext.weight_kg   && `Poids actuel : ${userContext.weight_kg} kg`,
    userContext.goal_weight_kg && `Objectif : ${userContext.goal_weight_kg} kg`,
    userContext.currentProgram && `Programme actuel : ${userContext.currentProgram}`,
  ].filter(Boolean).join('\n') : ''

  return `${persona.systemPrompt}

${ctx ? `--- Contexte athlète ---\n${ctx}\n------------------------\nN'utilise ces infos que si c'est pertinent.` : ''}

Réponds en français. Sois concis (2-4 phrases) sauf si une analyse est demandée.`
}

export async function POST(req: NextRequest) {
  try {
    const { messages, personaId, userContext } = await req.json()

    const systemPrompt = buildSystemPrompt(personaId as PersonaId, userContext)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
      max_tokens: 600,
      temperature: 0.85,
    })

    // openai v5+ exposes .toReadableStream() directly on the stream object
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content
            if (text) controller.enqueue(encoder.encode(text))
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err: any) {
    console.error('[coach/chat]', err)
    return Response.json(
      { error: err?.message ?? 'Erreur OpenAI' },
      { status: 500 }
    )
  }
}
