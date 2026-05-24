/**
 * Ensure abdominaux exercises exist in the database.
 * Run: node scripts/ensure-abs-exercises.mjs
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

const ABDOMINAUX = [
  // ── BASE ──────────────────────────────────────────────────────────────────
  { name: "Crunch abdominaux avec l'Abmat",                level: 'base',      equipment: 'Abmat',                default_rest_seconds: 60 },
  { name: 'Crunch à la poulie haute',                      level: 'base',      equipment: 'poulie haute',         default_rest_seconds: 60 },
  { name: "Enroulement de bassin au sol avec l'Abmat",     level: 'base',      equipment: 'Abmat',                default_rest_seconds: 60 },
  { name: 'Enroulement de bassin suspendu à la barre fixe', level: 'base',     equipment: 'barre fixe',           default_rest_seconds: 60 },
  { name: 'Obliques sur banc à lombaires',                 level: 'base',      equipment: 'banc lombaires',       default_rest_seconds: 60 },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  { name: 'Crunch abdominaux au sol',                      level: 'advanced',  equipment: null,                   default_rest_seconds: 60 },
  { name: 'Crunch abdominaux à la machine',                level: 'advanced',  equipment: 'machine abdominaux',   default_rest_seconds: 60 },
  { name: 'Crunch abdominaux sur la Swiss Ball',           level: 'advanced',  equipment: 'Swiss Ball',           default_rest_seconds: 60 },
  { name: 'Crunch oblique au sol',                         level: 'advanced',  equipment: null,                   default_rest_seconds: 60 },
  { name: 'Enroulement de bassin au sol',                  level: 'advanced',  equipment: null,                   default_rest_seconds: 60 },
  { name: "Obliques avec l'Abmat",                         level: 'advanced',  equipment: 'Abmat',                default_rest_seconds: 60 },
  { name: 'Obliques sur la Swiss Ball',                    level: 'advanced',  equipment: 'Swiss Ball',           default_rest_seconds: 60 },
  { name: 'Obliques suspendu à la barre fixe',             level: 'advanced',  equipment: 'barre fixe',           default_rest_seconds: 60 },
  { name: 'Rotation à la machine',                         level: 'advanced',  equipment: 'machine rotation',     default_rest_seconds: 60 },
  { name: 'Vacuum',                                        level: 'advanced',  equipment: null,                   default_rest_seconds: 45 },

  // ── FINISHING ─────────────────────────────────────────────────────────────
  { name: 'Crunch abdominaux avec rotation au sol',        level: 'finishing', equipment: null,                   default_rest_seconds: 45 },
  { name: 'Drapeau du dragon',                             level: 'finishing', equipment: 'banc plat',            default_rest_seconds: 60 },
  { name: 'Flexion latérale avec haltère',                 level: 'finishing', equipment: 'haltère',              default_rest_seconds: 45 },
  { name: 'Gainage abdominal frontal',                     level: 'finishing', equipment: null,                   default_rest_seconds: 45 },
  { name: 'Gainage abdominal oblique',                     level: 'finishing', equipment: null,                   default_rest_seconds: 45 },
  { name: 'Rotation debout avec balais',                   level: 'finishing', equipment: 'balai',                default_rest_seconds: 45 },
].map(ex => ({
  ...ex,
  muscle_group: 'Abdominaux',
  muscle_side: 'anterior',
  joint_notes: null,
  description: null,
  video_url: null,
  muscles_principaux: ['Abdominaux'],
  muscles_secondaires: null,
}))

async function run() {
  console.log('🏋️  Upsert exercices abdominaux...\n')

  const { data, error } = await supabase
    .from('exercises')
    .upsert(ABDOMINAUX, { onConflict: 'name' })
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
