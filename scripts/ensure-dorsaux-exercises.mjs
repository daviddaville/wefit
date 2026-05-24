/**
 * Ensure dorsaux exercises exist in the database.
 * Run: node scripts/ensure-dorsaux-exercises.mjs
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

const DORSAUX = [
  // ── BASE ──────────────────────────────────────────────────────────────────
  { name: 'Traction prise large devant à la barre fixe',          level: 'base',      equipment: 'barre fixe',          default_rest_seconds: 120 },
  { name: 'Traction prise large nuque à la barre fixe',           level: 'base',      equipment: 'barre fixe',          default_rest_seconds: 120 },
  { name: 'Traction prise neutre à la barre fixe',                level: 'base',      equipment: 'barre fixe',          default_rest_seconds: 120 },
  { name: 'Traction prise serrée en pronation à la barre fixe',   level: 'base',      equipment: 'barre fixe',          default_rest_seconds: 120 },
  { name: 'Traction prise supination cambré à la barre fixe',     level: 'base',      equipment: 'barre fixe',          default_rest_seconds: 120 },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  { name: 'Pull over assis à la machine',                         level: 'advanced',  equipment: 'machine',             default_rest_seconds: 75 },
  { name: 'Traction à la machine convergente',                    level: 'advanced',  equipment: 'machine convergente', default_rest_seconds: 90 },
  { name: 'Traction à la poulie haute à un bras',                 level: 'advanced',  equipment: 'poulie haute',        default_rest_seconds: 75 },
  { name: 'Traction à la poulie haute devant',                    level: 'advanced',  equipment: 'poulie haute',        default_rest_seconds: 75 },
  { name: 'Traction à la poulie haute nuque',                     level: 'advanced',  equipment: 'poulie haute',        default_rest_seconds: 75 },
  { name: 'Traction à la poulie haute prise neutre',              level: 'advanced',  equipment: 'poulie haute',        default_rest_seconds: 75 },
  { name: 'Traction à la poulie haute prise serrée en pronation', level: 'advanced',  equipment: 'poulie haute',        default_rest_seconds: 75 },
  { name: 'Traction à la poulie haute prise supination',          level: 'advanced',  equipment: 'poulie haute',        default_rest_seconds: 75 },

  // ── FINISHING ─────────────────────────────────────────────────────────────
  { name: 'Pull over debout à la poulie haute',                   level: 'finishing', equipment: 'poulie haute',        default_rest_seconds: 60 },
  { name: 'Traction à la machine',                                level: 'finishing', equipment: 'machine',             default_rest_seconds: 60 },
].map(ex => ({
  ...ex,
  muscle_group: 'Dorsaux',
  muscle_side: 'posterior',
  joint_notes: null,
  description: null,
  video_url: null,
  muscles_principaux: ['Grand dorsal'],
  muscles_secondaires: null,
}))

async function run() {
  console.log('🏋️  Upsert exercices dorsaux...\n')

  const { data, error } = await supabase
    .from('exercises')
    .upsert(DORSAUX, { onConflict: 'name' })
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
