/**
 * Ensure biceps exercises exist in the database.
 * Run: node scripts/ensure-biceps-exercises.mjs
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

const BICEPS = [
  // ── BASE ──────────────────────────────────────────────────────────────────
  { name: 'Curl au pupitre avec barre',                     level: 'base',      equipment: 'barre, pupitre',        default_rest_seconds: 75 },
  { name: 'Curl incliné avec haltères',                     level: 'base',      equipment: 'haltères, banc incliné', default_rest_seconds: 75 },
  { name: 'Curl marteau en travers avec haltères',          level: 'base',      equipment: 'haltères',              default_rest_seconds: 75 },
  { name: 'Traction prise supination non cambré à la barre fixe', level: 'base', equipment: 'barre fixe',           default_rest_seconds: 90 },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  { name: 'Curl allongé à la poulie basse',                 level: 'advanced',  equipment: 'poulie basse',          default_rest_seconds: 60 },
  { name: 'Curl allongé à la poulie haute',                 level: 'advanced',  equipment: 'poulie haute',          default_rest_seconds: 60 },
  { name: 'Curl araignée avec barre',                       level: 'advanced',  equipment: 'barre, banc incliné',   default_rest_seconds: 60 },
  { name: 'Curl au pupitre à la poulie',                    level: 'advanced',  equipment: 'poulie, pupitre',       default_rest_seconds: 60 },
  { name: 'Curl avec haltères',                             level: 'advanced',  equipment: 'haltères',              default_rest_seconds: 60 },
  { name: 'Curl à la barre',                                level: 'advanced',  equipment: 'barre',                 default_rest_seconds: 75 },
  { name: 'Curl à la poulie basse',                         level: 'advanced',  equipment: 'poulie basse',          default_rest_seconds: 60 },
  { name: 'Curl marteau avec haltères',                     level: 'advanced',  equipment: 'haltères',              default_rest_seconds: 60 },
  { name: 'Curl marteau à la poulie basse',                 level: 'advanced',  equipment: 'poulie basse',          default_rest_seconds: 60 },

  // ── FINISHING ─────────────────────────────────────────────────────────────
  { name: 'Curl au pupitre à la machine',                   level: 'finishing', equipment: 'machine, pupitre',      default_rest_seconds: 60 },
  { name: 'Curl à la poulie vis à vis',                     level: 'finishing', equipment: 'poulie',                default_rest_seconds: 60 },
  { name: 'Curl concentré avec haltère',                    level: 'finishing', equipment: 'haltère',               default_rest_seconds: 60 },
].map(ex => ({
  ...ex,
  muscle_group: 'Biceps',
  muscle_side: 'anterior',
  joint_notes: null,
  description: null,
  video_url: null,
  muscles_principaux: ['Biceps'],
  muscles_secondaires: null,
}))

async function run() {
  console.log('🏋️  Upsert exercices biceps...\n')

  const { data, error } = await supabase
    .from('exercises')
    .upsert(BICEPS, { onConflict: 'name' })
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
