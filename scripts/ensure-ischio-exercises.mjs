/**
 * Ensure ischio-jambiers exercises exist in the database.
 * Run: node scripts/ensure-ischio-exercises.mjs
 *
 * Note: "Soulevé de terre jambes tendues avec barre ou haltères", "Good Morning avec barre"
 * et "Soulevé de terre jambes tendues à la poulie" sont déjà dans Lombaires —
 * ils sont intentionnellement exclus ici pour éviter d'écraser leur muscle_group.
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

const ISCHIO = [
  // ── BASE ──────────────────────────────────────────────────────────────────
  { name: 'Glute Ham Raise au banc',                          level: 'base',      equipment: 'banc GHR',          default_rest_seconds: 90 },
  { name: 'Leg curl assis à la machine',                      level: 'base',      equipment: 'machine leg curl',  default_rest_seconds: 75 },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  { name: 'Extension au banc à lombaires à 45 degrés',        level: 'advanced',  equipment: 'banc lombaires 45°', default_rest_seconds: 75 },
  { name: 'Leg curl allongé à la machine',                    level: 'advanced',  equipment: 'machine leg curl',  default_rest_seconds: 75 },
  { name: 'Leg curl debout à une jambe à la machine',         level: 'advanced',  equipment: 'machine leg curl',  default_rest_seconds: 60 },
  { name: 'Leg curl debout à une jambe à la poulie',          level: 'advanced',  equipment: 'poulie basse',      default_rest_seconds: 60 },

  // ── FINISHING ─────────────────────────────────────────────────────────────
  { name: 'Extension au banc à lombaires à 90 degrés',        level: 'finishing', equipment: 'banc lombaires 90°', default_rest_seconds: 60 },
].map(ex => ({
  ...ex,
  muscle_group: 'Ischio-jambiers',
  muscle_side: 'posterior',
  joint_notes: null,
  description: null,
  video_url: null,
  muscles_principaux: ['Ischio-jambiers'],
  muscles_secondaires: null,
}))

async function run() {
  console.log('🏋️  Upsert exercices ischio-jambiers...\n')

  const { data, error } = await supabase
    .from('exercises')
    .upsert(ISCHIO, { onConflict: 'name' })
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
  console.log('   Soulevé de terre jambes tendues avec barre ou haltères')
  console.log('   Good Morning avec barre')
  console.log('   Soulevé de terre jambes tendues à la poulie')
}

run().catch(console.error)
