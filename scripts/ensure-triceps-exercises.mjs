/**
 * Ensure triceps exercises exist in the database.
 * Run: node scripts/ensure-triceps-exercises.mjs
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

const TRICEPS = [
  // ── BASE ──────────────────────────────────────────────────────────────────
  { name: 'Barre au front allongé à la poulie basse',             level: 'base',      equipment: 'poulie basse, banc plat',    default_rest_seconds: 75 },
  { name: 'Barre au front triceps avec barre ou haltères',        level: 'base',      equipment: 'barre ou haltères, banc plat', default_rest_seconds: 75 },
  { name: 'Développé couché prise serrée à la barre',             level: 'base',      equipment: 'barre, banc plat',           default_rest_seconds: 90 },
  { name: 'Dips à la machine',                                    level: 'base',      equipment: 'machine dips',               default_rest_seconds: 75 },
  { name: 'Dips entre deux bancs',                                level: 'base',      equipment: 'deux bancs',                 default_rest_seconds: 75 },
  { name: 'Dips prise serrée',                                    level: 'base',      equipment: 'barres parallèles',          default_rest_seconds: 90 },
  { name: 'Extension des triceps à la poulie haute à genoux',     level: 'base',      equipment: 'poulie haute',               default_rest_seconds: 60 },
  { name: 'Extension des triceps contre un mur au poids de corps', level: 'base',     equipment: null,                         default_rest_seconds: 60 },
  { name: 'Extension nuque avec barre ou haltère',                level: 'base',      equipment: 'barre ou haltère',           default_rest_seconds: 75 },
  { name: 'Extension nuque à la poulie',                          level: 'base',      equipment: 'poulie',                     default_rest_seconds: 60 },
  { name: 'Extension nuque à un bras avec haltère',               level: 'base',      equipment: 'haltère',                    default_rest_seconds: 60 },
  { name: 'Magic tRYCeps avec barre ou haltère',                  level: 'base',      equipment: 'barre ou haltère, banc plat', default_rest_seconds: 75 },
  { name: 'Pull over Press avec barre ou haltère',                level: 'base',      equipment: 'barre ou haltère, banc plat', default_rest_seconds: 75 },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  { name: 'Extension des triceps à la machine',                   level: 'advanced',  equipment: 'machine triceps',            default_rest_seconds: 60 },
  { name: 'Extension des triceps bras à 180 degrés avec barre ou haltères', level: 'advanced', equipment: 'barre ou haltères', default_rest_seconds: 60 },
  { name: 'Extension des triceps buste penché à la poulie haute', level: 'advanced',  equipment: 'poulie haute',               default_rest_seconds: 60 },
  { name: 'Pompes prise serrée au sol',                           level: 'advanced',  equipment: null,                         default_rest_seconds: 60 },
  { name: 'Tate Press avec haltères',                             level: 'advanced',  equipment: 'haltères, banc plat',        default_rest_seconds: 60 },
  { name: 'Tate Press à un bras avec haltère',                    level: 'advanced',  equipment: 'haltère, banc plat',         default_rest_seconds: 60 },

  // ── FINISHING ─────────────────────────────────────────────────────────────
  { name: 'Extension des triceps à la poulie avec la corde',      level: 'finishing', equipment: 'poulie haute, corde',        default_rest_seconds: 60 },
  { name: 'Extension des triceps à la poulie à un bras',          level: 'finishing', equipment: 'poulie haute',               default_rest_seconds: 60 },
  { name: 'Extension des triceps à la poulie coudes écartés',     level: 'finishing', equipment: 'poulie haute',               default_rest_seconds: 60 },
  { name: 'Extension des triceps à la poulie en pronation',       level: 'finishing', equipment: 'poulie haute',               default_rest_seconds: 60 },
  { name: 'Extension des triceps à la poulie en supination',      level: 'finishing', equipment: 'poulie haute',               default_rest_seconds: 60 },
  { name: 'Kickback avec haltère',                                level: 'finishing', equipment: 'haltère',                    default_rest_seconds: 60 },
  { name: 'Kickback à la poulie',                                 level: 'finishing', equipment: 'poulie basse',               default_rest_seconds: 60 },
].map(ex => ({
  ...ex,
  muscle_group: 'Triceps',
  muscle_side: 'posterior',
  joint_notes: null,
  description: null,
  video_url: null,
  muscles_principaux: ['Triceps'],
  muscles_secondaires: null,
}))

async function run() {
  console.log('🏋️  Upsert exercices triceps...\n')

  const { data, error } = await supabase
    .from('exercises')
    .upsert(TRICEPS, { onConflict: 'name' })
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
