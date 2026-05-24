/**
 * Ensure avant-bras exercises exist in the database.
 * Run: node scripts/ensure-avantbras-exercises.mjs
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

const AVANT_BRAS = [
  // ── ADVANCED ──────────────────────────────────────────────────────────────
  { name: 'Curl inversé allongé à la poulie basse',   level: 'advanced',  equipment: 'poulie basse',        default_rest_seconds: 60 },
  { name: 'Curl inversé allongé à la poulie haute',   level: 'advanced',  equipment: 'poulie haute',        default_rest_seconds: 60 },
  { name: 'Curl inversé au pupitre avec barre',       level: 'advanced',  equipment: 'barre, pupitre',      default_rest_seconds: 60 },
  { name: 'Curl inversé au pupitre à la poulie',      level: 'advanced',  equipment: 'poulie, pupitre',     default_rest_seconds: 60 },
  { name: 'Curl inversé avec barre',                  level: 'advanced',  equipment: 'barre',               default_rest_seconds: 60 },
  { name: 'Curl inversé à la poulie',                 level: 'advanced',  equipment: 'poulie',              default_rest_seconds: 60 },

  // ── FINISHING ─────────────────────────────────────────────────────────────
  { name: 'Bobine Andrieux - Extension',              level: 'finishing', equipment: 'bobine Andrieux',     default_rest_seconds: 45 },
  { name: 'Bobine Andrieux - Flexion',                level: 'finishing', equipment: 'bobine Andrieux',     default_rest_seconds: 45 },
  { name: 'Extension des poignets avec barre',        level: 'finishing', equipment: 'barre',               default_rest_seconds: 45 },
  { name: 'Flexion des poignets avec barre',          level: 'finishing', equipment: 'barre',               default_rest_seconds: 45 },
].map(ex => ({
  ...ex,
  muscle_group: 'Avant-bras',
  muscle_side: 'anterior',
  joint_notes: null,
  description: null,
  video_url: null,
  muscles_principaux: ['Avant-bras'],
  muscles_secondaires: null,
}))

async function run() {
  console.log('🏋️  Upsert exercices avant-bras...\n')

  const { data, error } = await supabase
    .from('exercises')
    .upsert(AVANT_BRAS, { onConflict: 'name' })
    .select('name, level')

  if (error) {
    console.error('❌ Erreur :', error.message)
    process.exit(1)
  }

  console.log(`✅ ${data.length} exercices upsertés :\n`)
  for (const ex of data) {
    console.log(`   [${ex.level.padEnd(9)}] ${ex.name}`)
  }
}

run().catch(console.error)
