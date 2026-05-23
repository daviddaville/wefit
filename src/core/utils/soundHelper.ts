'use client'

let synth: import('tone').Synth | null = null

async function getSynth() {
  if (synth) return synth
  const { Synth } = await import('tone')
  synth = new Synth({ oscillator: { type: 'sine' } }).toDestination()
  return synth
}

export async function playEndSound(): Promise<void> {
  try {
    const { getContext } = await import('tone')
    if (getContext().state !== 'running') {
      await getContext().resume()
    }
    const s = await getSynth()
    s.triggerAttackRelease('A5', '0.2')
  } catch {
    // Audio not available (SSR / user hasn't interacted)
  }
}
