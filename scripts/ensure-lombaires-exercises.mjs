/**
 * Ensure lombaires exercises exist in the database.
 * Run: node scripts/ensure-lombaires-exercises.mjs
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

const LOMBAIRES = [
  // ── BASE ──────────────────────────────────────────────────────────────────
  { name: 'Soulevé de terre avec barre',                          level: 'base',      equipment: 'barre',               default_rest_seconds: 120 },
  { name: 'Soulevé de terre jambes tendues avec barre ou haltères', level: 'base',    equipment: 'barre ou haltères',   default_rest_seconds: 90 },
  { name: 'Soulevé de terre sumo avec barre',                     level: 'base',      equipment: 'barre',               default_rest_seconds: 120 },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  { name: 'Enroulement/Déroulement au banc à lombaires',          level: 'advanced',  equipment: 'banc lombaires',      default_rest_seconds: 75 },
  { name: 'Good Morning avec barre',                              level: 'advanced',  equipment: 'barre',               default_rest_seconds: 90 },
  { name: 'Soulevé de terre jambes tendues à la poulie',          level: 'advanced',  equipment: 'poulie basse',        default_rest_seconds: 75 },

  // ── FINISHING ─────────────────────────────────────────────────────────────
  { name: 'Superman au sol',                                      level: 'finishing', equipment: null,                  default_rest_seconds: 45 },
].map(ex => ({
  ...ex,
  muscle_group: 'Lombaires',
  muscle_side: 'posterior',
  joint_notes: null,
  description: null,
  video_url: null,
  muscles_principaux: ['Lombaires'],
  muscles_secondaires: null,
}))

async function run() {
  console.log('🏋️  Upsert exercices lombaires...\n')

  const { data, error } = await supabase
    .from('exercises')
    .upsert(LOMBAIRES, { onConflict: 'name' })
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
