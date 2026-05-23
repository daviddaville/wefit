/**
 * AI-RepCoach — Seed script
 * Prérequis :
 *   1. Migration SQL exécutée dans Supabase SQL Editor
 *   2. Fichier .env.seed à la racine de /app avec :
 *      SUPABASE_URL=https://xxx.supabase.co
 *      SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * Lancer : node scripts/seed.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// Charger .env.seed
const envPath = resolve(__dir, '../.env.seed')
let envVars = {}
try {
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const [k, ...v] = line.split('=')
    if (k && v.length) envVars[k.trim()] = v.join('=').trim()
  }
} catch {
  console.error('❌ Fichier .env.seed introuvable. Créez-le avec SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const SUPABASE_URL = envVars.SUPABASE_URL
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variables manquantes dans .env.seed')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Exercices ───────────────────────────────────────────────────────────────

const EXERCISES = [
  { name: 'Développé incliné haltères',    muscle_group: 'Pectoraux',       equipment: 'haltères, banc inclinable', default_rest_seconds: 90,  joint_notes: null },
  { name: 'Rowing haltère unilatéral',     muscle_group: 'Dos',             equipment: 'haltères, banc inclinable', default_rest_seconds: 90,  joint_notes: null },
  { name: 'Élévations latérales haltères', muscle_group: 'Épaules',         equipment: 'haltères',                  default_rest_seconds: 60,  joint_notes: 'Max +2.5kg/semaine' },
  { name: 'Curl haltères',                 muscle_group: 'Biceps',          equipment: 'haltères',                  default_rest_seconds: 60,  joint_notes: null },
  { name: 'Extension triceps haltère',     muscle_group: 'Triceps',         equipment: 'haltères, banc inclinable', default_rest_seconds: 60,  joint_notes: null },
  { name: 'Développé militaire haltères',  muscle_group: 'Épaules',         equipment: 'haltères',                  default_rest_seconds: 90,  joint_notes: 'Max +2.5kg/semaine' },
  { name: 'Goblet squat haltère',          muscle_group: 'Quadriceps',      equipment: 'haltères',                  default_rest_seconds: 90,  joint_notes: null },
  { name: 'Hip thrust haltère',            muscle_group: 'Fessiers',        equipment: 'haltères, banc inclinable', default_rest_seconds: 90,  joint_notes: null },
  { name: 'Romanian deadlift haltères',    muscle_group: 'Ischio-jambiers', equipment: 'haltères',                  default_rest_seconds: 90,  joint_notes: null },
  { name: 'Mollets debout haltères',       muscle_group: 'Mollets',         equipment: 'haltères',                  default_rest_seconds: 60,  joint_notes: null },
]

async function seed() {
  console.log('🌱 Démarrage du seed AI-RepCoach...\n')

  // 1. Vérifier la connexion
  const { error: pingError } = await supabase.from('exercises').select('id').limit(1)
  if (pingError) {
    console.error('❌ Tables introuvables. Exécutez d\'abord la migration SQL dans Supabase :\n   supabase/migrations/001_init_schema.sql\n')
    console.error('Détail :', pingError.message)
    process.exit(1)
  }

  // 2. Exercices
  console.log('📦 Insertion des exercices...')
  const { error: exErr } = await supabase
    .from('exercises')
    .upsert(EXERCISES, { onConflict: 'name' })
  if (exErr) { console.error('❌ Exercices :', exErr.message); process.exit(1) }
  console.log(`   ✓ ${EXERCISES.length} exercices insérés\n`)

  // 3. Créer un utilisateur de test
  console.log('👤 Création de l\'utilisateur de test...')
  const TEST_EMAIL = 'david@wefit.test'
  const TEST_PASSWORD = 'WeFit2026!'

  const { data: signUpData, error: signUpErr } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'David' },
  })

  let userId
  if (signUpErr?.message?.includes('already been registered')) {
    const { data: users } = await supabase.auth.admin.listUsers()
    userId = users?.users?.find(u => u.email === TEST_EMAIL)?.id
    console.log(`   ✓ Utilisateur existant trouvé (${userId?.slice(0,8)}…)`)
  } else if (signUpErr) {
    console.error('❌ Création utilisateur :', signUpErr.message)
    process.exit(1)
  } else {
    userId = signUpData.user.id
    console.log(`   ✓ Utilisateur créé (${userId.slice(0,8)}…)`)
  }

  // 4. Profil utilisateur
  const { error: profileErr } = await supabase.from('users').upsert({
    id: userId,
    email: TEST_EMAIL,
    full_name: 'David',
    age: 46,
    height_cm: 187.00,
    weight_kg: 112.00,
    goal_weight_kg: 100.00,
  })
  if (profileErr) { console.error('❌ Profil :', profileErr.message); process.exit(1) }
  console.log('   ✓ Profil mis à jour\n')

  // 5. Programme
  console.log('📋 Création du programme...')
  const { data: prog, error: progErr } = await supabase
    .from('programs')
    .insert({
      user_id: userId,
      name: 'Recomposition Haltères 46ans',
      description: 'Programme 4 séances/semaine Haut A/B · Bas A/B. Matériel : haltères + banc inclinable.',
      is_active: true,
    })
    .select()
    .single()
  if (progErr) { console.error('❌ Programme :', progErr.message); process.exit(1) }
  console.log(`   ✓ Programme "${prog.name}"\n`)

  // 6. Séances
  console.log('🗓  Création des séances...')
  const { data: days, error: daysErr } = await supabase
    .from('workout_days')
    .insert([
      { program_id: prog.id, name: 'Haut A', day_order: 1, notes: 'Pectoraux · Dos · Épaules' },
      { program_id: prog.id, name: 'Haut B', day_order: 2, notes: 'Biceps · Triceps · Épaules' },
      { program_id: prog.id, name: 'Bas A',  day_order: 3, notes: 'Quadriceps · Fessiers' },
      { program_id: prog.id, name: 'Bas B',  day_order: 4, notes: 'Ischio-jambiers · Mollets' },
    ])
    .select()
  if (daysErr) { console.error('❌ Séances :', daysErr.message); process.exit(1) }
  console.log(`   ✓ ${days.length} séances créées\n`)

  // Récupérer les IDs des exercices
  const { data: exList } = await supabase.from('exercises').select('id, name')
  const ex = Object.fromEntries(exList.map(e => [e.name, e.id]))
  const dayMap = Object.fromEntries(days.map(d => [d.name, d.id]))

  // 7. Sets config
  console.log('⚙️  Configuration des séries...')
  const setsConfig = [
    // Haut A
    { workout_day_id: dayMap['Haut A'], exercise_id: ex['Développé incliné haltères'],    exercise_order: 1, sets_count: 4, rep_range_min: 8,  rep_range_max: 12, rest_seconds: 90, initial_weight_kg: 20, current_weight_kg: 20 },
    { workout_day_id: dayMap['Haut A'], exercise_id: ex['Rowing haltère unilatéral'],     exercise_order: 2, sets_count: 4, rep_range_min: 8,  rep_range_max: 12, rest_seconds: 90, initial_weight_kg: 16, current_weight_kg: 16 },
    { workout_day_id: dayMap['Haut A'], exercise_id: ex['Élévations latérales haltères'], exercise_order: 3, sets_count: 3, rep_range_min: 12, rep_range_max: 15, rest_seconds: 60, initial_weight_kg: 8,  current_weight_kg: 8  },
    // Haut B
    { workout_day_id: dayMap['Haut B'], exercise_id: ex['Curl haltères'],                 exercise_order: 1, sets_count: 3, rep_range_min: 10, rep_range_max: 15, rest_seconds: 60, initial_weight_kg: 14, current_weight_kg: 14 },
    { workout_day_id: dayMap['Haut B'], exercise_id: ex['Extension triceps haltère'],     exercise_order: 2, sets_count: 3, rep_range_min: 10, rep_range_max: 15, rest_seconds: 60, initial_weight_kg: 12, current_weight_kg: 12 },
    { workout_day_id: dayMap['Haut B'], exercise_id: ex['Développé militaire haltères'],  exercise_order: 3, sets_count: 4, rep_range_min: 8,  rep_range_max: 12, rest_seconds: 90, initial_weight_kg: 16, current_weight_kg: 16 },
    // Bas A
    { workout_day_id: dayMap['Bas A'],  exercise_id: ex['Goblet squat haltère'],          exercise_order: 1, sets_count: 4, rep_range_min: 10, rep_range_max: 15, rest_seconds: 90, initial_weight_kg: 24, current_weight_kg: 24 },
    { workout_day_id: dayMap['Bas A'],  exercise_id: ex['Hip thrust haltère'],            exercise_order: 2, sets_count: 4, rep_range_min: 10, rep_range_max: 15, rest_seconds: 90, initial_weight_kg: 28, current_weight_kg: 28 },
    // Bas B
    { workout_day_id: dayMap['Bas B'],  exercise_id: ex['Romanian deadlift haltères'],    exercise_order: 1, sets_count: 4, rep_range_min: 10, rep_range_max: 12, rest_seconds: 90, initial_weight_kg: 20, current_weight_kg: 20 },
    { workout_day_id: dayMap['Bas B'],  exercise_id: ex['Mollets debout haltères'],       exercise_order: 2, sets_count: 3, rep_range_min: 15, rep_range_max: 20, rest_seconds: 60, initial_weight_kg: 14, current_weight_kg: 14 },
  ]

  const { error: scErr } = await supabase.from('sets_config').insert(setsConfig)
  if (scErr) { console.error('❌ Sets config :', scErr.message); process.exit(1) }
  console.log(`   ✓ ${setsConfig.length} exercices configurés\n`)

  // 8. Historique fake (3 séances passées)
  console.log('📈 Génération de l\'historique fake...')
  const pastDates = ['2026-05-16', '2026-05-19', '2026-05-21']

  for (const date of pastDates) {
    const dayName = date === '2026-05-16' ? 'Haut A' : date === '2026-05-19' ? 'Bas A' : 'Haut B'
    const dayId = dayMap[dayName]

    const { data: workout } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        workout_day_id: dayId,
        started_at: `${date}T09:00:00Z`,
        ended_at: `${date}T10:05:00Z`,
        notes: null,
      })
      .select()
      .single()

    const configs = setsConfig.filter(s => s.workout_day_id === dayId)
    const { data: insertedConfigs } = await supabase
      .from('sets_config')
      .select('id, sets_count, rep_range_min, rep_range_max, current_weight_kg')
      .in('workout_day_id', [dayId])

    const logs = []
    for (const cfg of insertedConfigs) {
      for (let s = 1; s <= cfg.sets_count; s++) {
        logs.push({
          workout_id: workout.id,
          sets_config_id: cfg.id,
          set_number: s,
          weight_kg: cfg.current_weight_kg,
          reps_done: cfg.rep_range_min + Math.floor(Math.random() * (cfg.rep_range_max - cfg.rep_range_min + 1)),
          rest_taken_seconds: 85 + Math.floor(Math.random() * 20),
        })
      }
    }

    await supabase.from('set_logs').insert(logs)
    console.log(`   ✓ Séance ${dayName} du ${date} (${logs.length} séries)`)
  }

  console.log('\n✅ Seed terminé avec succès !')
  console.log(`\n🔑 Identifiants de test :`)
  console.log(`   Email    : david@wefit.test`)
  console.log(`   Password : WeFit2026!`)
}

seed().catch(console.error)
