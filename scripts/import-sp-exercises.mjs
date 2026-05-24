/**
 * Import SuperPhysique exercises → Supabase
 *
 * Fusionne exercices_musculation.json (niveau + muscle_side)
 * et exercices_musculation_complet.json (muscles_principaux, description, vidéo)
 *
 * Usage: node scripts/import-sp-exercises.mjs
 *
 * Prérequis : migration 004 exécutée dans Supabase SQL Editor
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root  = resolve(__dir, '../../')          // e:\sysencom\projects\wefit

// ── Load env ─────────────────────────────────────────────────────────────────
const envPath = resolve(__dir, '../.env.seed')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Load JSON files ───────────────────────────────────────────────────────────
const simple  = JSON.parse(readFileSync(resolve(root, 'exercices_musculation.json'), 'utf8'))

// Priorité descriptions : exercices_avec_descriptions.json (DrissionPage)
// Fallback              : exercices_musculation_complet.json
const complet = (() => {
  for (const fname of ['exercices_avec_descriptions.json', 'exercices_musculation_complet.json']) {
    try {
      const data = JSON.parse(readFileSync(resolve(root, fname), 'utf8'))
      console.log(`✓ Source descriptions : ${fname} (${data.exercices?.length ?? 0} exercices)`)
      return data
    } catch { /* try next */ }
  }
  throw new Error('Aucun fichier exercices trouvé')
})()

// Source autoritaire pour muscle_group (categories propres)
const complet0 = (() => {
  try {
    const data = JSON.parse(readFileSync(resolve(root, 'exercices_musculation_complet.json'), 'utf8'))
    return new Map(data.exercices.map(e => [e.id, e]))
  } catch { return new Map() }
})()

// ── Helpers ───────────────────────────────────────────────────────────────────
const norm = s => s?.toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')   // strip accents
  .replace(/[''`]/g, '')
  .replace(/\s+/g, ' ').trim() ?? ''

// Jaccard similarity on word sets — handles "avec haltères" vs "haltères"
function jaccard(a, b) {
  const wa = new Set(norm(a).split(' ').filter(w => w.length > 2))
  const wb = new Set(norm(b).split(' ').filter(w => w.length > 2))
  if (!wa.size || !wb.size) return 0
  let inter = 0
  for (const w of wa) if (wb.has(w)) inter++
  return inter / (wa.size + wb.size - inter)
}

function bestMatch(name, map) {
  let best = null, bestScore = 0
  for (const [k, v] of map) {
    const s = jaccard(name, k)
    if (s > bestScore) { bestScore = s; best = v }
  }
  return bestScore >= 0.6 ? best : null
}

const LEVEL_MAP = {
  'base':     'base',
  'avancé':   'advanced',
  'avancés':  'advanced',
  'finition': 'finishing',
}
const SIDE_MAP = {
  'antérieurs': 'anterior',
  'postérieurs': 'posterior',
}

// All keys pre-normalized (no accents) to match groupKey = norm(muscle_group)
const SIDE_BY_GROUP = {
  'pectoraux': 'anterior', 'epaules': 'anterior', 'deltoides': 'anterior',
  'biceps': 'anterior', 'quadriceps': 'anterior', 'abdominaux': 'anterior',
  'avants-bras': 'anterior', 'avant-bras': 'anterior',
  'dos': 'posterior', 'dorsaux': 'posterior',
  'ischio-jambiers': 'posterior', 'lombaires & ischio-jambiers': 'posterior',
  'fessiers': 'posterior', 'lombaires': 'posterior',
  'mollets': 'posterior', 'trapezes': 'posterior', 'triceps': 'posterior',
  'nuque': 'posterior',
}

const REST_BY_GROUP = {
  'pectoraux': 90, 'dos': 90, 'dorsaux': 90, 'quadriceps': 90,
  'ischio-jambiers': 90, 'fessiers': 90, 'lombaires': 90, 'epaules': 90, 'deltoides': 90,
  'biceps': 60, 'triceps': 60, 'mollets': 60, 'abdominaux': 60,
  'avants-bras': 60, 'avant-bras': 60,
}

// ── Build lookup from exercices_musculation.json (simple) ─────────────────────
// key = normalized exercise name → { level, muscle_side }
const simpleMap = new Map()
for (const row of simple.exercices) {
  const key = norm(row.exercice)
  simpleMap.set(key, {
    level:       LEVEL_MAP[norm(row.niveau)] ?? 'base',
    muscle_side: SIDE_MAP[norm(row.categorie)] ?? null,
    muscle_group: row.groupe_musculaire ?? null,
  })
}

// Patterns indicating the scraper got a wrong page instead of the exercise
function isBadName(rawNom, id) {
  const n = norm(rawNom ?? '')
  if (!n) return true
  if (n.includes('superphysique : de la motivation')) return true  // homepage
  if (n.includes(`exercice ${id}`)) return true                    // "Exercice 162 - SuperPhysique"
  if (n === 'superphysique') return true
  if (n.startsWith('exercice ') && n.includes('superphysique')) return true
  return false
}

// ── Build exercise rows ───────────────────────────────────────────────────────
const rows = []
for (const ex of complet.exercices) {
  // If DrissionPage returned a wrong page (homepage / 404), fall back to original data
  const isRedirected = isBadName(ex.nom, ex.id)
  const orig = complet0.get(ex.id) ?? {}

  const name = isRedirected ? orig.nom?.trim() : (ex.nom ?? '').trim()
  // Skip if both sources have invalid/generic names
  if (!name || isBadName(name, ex.id)) continue

  const key   = norm(name)
  const fuzzy = simpleMap.get(key) ?? bestMatch(name, simpleMap)

  // When redirected to homepage, use orig data for everything except details/video
  // (orig = exercices_musculation_complet.json which has no descriptions anyway)
  const src = isRedirected ? orig : ex

  // Prefer original complet0 category (reliable) over scraped one which may be "Non classé"
  const rawCategory  = src.categorie?.trim()
  const origCategory = complet0.get(ex.id)?.categorie?.trim()
  const muscle_group = (rawCategory && rawCategory !== 'Non classé' ? rawCategory : origCategory ?? fuzzy?.muscle_group ?? 'Inconnu')
  const groupKey     = norm(muscle_group)

  const execution   = isRedirected ? '' : (ex.details?.execution?.trim()   || '')
  const interet     = isRedirected ? '' : (ex.details?.interet?.trim()      || '')
  const variantes   = isRedirected ? '' : (ex.details?.variantes?.trim()    || '')
  const dangers     = isRedirected ? '' : (ex.details?.dangers_contre_indications?.trim() || '')

  // Concatenate execution + intérêt into description
  const parts = [execution, interet, variantes].filter(Boolean)
  const description = parts.length ? parts.join('\n\n') : null

  const video_url = isRedirected ? null : (ex.media?.video_youtube?.trim() || null)
  const principaux  = src.muscles_travailles?.principaux?.filter(Boolean) ?? []
  const secondaires = src.muscles_travailles?.secondaires?.filter(Boolean) ?? []

  rows.push({
    sp_id:       ex.id,
    name,
    muscle_group,
    equipment:            null,
    default_rest_seconds: REST_BY_GROUP[groupKey] ?? 90,
    joint_notes:          dangers || null,
    description:          description,
    video_url:            video_url,
    level:       fuzzy?.level ?? 'base',
    // muscle_side: prefer category-based lookup; only use fuzzy as last resort
    muscle_side: SIDE_BY_GROUP[groupKey] ?? fuzzy?.muscle_side ?? 'anterior',
    muscles_principaux:   principaux.length  ? principaux  : null,
    muscles_secondaires:  secondaires.length ? secondaires : null,
  })
}

// Deduplicate by name (keep last) — Postgres rejects duplicate conflict keys in one batch
const seen = new Map()
for (const r of rows) seen.set(r.name, r)
const uniqueRows = [...seen.values()]

// ── Upsert into Supabase ───────────────────────────────────────────────────────
console.log(`\n📦 Import de ${uniqueRows.length} exercices...\n`)

// Stats
const withDesc    = uniqueRows.filter(r => r.description).length
const withVideo   = uniqueRows.filter(r => r.video_url).length
const withMuscles = uniqueRows.filter(r => r.muscles_principaux?.length).length
const levelCount  = Object.fromEntries(
  ['base', 'advanced', 'finishing'].map(l => [l, uniqueRows.filter(r => r.level === l).length])
)
const sideCount   = {
  anterior:  uniqueRows.filter(r => r.muscle_side === 'anterior').length,
  posterior: uniqueRows.filter(r => r.muscle_side === 'posterior').length,
}
console.log(`   Avec description : ${withDesc}`)
console.log(`   Avec vidéo       : ${withVideo}`)
console.log(`   Avec muscles     : ${withMuscles}`)
console.log(`   BASE             : ${levelCount.base}`)
console.log(`   AVANCÉS          : ${levelCount.advanced}`)
console.log(`   FINITION         : ${levelCount.finishing}`)
console.log(`   Antérieurs       : ${sideCount.anterior}`)
console.log(`   Postérieurs      : ${sideCount.posterior}`)
console.log()

const CHUNK = 50
for (let i = 0; i < uniqueRows.length; i += CHUNK) {
  const chunk = uniqueRows.slice(i, i + CHUNK)
  const { error } = await supabase
    .from('exercises')
    .upsert(chunk, { onConflict: 'name' })
  if (error) {
    console.error(`❌ Chunk ${i + 1}–${i + CHUNK}: ${error.message}`)
    continue
  }
  console.log(`   ✓ ${i + 1}–${Math.min(i + CHUNK, uniqueRows.length)}`)
}

console.log('\n✅ Import terminé !')
