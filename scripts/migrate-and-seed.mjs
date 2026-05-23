import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const { Client } = pg
const __dir = dirname(fileURLToPath(import.meta.url))

// Charger .env.seed
const envPath = resolve(__dir, '../.env.seed')
const content = readFileSync(envPath, 'utf8')
const env = Object.fromEntries(
  content.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const [k, ...v] = l.split('=')
    return [k.trim(), v.join('=').trim()]
  })
)

const SUPABASE_URL = env.SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0]

// ─── Connexion PostgreSQL directe ────────────────────────────────────────────
// Supabase expose PostgreSQL via le pooler avec JWT comme password
const DB_CONFIG = {
  host: `db.${PROJECT_REF}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: SERVICE_ROLE_KEY,
  ssl: { rejectUnauthorized: false },
}

const MIGRATION = readFileSync(resolve(__dir, '../supabase/migrations/001_init_schema.sql'), 'utf8')

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

async function run() {
  console.log('🔌 Connexion à PostgreSQL...')

  const client = new Client(DB_CONFIG)

  try {
    await client.connect()
    console.log('   ✓ Connecté\n')

    // ─── Migration ────────────────────────────────────────────────────────
    console.log('📐 Application de la migration SQL...')
    await client.query(MIGRATION)
    console.log('   ✓ Tables créées\n')

  } catch (err) {
    console.log(`   ⚠️  Migration via pg échouée (${err.message.split('\n')[0]})`)
    console.log('   Tentative via REST API (service_role)...\n')
    await client.end().catch(() => {})
    await seedViaRest()
    return
  }

  await client.end()
  await seedViaRest()
}

async function seedViaRest() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Vérifier que les tables existent
  const { error: pingError } = await supabase.from('exercises').select('id').limit(1)
  if (pingError) {
    console.error('❌ Tables introuvables. Appliquez manuellement la migration dans le SQL Editor Supabase.')
    console.error('   https://supabase.com/dashboard/project/' + new URL(SUPABASE_URL).hostname.split('.')[0] + '/sql')
    process.exit(1)
  }

  console.log('📦 Insertion des exercices...')
  const { error: exErr } = await supabase.from('exercises').upsert(EXERCISES, { onConflict: 'name' })
  if (exErr) { console.error('❌ Exercices :', exErr.message); process.exit(1) }
  console.log(`   ✓ ${EXERCISES.length} exercices\n`)

  console.log('👤 Création de l\'utilisateur de test...')
  const TEST_EMAIL = 'david@wefit.test'
  const TEST_PASSWORD = 'WeFit2026!'

  let userId
  const { data: signUpData, error: signUpErr } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'David' },
  })

  if (signUpErr?.message?.includes('already registered') || signUpErr?.message?.includes('already exists')) {
    const { data: users } = await supabase.auth.admin.listUsers()
    userId = users?.users?.find(u => u.email === TEST_EMAIL)?.id
    console.log(`   ✓ Utilisateur existant (${userId?.slice(0, 8)}…)`)
  } else if (signUpErr) {
    console.error('❌ Création user :', signUpErr.message); process.exit(1)
  } else {
    userId = signUpData.user.id
    console.log(`   ✓ Utilisateur créé (${userId.slice(0, 8)}…)`)
  }

  await supabase.from('users').upsert({
    id: userId, email: TEST_EMAIL, full_name: 'David',
    age: 46, height_cm: 187.00, weight_kg: 112.00, goal_weight_kg: 100.00,
  })
  console.log('   ✓ Profil mis à jour\n')

  console.log('📋 Création du programme...')
  const { data: prog, error: progErr } = await supabase.from('programs').insert({
    user_id: userId,
    name: 'Recomposition Haltères 46ans',
    description: 'Programme 4 séances/semaine Haut A/B · Bas A/B.',
    is_active: true,
  }).select().single()
  if (progErr) { console.error('❌ Programme :', progErr.message); process.exit(1) }
  console.log(`   ✓ "${prog.name}"\n`)

  console.log('🗓  Création des séances...')
  const { data: days, error: daysErr } = await supabase.from('workout_days').insert([
    { program_id: prog.id, name: 'Haut A', day_order: 1, notes: 'Pectoraux · Dos · Épaules' },
    { program_id: prog.id, name: 'Haut B', day_order: 2, notes: 'Biceps · Triceps · Épaules' },
    { program_id: prog.id, name: 'Bas A',  day_order: 3, notes: 'Quadriceps · Fessiers' },
    { program_id: prog.id, name: 'Bas B',  day_order: 4, notes: 'Ischio-jambiers · Mollets' },
  ]).select()
  if (daysErr) { console.error('❌ Séances :', daysErr.message); process.exit(1) }
  console.log(`   ✓ ${days.length} séances\n`)

  const { data: exList } = await supabase.from('exercises').select('id, name')
  const ex = Object.fromEntries(exList.map(e => [e.name, e.id]))
  const dayMap = Object.fromEntries(days.map(d => [d.name, d.id]))

  console.log('⚙️  Configuration des séries...')
  const setsConfig = [
    { workout_day_id: dayMap['Haut A'], exercise_id: ex['Développé incliné haltères'],    exercise_order: 1, sets_count: 4, rep_range_min: 8,  rep_range_max: 12, rest_seconds: 90, initial_weight_kg: 20, current_weight_kg: 20 },
    { workout_day_id: dayMap['Haut A'], exercise_id: ex['Rowing haltère unilatéral'],     exercise_order: 2, sets_count: 4, rep_range_min: 8,  rep_range_max: 12, rest_seconds: 90, initial_weight_kg: 16, current_weight_kg: 16 },
    { workout_day_id: dayMap['Haut A'], exercise_id: ex['Élévations latérales haltères'], exercise_order: 3, sets_count: 3, rep_range_min: 12, rep_range_max: 15, rest_seconds: 60, initial_weight_kg: 8,  current_weight_kg: 8  },
    { workout_day_id: dayMap['Haut B'], exercise_id: ex['Curl haltères'],                 exercise_order: 1, sets_count: 3, rep_range_min: 10, rep_range_max: 15, rest_seconds: 60, initial_weight_kg: 14, current_weight_kg: 14 },
    { workout_day_id: dayMap['Haut B'], exercise_id: ex['Extension triceps haltère'],     exercise_order: 2, sets_count: 3, rep_range_min: 10, rep_range_max: 15, rest_seconds: 60, initial_weight_kg: 12, current_weight_kg: 12 },
    { workout_day_id: dayMap['Haut B'], exercise_id: ex['Développé militaire haltères'],  exercise_order: 3, sets_count: 4, rep_range_min: 8,  rep_range_max: 12, rest_seconds: 90, initial_weight_kg: 16, current_weight_kg: 16 },
    { workout_day_id: dayMap['Bas A'],  exercise_id: ex['Goblet squat haltère'],          exercise_order: 1, sets_count: 4, rep_range_min: 10, rep_range_max: 15, rest_seconds: 90, initial_weight_kg: 24, current_weight_kg: 24 },
    { workout_day_id: dayMap['Bas A'],  exercise_id: ex['Hip thrust haltère'],            exercise_order: 2, sets_count: 4, rep_range_min: 10, rep_range_max: 15, rest_seconds: 90, initial_weight_kg: 28, current_weight_kg: 28 },
    { workout_day_id: dayMap['Bas B'],  exercise_id: ex['Romanian deadlift haltères'],    exercise_order: 1, sets_count: 4, rep_range_min: 10, rep_range_max: 12, rest_seconds: 90, initial_weight_kg: 20, current_weight_kg: 20 },
    { workout_day_id: dayMap['Bas B'],  exercise_id: ex['Mollets debout haltères'],       exercise_order: 2, sets_count: 3, rep_range_min: 15, rep_range_max: 20, rest_seconds: 60, initial_weight_kg: 14, current_weight_kg: 14 },
  ]
  const { data: insertedConfigs, error: scErr } = await supabase.from('sets_config').insert(setsConfig).select()
  if (scErr) { console.error('❌ Sets config :', scErr.message); process.exit(1) }
  console.log(`   ✓ ${setsConfig.length} exercices configurés\n`)

  console.log('📈 Génération de l\'historique (3 séances)...')
  const sessions = [
    { date: '2026-05-16', dayName: 'Haut A' },
    { date: '2026-05-19', dayName: 'Bas A' },
    { date: '2026-05-21', dayName: 'Haut B' },
  ]

  for (const { date, dayName } of sessions) {
    const dayId = dayMap[dayName]
    const { data: workout } = await supabase.from('workouts').insert({
      user_id: userId,
      workout_day_id: dayId,
      started_at: `${date}T09:00:00Z`,
      ended_at: `${date}T10:05:00Z`,
    }).select().single()

    const dayCfgs = insertedConfigs.filter(c => c.workout_day_id === dayId)
    const logs = dayCfgs.flatMap(cfg =>
      Array.from({ length: cfg.sets_count }, (_, i) => ({
        workout_id: workout.id,
        sets_config_id: cfg.id,
        set_number: i + 1,
        weight_kg: cfg.current_weight_kg,
        reps_done: cfg.rep_range_min + Math.floor(Math.random() * (cfg.rep_range_max - cfg.rep_range_min + 1)),
        rest_taken_seconds: 85 + Math.floor(Math.random() * 20),
      }))
    )

    await supabase.from('set_logs').insert(logs)
    console.log(`   ✓ ${dayName} du ${date} — ${logs.length} séries`)
  }

  console.log('\n✅ Seed terminé !')
  console.log('\n🔑 Compte de test :')
  console.log('   Email    : david@wefit.test')
  console.log('   Password : WeFit2026!')
}

run().catch(console.error)
