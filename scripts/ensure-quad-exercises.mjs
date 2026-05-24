/**
 * Ensure quadriceps exercises exist in the database.
 * Run: node scripts/ensure-quad-exercises.mjs
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

const QUADRICEPS = [
  // ── BASE ──────────────────────────────────────────────────────────────────
  { name: 'Hack squat à la machine',                          level: 'base',      equipment: 'machine hack squat',          default_rest_seconds: 120 },
  { name: 'Presse à cuisses allongé',                         level: 'base',      equipment: 'presse allongée',             default_rest_seconds: 120 },
  { name: 'Presse à cuisses assis',                           level: 'base',      equipment: 'presse assise',               default_rest_seconds: 120 },
  { name: 'Presse à cuisses incliné',                         level: 'base',      equipment: 'presse inclinée',             default_rest_seconds: 120 },
  { name: 'Squat avant avec barre',                           level: 'base',      equipment: 'barre',                       default_rest_seconds: 120 },
  { name: 'Squat avec barre derrière la nuque',               level: 'base',      equipment: 'barre',                       default_rest_seconds: 120 },
  { name: 'Squat sumo avec barre',                            level: 'base',      equipment: 'barre',                       default_rest_seconds: 120 },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  { name: 'Fente latérale avec barre',                        level: 'advanced',  equipment: 'barre',                       default_rest_seconds: 90 },
  { name: 'Gobelet Squat avec haltère',                       level: 'advanced',  equipment: 'haltère',                     default_rest_seconds: 90 },
  { name: 'Hack squat avec une barre',                        level: 'advanced',  equipment: 'barre',                       default_rest_seconds: 90 },
  { name: 'Montée sur banc avec barre ou haltères',           level: 'advanced',  equipment: 'barre ou haltères, banc',     default_rest_seconds: 90 },
  { name: 'Squat avec ceinture de lest',                      level: 'advanced',  equipment: 'ceinture de lest',            default_rest_seconds: 90 },
  { name: 'Squat à la machine',                               level: 'advanced',  equipment: 'machine squat',               default_rest_seconds: 90 },
  { name: 'Squat à la machine à mollets',                     level: 'advanced',  equipment: 'machine squat',               default_rest_seconds: 90 },
  { name: 'Squat à la Smith machine',                         level: 'advanced',  equipment: 'Smith machine',               default_rest_seconds: 90 },
  { name: 'Squat à une jambe au poids de corps',              level: 'advanced',  equipment: null,                          default_rest_seconds: 75 },
  { name: 'Squat bulgare avec barre ou haltères',             level: 'advanced',  equipment: 'barre ou haltères, banc',     default_rest_seconds: 90 },

  // ── FINISHING ─────────────────────────────────────────────────────────────
  { name: 'Adducteurs assis à la machine',                    level: 'finishing', equipment: 'machine adducteurs',          default_rest_seconds: 60 },
  { name: 'Adducteurs à la machine',                          level: 'finishing', equipment: 'machine adducteurs',          default_rest_seconds: 60 },
  { name: 'Adducteurs à la poulie',                           level: 'finishing', equipment: 'poulie basse',                default_rest_seconds: 60 },
  { name: 'Flexion de la hanche à une jambe à la machine',    level: 'finishing', equipment: 'machine',                     default_rest_seconds: 60 },
  { name: 'Leg extension allongé à la machine',               level: 'finishing', equipment: 'machine leg extension',       default_rest_seconds: 60 },
  { name: 'Leg extension assis à la machine',                 level: 'finishing', equipment: 'machine leg extension',       default_rest_seconds: 60 },
  { name: 'Relevé de buste au sol ou sur banc incliné',       level: 'finishing', equipment: 'banc incliné ou sol',         default_rest_seconds: 60 },
  { name: 'Relevé de genoux allongé au sol ou sur banc incliné', level: 'finishing', equipment: 'banc incliné ou sol',      default_rest_seconds: 60 },
  { name: 'Relevé de genoux sur banc',                        level: 'finishing', equipment: 'banc',                        default_rest_seconds: 60 },
  { name: 'Relevé de genoux suspendu à la barre fixe',        level: 'finishing', equipment: 'barre fixe',                  default_rest_seconds: 60 },
  { name: 'Sissy squat',                                      level: 'finishing', equipment: null,                          default_rest_seconds: 60 },
  { name: 'Sissy squat à la presse allongé',                  level: 'finishing', equipment: 'presse allongée',             default_rest_seconds: 60 },
  { name: 'Squat avec haltères',                              level: 'finishing', equipment: 'haltères',                    default_rest_seconds: 75 },
  { name: 'Squat indien',                                     level: 'finishing', equipment: null,                          default_rest_seconds: 60 },
].map(ex => ({
  ...ex,
  muscle_group: 'Quadriceps',
  muscle_side: 'anterior',
  joint_notes: null,
  description: null,
  video_url: null,
  muscles_principaux: ['Quadriceps'],
  muscles_secondaires: null,
}))

async function run() {
  console.log('🏋️  Upsert exercices quadriceps...\n')

  const { data, error } = await supabase
    .from('exercises')
    .upsert(QUADRICEPS, { onConflict: 'name' })
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
