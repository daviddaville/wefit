/**
 * Ensure fessiers exercises exist in the database.
 * Run: node scripts/ensure-fessiers-exercises.mjs
 *
 * Note: "Soulevé de terre avec barre" et "Soulevé de terre sumo avec barre"
 * sont déjà dans Lombaires — exclus ici pour éviter d'écraser leur muscle_group.
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

const FESSIERS = [
  // ── BASE ──────────────────────────────────────────────────────────────────
  { name: 'Hip thrust à la barre',                          level: 'base',      equipment: 'barre, banc plat',    default_rest_seconds: 90 },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  { name: 'Extension inversé à la machine',                 level: 'advanced',  equipment: 'machine',             default_rest_seconds: 75 },
  { name: 'Fente arrière glissée avec Valslide',            level: 'advanced',  equipment: 'Valslide',            default_rest_seconds: 75 },
  { name: 'Fente à la Smith machine',                       level: 'advanced',  equipment: 'Smith machine',       default_rest_seconds: 75 },

  // ── FINISHING ─────────────────────────────────────────────────────────────
  { name: 'Abducteurs allongé avec lest cheville',          level: 'finishing', equipment: 'lest cheville',       default_rest_seconds: 60 },
  { name: 'Abducteurs assis à la machine',                  level: 'finishing', equipment: 'machine abducteurs',  default_rest_seconds: 60 },
  { name: 'Abducteurs à la machine',                        level: 'finishing', equipment: 'machine abducteurs',  default_rest_seconds: 60 },
  { name: 'Abducteurs à la poulie',                         level: 'finishing', equipment: 'poulie basse',        default_rest_seconds: 60 },
  { name: 'Extension de la hanche à la machine',            level: 'finishing', equipment: 'machine',             default_rest_seconds: 60 },
  { name: 'Fente avec barre',                               level: 'finishing', equipment: 'barre',               default_rest_seconds: 75 },
  { name: 'Fente en marchant avec barre ou haltères',       level: 'finishing', equipment: 'barre ou haltères',   default_rest_seconds: 75 },
  { name: 'Fente en reculant avec barre ou haltères',       level: 'finishing', equipment: 'barre ou haltères',   default_rest_seconds: 75 },
].map(ex => ({
  ...ex,
  muscle_group: 'Fessiers',
  muscle_side: 'posterior',
  joint_notes: null,
  description: null,
  video_url: null,
  muscles_principaux: ['Fessiers'],
  muscles_secondaires: null,
}))

async function run() {
  console.log('🏋️  Upsert exercices fessiers...\n')

  const { data, error } = await supabase
    .from('exercises')
    .upsert(FESSIERS, { onConflict: 'name' })
    .select('name, level')

  if (error) {
    console.error('❌ Erreur :', error.message)
    process.exit(1)
  }

  console.log(`✅ ${data.length} exercices upsertés :\n`)
  for (const ex of data) {
    console.log(`   [${ex.level.padEnd(9)}] ${ex.name}`)
  }

  console.log('\n⚠️  Exclus (déjà dans Lombaires) :')
  console.log('   Soulevé de terre avec barre')
  console.log('   Soulevé de terre sumo avec barre')
}

run().catch(console.error)
