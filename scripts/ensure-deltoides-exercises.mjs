/**
 * Ensure deltoïdes exercises exist in the database.
 * Run: node scripts/ensure-deltoides-exercises.mjs
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

// anterior = deltoïde antérieur/latéral (presses, élévations frontales/latérales)
// posterior = deltoïde postérieur (oiseau, rowing coudes ouverts, rotations)
const DELTOIDES = [
  // ── BASE ──────────────────────────────────────────────────────────────────
  { name: 'Élévation latérale à la poulie',                           level: 'base',      equipment: 'poulie',                      muscle_side: 'anterior',  default_rest_seconds: 60 },
  { name: 'Développé épaules avec haltères',                          level: 'base',      equipment: 'haltères',                    muscle_side: 'anterior',  default_rest_seconds: 90 },
  { name: 'Développé épaules à la machine convergente',               level: 'base',      equipment: 'machine convergente',         muscle_side: 'anterior',  default_rest_seconds: 90 },
  { name: 'Développé militaire avec barre',                           level: 'base',      equipment: 'barre',                       muscle_side: 'anterior',  default_rest_seconds: 120 },
  { name: 'Développé nuque avec barre',                               level: 'base',      equipment: 'barre',                       muscle_side: 'anterior',  default_rest_seconds: 120 },
  { name: 'Oiseau à la poulie basse',                                 level: 'base',      equipment: 'poulie basse',                muscle_side: 'posterior', default_rest_seconds: 60 },
  { name: 'Oiseau/Rowing avec haltères',                              level: 'base',      equipment: 'haltères',                    muscle_side: 'posterior', default_rest_seconds: 60 },
  { name: 'Rowing assis à la machine coudes ouverts',                 level: 'base',      equipment: 'machine rowing',              muscle_side: 'posterior', default_rest_seconds: 75 },
  { name: 'Rowing assis à la poulie basse coudes ouverts',            level: 'base',      equipment: 'poulie basse',                muscle_side: 'posterior', default_rest_seconds: 75 },
  { name: 'Rowing à la poulie basse sur banc incliné coudes ouverts', level: 'base',      equipment: 'poulie basse, banc incliné',  muscle_side: 'posterior', default_rest_seconds: 75 },
  { name: 'Rowing à la poulie haute sur banc incliné coudes ouverts', level: 'base',      equipment: 'poulie haute, banc incliné',  muscle_side: 'posterior', default_rest_seconds: 75 },
  { name: 'Rowing à la T-bar coudes ouverts',                         level: 'base',      equipment: 'T-bar',                       muscle_side: 'posterior', default_rest_seconds: 90 },
  { name: 'Rowing barre coudes ouverts',                              level: 'base',      equipment: 'barre',                       muscle_side: 'posterior', default_rest_seconds: 90 },
  { name: 'Rowing debout à la poulie basse',                          level: 'base',      equipment: 'poulie basse',                muscle_side: 'posterior', default_rest_seconds: 75 },
  { name: 'Rowing debout prise large avec barre',                     level: 'base',      equipment: 'barre',                       muscle_side: 'anterior',  default_rest_seconds: 90 },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  { name: 'Élévation latérale avec haltères',                         level: 'advanced',  equipment: 'haltères',                    muscle_side: 'anterior',  default_rest_seconds: 60 },
  { name: 'Élévation latérale à un bras penché sur le côté',          level: 'advanced',  equipment: 'haltère',                     muscle_side: 'anterior',  default_rest_seconds: 60 },
  { name: 'Élévation latérale à un bras sur banc incliné',            level: 'advanced',  equipment: 'haltère, banc incliné',       muscle_side: 'anterior',  default_rest_seconds: 60 },
  { name: 'Développé épaules Arnold avec haltères',                   level: 'advanced',  equipment: 'haltères',                    muscle_side: 'anterior',  default_rest_seconds: 90 },
  { name: 'Développé épaules à la machine',                           level: 'advanced',  equipment: 'machine',                     muscle_side: 'anterior',  default_rest_seconds: 90 },
  { name: 'Développé inversé au poids de corps',                      level: 'advanced',  equipment: null,                          muscle_side: 'anterior',  default_rest_seconds: 75 },
  { name: 'Oiseau avec haltères',                                     level: 'advanced',  equipment: 'haltères',                    muscle_side: 'posterior', default_rest_seconds: 60 },
  { name: 'Oiseau à la machine',                                      level: 'advanced',  equipment: 'machine',                     muscle_side: 'posterior', default_rest_seconds: 60 },
  { name: 'Oiseau à la poulie haute',                                 level: 'advanced',  equipment: 'poulie haute',                muscle_side: 'posterior', default_rest_seconds: 60 },
  { name: 'Oiseau à un bras allongé',                                 level: 'advanced',  equipment: 'haltère',                     muscle_side: 'posterior', default_rest_seconds: 60 },
  { name: 'Oiseau sur banc incliné avec haltères',                    level: 'advanced',  equipment: 'haltères, banc incliné',      muscle_side: 'posterior', default_rest_seconds: 60 },
  { name: 'Pompes indiennes',                                         level: 'advanced',  equipment: null,                          muscle_side: 'anterior',  default_rest_seconds: 60 },

  // ── FINISHING ─────────────────────────────────────────────────────────────
  { name: 'Élévation frontale avec haltères',                         level: 'finishing', equipment: 'haltères',                    muscle_side: 'anterior',  default_rest_seconds: 60 },
  { name: 'Élévation frontale avec une barre',                        level: 'finishing', equipment: 'barre',                       muscle_side: 'anterior',  default_rest_seconds: 60 },
  { name: 'Élévation frontale à la poulie',                           level: 'finishing', equipment: 'poulie basse',                muscle_side: 'anterior',  default_rest_seconds: 60 },
  { name: 'Élévation frontale sur banc incliné avec barre ou haltères', level: 'finishing', equipment: 'barre ou haltères, banc incliné', muscle_side: 'anterior', default_rest_seconds: 60 },
  { name: 'Élévation latérale à la machine',                          level: 'finishing', equipment: 'machine',                     muscle_side: 'anterior',  default_rest_seconds: 60 },
  { name: 'L-Fly allongé à la poulie basse',                          level: 'finishing', equipment: 'poulie basse',                muscle_side: 'posterior', default_rest_seconds: 60 },
  { name: 'L-Fly assis à la poulie basse',                            level: 'finishing', equipment: 'poulie basse',                muscle_side: 'posterior', default_rest_seconds: 60 },
  { name: 'L-Fly avec haltère',                                       level: 'finishing', equipment: 'haltère',                     muscle_side: 'posterior', default_rest_seconds: 60 },
  { name: 'L-Fly debout à la poulie',                                 level: 'finishing', equipment: 'poulie',                      muscle_side: 'posterior', default_rest_seconds: 60 },
  { name: 'Rotation externe debout avec barre',                       level: 'finishing', equipment: 'barre',                       muscle_side: 'posterior', default_rest_seconds: 60 },
  { name: 'Rotation interne allongé à la poulie basse',               level: 'finishing', equipment: 'poulie basse',                muscle_side: 'posterior', default_rest_seconds: 60 },
  { name: 'Rotation interne assis à la poulie basse',                 level: 'finishing', equipment: 'poulie basse',                muscle_side: 'posterior', default_rest_seconds: 60 },
  { name: 'Rotation interne avec haltère',                            level: 'finishing', equipment: 'haltère',                     muscle_side: 'posterior', default_rest_seconds: 60 },
  { name: 'Rotation interne debout à la poulie',                      level: 'finishing', equipment: 'poulie',                      muscle_side: 'posterior', default_rest_seconds: 60 },
].map(ex => ({
  ...ex,
  muscle_group: 'Épaules',
  joint_notes: null,
  description: null,
  video_url: null,
  muscles_principaux: ['Deltoïdes'],
  muscles_secondaires: null,
}))

async function run() {
  console.log('🏋️  Upsert exercices deltoïdes...\n')

  const { data, error } = await supabase
    .from('exercises')
    .upsert(DELTOIDES, { onConflict: 'name' })
    .select('name, level, muscle_side')

  if (error) {
    console.error('❌ Erreur :', error.message)
    process.exit(1)
  }

  console.log(`✅ ${data.length} exercices upsertés :\n`)
  for (const ex of data) {
    const side = ex.muscle_side === 'anterior' ? 'ant' : 'post'
    console.log(`   [${ex.level.padEnd(9)}][${side}] ${ex.name}`)
  }
}

run().catch(console.error)
