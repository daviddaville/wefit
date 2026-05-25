/**
 * Update exercise descriptions, muscles, video URLs.
 * Run: node scripts/update-exercise-description.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '../.env.seed')

let envVars = {}
try {
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const [k, ...v] = line.split('=')
    if (k && v.length) envVars[k.trim()] = v.join('=').trim()
  }
} catch {
  console.error('❌ Fichier .env.seed introuvable.')
  process.exit(1)
}

const supabase = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const UPDATES = [
  {
    name: 'Curl marteau avec haltères',
    description: `Debout, dans une position stable (dos droit, pieds de la largeur des épaules), les mains en prise neutre, effectuez une flexion des coudes en les gardant serrés près du corps.

Ne pas tendre complètement les coudes en bas du mouvement afin de ne pas placer le biceps et le long supinateur dans une position de faiblesse pouvant conduire à la blessure.

La prise neutre désactive partiellement le biceps qui ne peut exprimer sa pleine force comme en supination, accentuant ainsi le travail du brachial antérieur et du long supinateur.

Variantes : debout ou assis, à la poulie basse sans poignée à un bras, ou en curl marteau en travers.

Un excellent exercice pour avoir des bras larges et épais.`,
    muscles_principaux: ['brachial antérieur', 'long supinateur'],
    muscles_secondaires: ['biceps', 'avant-bras'],
    joint_notes: 'Ne pas tendre complètement les coudes en bas du mouvement pour éviter de placer le biceps et le long supinateur en position de faiblesse.',
    video_url: 'https://www.youtube.com/watch?v=7SUv7LAEwos',
  },
]

for (const update of UPDATES) {
  const { name, ...fields } = update
  const { error } = await supabase
    .from('exercises')
    .update(fields)
    .eq('name', name)

  if (error) {
    console.error(`❌ ${name} :`, error.message)
  } else {
    console.log(`✅ ${name} — mis à jour`)
  }
}
