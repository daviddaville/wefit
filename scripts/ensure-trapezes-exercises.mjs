/**
 * Ensure trapèzes exercises exist in the database.
 * Run: node scripts/ensure-trapezes-exercises.mjs
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

const TRAPEZES = [
  // ── BASE ──────────────────────────────────────────────────────────────────
  { name: 'Rowing à la T-bar',                                  level: 'base',      equipment: 'T-bar',                  default_rest_seconds: 90 },
  { name: 'Rowing à un bras avec haltère',                      level: 'base',      equipment: 'haltère',                default_rest_seconds: 90 },
  { name: 'Rowing à un bras à la machine',                      level: 'base',      equipment: 'machine',                default_rest_seconds: 90 },
  { name: 'Rowing barre à la Yates en pronation',               level: 'base',      equipment: 'barre',                  default_rest_seconds: 90 },
  { name: 'Rowing barre à la Yates en supination',              level: 'base',      equipment: 'barre',                  default_rest_seconds: 90 },
  { name: 'Rowing barre buste penché en pronation',             level: 'base',      equipment: 'barre',                  default_rest_seconds: 90 },
  { name: 'Rowing barre en supination',                         level: 'base',      equipment: 'barre',                  default_rest_seconds: 90 },
  { name: 'Soulevé de terre partiel avec barre',                level: 'base',      equipment: 'barre',                  default_rest_seconds: 120 },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  { name: 'Rowing assis à la machine',                          level: 'advanced',  equipment: 'machine rowing',         default_rest_seconds: 75 },
  { name: 'Rowing assis à la poulie basse à un bras',           level: 'advanced',  equipment: 'poulie basse',           default_rest_seconds: 75 },
  { name: 'Rowing assis à la poulie basse en pronation',        level: 'advanced',  equipment: 'poulie basse',           default_rest_seconds: 75 },
  { name: 'Rowing assis à la poulie basse en supination',       level: 'advanced',  equipment: 'poulie basse',           default_rest_seconds: 75 },
  { name: 'Rowing assis à la poulie basse prise neutre',        level: 'advanced',  equipment: 'poulie basse',           default_rest_seconds: 75 },
  { name: 'Rowing à la poulie basse sur banc incliné',          level: 'advanced',  equipment: 'poulie basse, banc incliné', default_rest_seconds: 75 },
  { name: 'Rowing à la poulie haute à un bras',                 level: 'advanced',  equipment: 'poulie haute',           default_rest_seconds: 75 },
  { name: 'Rowing à la poulie haute en prise neutre',           level: 'advanced',  equipment: 'poulie haute',           default_rest_seconds: 75 },
  { name: 'Rowing à la poulie haute en pronation',              level: 'advanced',  equipment: 'poulie haute',           default_rest_seconds: 75 },
  { name: 'Rowing à la poulie haute en supination',             level: 'advanced',  equipment: 'poulie haute',           default_rest_seconds: 75 },
  { name: 'Rowing à la T-bar à la machine',                     level: 'advanced',  equipment: 'machine T-bar',          default_rest_seconds: 75 },
  { name: 'Rowing à un bras à la poulie basse',                 level: 'advanced',  equipment: 'poulie basse',           default_rest_seconds: 75 },
  { name: 'Rowing barre allongé sur banc',                      level: 'advanced',  equipment: 'barre, banc plat',       default_rest_seconds: 75 },
  { name: 'Rowing debout prise serrée avec barre',              level: 'advanced',  equipment: 'barre',                  default_rest_seconds: 75 },

  // ── FINISHING ─────────────────────────────────────────────────────────────
  { name: 'Rowing inversé au poids de corps',                   level: 'finishing', equipment: 'barre fixe basse',       default_rest_seconds: 60 },
  { name: 'Shrug avec barre',                                   level: 'finishing', equipment: 'barre',                  default_rest_seconds: 60 },
  { name: 'Shrug avec haltères',                                level: 'finishing', equipment: 'haltères',               default_rest_seconds: 60 },
  { name: 'Shrug à la machine',                                 level: 'finishing', equipment: 'machine',                default_rest_seconds: 60 },
  { name: 'Shrug à la machine à mollets',                       level: 'finishing', equipment: 'machine à mollets',      default_rest_seconds: 60 },
  { name: 'Shrug à la machine convergente',                     level: 'finishing', equipment: 'machine convergente',    default_rest_seconds: 60 },
  { name: 'Shrug à la poulie',                                  level: 'finishing', equipment: 'poulie',                 default_rest_seconds: 60 },
].map(ex => ({
  ...ex,
  muscle_group: 'Trapèzes',
  muscle_side: 'posterior',
  joint_notes: null,
  description: null,
  video_url: null,
  muscles_principaux: ['Trapèzes'],
  muscles_secondaires: null,
}))

async function run() {
  console.log('🏋️  Upsert exercices trapèzes...\n')

  const { data, error } = await supabase
    .from('exercises')
    .upsert(TRAPEZES, { onConflict: 'name' })
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
