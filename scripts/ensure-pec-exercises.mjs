/**
 * Ensure pectoraux exercises exist in the database.
 * Run: node scripts/ensure-pec-exercises.mjs
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

const PECTORAUX = [
  // ── BASE ──────────────────────────────────────────────────────────────────
  { name: 'Développé assis à la machine convergente',       level: 'base',      equipment: 'machine convergente',  default_rest_seconds: 90 },
  { name: 'Développé couché avec haltères',                 level: 'base',      equipment: 'haltères, banc plat',  default_rest_seconds: 90 },
  { name: 'Développé couché à la barre',                    level: 'base',      equipment: 'barre, banc plat',     default_rest_seconds: 120 },
  { name: 'Développé couché à la machine convergente',      level: 'base',      equipment: 'machine convergente',  default_rest_seconds: 90 },
  { name: 'Développé décliné avec haltères',                level: 'base',      equipment: 'haltères, banc décliné', default_rest_seconds: 90 },
  { name: 'Développé décliné à la barre',                   level: 'base',      equipment: 'barre, banc décliné',  default_rest_seconds: 120 },
  { name: 'Développé incliné avec haltères',                level: 'base',      equipment: 'haltères, banc incliné', default_rest_seconds: 90 },
  { name: 'Développé incliné à la barre',                   level: 'base',      equipment: 'barre, banc incliné',  default_rest_seconds: 120 },
  { name: 'Développé incliné à la machine convergente',     level: 'base',      equipment: 'machine convergente',  default_rest_seconds: 90 },
  { name: 'Dips prise large buste penché',                  level: 'base',      equipment: 'barres parallèles',    default_rest_seconds: 90 },
  { name: 'Pull over avec barre ou haltère',                level: 'base',      equipment: 'barre ou haltère, banc plat', default_rest_seconds: 75 },
  { name: "Pull over en travers d'un banc avec barre ou haltère", level: 'base', equipment: 'barre ou haltère, banc plat', default_rest_seconds: 75 },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  { name: 'Écarté couché avec haltères',                    level: 'advanced',  equipment: 'haltères, banc plat',  default_rest_seconds: 75 },
  { name: 'Écarté décliné avec haltères',                   level: 'advanced',  equipment: 'haltères, banc décliné', default_rest_seconds: 75 },
  { name: 'Écarté incliné avec haltères',                   level: 'advanced',  equipment: 'haltères, banc incliné', default_rest_seconds: 75 },
  { name: 'Écarté pectoraux à la machine',                  level: 'advanced',  equipment: 'machine pec-deck',     default_rest_seconds: 75 },
  { name: 'Pompes prise large au sol',                      level: 'advanced',  equipment: null,                   default_rest_seconds: 60 },
  { name: 'Pull over à la poulie basse',                    level: 'advanced',  equipment: 'poulie basse',         default_rest_seconds: 75 },

  // ── FINISHING ─────────────────────────────────────────────────────────────
  { name: 'Écarté à la poulie vis à vis basse',             level: 'finishing', equipment: 'poulie basse',         default_rest_seconds: 60 },
  { name: 'Écarté à la poulie vis à vis haute',             level: 'finishing', equipment: 'poulie haute',         default_rest_seconds: 60 },
  { name: 'Développé couché à la machine',                  level: 'finishing', equipment: 'machine',              default_rest_seconds: 60 },
].map(ex => ({
  ...ex,
  muscle_group: 'Pectoraux',
  muscle_side: 'anterior',
  joint_notes: null,
  description: null,
  video_url: null,
  muscles_principaux: ['Pectoraux'],
  muscles_secondaires: null,
}))

async function run() {
  console.log('🏋️  Upsert exercices pectoraux...\n')

  const { data, error } = await supabase
    .from('exercises')
    .upsert(PECTORAUX, { onConflict: 'name' })
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
