import OpenAI from 'openai'
import { NextRequest } from 'next/server'
import { PERSONAS, PersonaId } from '@/core/config/coachPersonas'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { messages, personaId, userContext } = await req.json()

  const persona = PERSONAS[personaId as PersonaId] ?? PERSONAS.motivateur

  const contextBlock = userContext ? `
--- Contexte athlète ---
${userContext.name ? `Prénom : ${userContext.name}` : ''}
${userContext.age ? `Âge : ${userContext.age} ans` : ''}
${userContext.height_cm ? `Taille : ${userContext.height_cm} cm` : ''}
${userContext.weight_kg ? `Poids : ${userContext.weight_kg} kg` : ''}
${userContext.goal_weight_kg ? `Objectif poids : ${userContext.goal_weight_kg} kg` : ''}
${userContext.currentProgram ? `Programme actuel : ${userContext.currentProgram}` : ''}
${userContext.lastSession ? `Dernière séance : ${userContext.lastSession}` : ''}
------------------------` : ''

  const systemPrompt = `${persona.systemPrompt}
${contextBlock}
Ne mentionne pas ces données sauf si c'est pertinent dans la conversation.
Réponds toujours en français. Sois concis sauf si une analyse détaillée est demandée.`

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    stream: true,
    max_tokens: 600,
    temperature: 0.85,
  })

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
