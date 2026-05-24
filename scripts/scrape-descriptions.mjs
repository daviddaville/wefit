/**
 * Scraper Playwright pour les descriptions complètes SuperPhysique
 *
 * Installe d'abord :
 *   npm install --save-dev playwright
 *   npx playwright install chromium
 *
 * Puis lance :
 *   node scripts/scrape-descriptions.mjs
 *
 * Génère : exercices_avec_descriptions.json dans e:/sysencom/projects/wefit/
 */

import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root  = resolve(__dir, '../../')

// ── IDs des exercices ─────────────────────────────────────────────────────────
const EXERCISE_IDS = [
  102, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120,
  121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136,
  137, 138, 139, 140, 141, 142, 143, 144, 146, 147, 148, 149, 150, 151, 152, 153,
  154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169,
  170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185,
  186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 200, 308, 312, 313, 328, 337,
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── Extraction du contenu de la page ─────────────────────────────────────────
async function extractExercise(page, id) {
  const url = `https://www.superphysique.org/exercices/${id}`

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
  } catch {
    return { id, url, error: 'timeout' }
  }

  return await page.evaluate((exerciseId) => {
    // ── Nom ──────────────────────────────────────────────────────────────────
    const h1 = document.querySelector('h1')
    const nom = h1?.textContent?.trim() ?? ''

    // ── Catégorie (muscle group) ──────────────────────────────────────────────
    // On cherche les balises liées aux catégories dans les titres ou métadonnées
    const categorie = document.querySelector('meta[property="article:section"]')?.content
      ?? document.querySelector('.categorie, .category, [class*="categ"]')?.textContent?.trim()
      ?? ''

    // ── Sections de contenu ───────────────────────────────────────────────────
    // Le site structure ses pages avec des titres h2/h3 suivis de contenu
    // On parcourt tous les éléments pour reconstituer les sections
    const sections = {}
    const SECTION_MAP = {
      'exécution':             'execution',
      'execution':             'execution',
      'muscles travaillés':    'muscles',
      'muscles travailles':    'muscles',
      'intérêt':               'interet',
      'interet':               'interet',
      'variante':              'variantes',
      'danger':                'dangers',
      'contre-indication':     'dangers',
      'contre indication':     'dangers',
    }

    let currentSection = null
    const allElements = document.querySelectorAll('h2, h3, h4, p, ul, div.texte, div.content, article p')

    for (const el of allElements) {
      const tag  = el.tagName.toLowerCase()
      const text = el.textContent?.trim() ?? ''
      if (!text) continue

      if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
        const lower = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        for (const [key, val] of Object.entries(SECTION_MAP)) {
          if (lower.includes(key.normalize('NFD').replace(/[̀-ͯ]/g, ''))) {
            currentSection = val
            sections[val] = sections[val] ?? ''
            break
          }
        }
      } else if (currentSection && (tag === 'p' || tag === 'ul' || el.classList.contains('texte'))) {
        if (text.length > 5) {
          sections[currentSection] += (sections[currentSection] ? '\n\n' : '') + text
        }
      }
    }

    // Fallback : prendre tous les paragraphes après le premier h2
    if (!sections.execution) {
      const firstH2 = document.querySelector('h2')
      if (firstH2) {
        let el = firstH2.nextElementSibling
        const parts = []
        while (el && el.tagName !== 'H2' && parts.length < 5) {
          const t = el.textContent?.trim()
          if (t && t.length > 30) parts.push(t)
          el = el.nextElementSibling
        }
        if (parts.length) sections.execution = parts.join('\n\n')
      }
    }

    // ── Vidéo YouTube ────────────────────────────────────────────────────────
    let video_youtube = ''
    const iframe = document.querySelector('iframe[src*="youtube"]')
    if (iframe) {
      const src = iframe.getAttribute('src') ?? ''
      const m = src.match(/embed\/([A-Za-z0-9_-]{11})/)
      if (m) video_youtube = `https://www.youtube.com/watch?v=${m[1]}`
    }
    if (!video_youtube) {
      const link = document.querySelector('a[href*="youtube.com/watch"]')
      if (link) video_youtube = link.getAttribute('href') ?? ''
    }

    // ── Muscles travaillés ───────────────────────────────────────────────────
    const musclesPrinc = []
    const musclesSec   = []
    if (sections.muscles) {
      const lines = sections.muscles.split(/\n|·|•|-/).map(s => s.trim()).filter(Boolean)
      let inSec = false
      for (const line of lines) {
        if (/secondaire/i.test(line)) { inSec = true; continue }
        if (line.length > 2 && line.length < 60) {
          (inSec ? musclesSec : musclesPrinc).push(line.toLowerCase())
        }
      }
    }

    return {
      id: exerciseId,
      url: window.location.href,
      nom,
      categorie,
      details: {
        execution: sections.execution ?? '',
        interet:   sections.interet   ?? '',
        variantes: sections.variantes ?? '',
        dangers_contre_indications: sections.dangers ?? '',
      },
      muscles_travailles: { principaux: musclesPrinc, secondaires: musclesSec },
      media: { video_youtube },
    }
  }, id)
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  // Load existing data to preserve already-scraped entries
  const existingPath = resolve(root, 'exercices_musculation_complet.json')
  const existing = JSON.parse(readFileSync(existingPath, 'utf8'))
  const existingMap = new Map(existing.exercices.map(e => [e.id, e]))

  const outPath = resolve(root, 'exercices_avec_descriptions.json')

  console.log('\n🚀 Démarrage du scraper Playwright...')
  const browser = await chromium.launch({
    headless: false,    // visible : contourne mieux la détection
    args: ['--lang=fr-FR'],
  })

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  // Visite la page d'accueil d'abord pour obtenir les cookies
  await page.goto('https://www.superphysique.org/musculation/exercices_musculation', {
    waitUntil: 'networkidle',
    timeout: 20000,
  }).catch(() => {})
  await sleep(2000)

  const results = []
  let withDesc = 0

  for (let i = 0; i < EXERCISE_IDS.length; i++) {
    const id = EXERCISE_IDS[i]
    const progress = `[${i + 1}/${EXERCISE_IDS.length}]`

    process.stdout.write(`${progress} ID ${id}... `)

    const data = await extractExercise(page, id)

    // Merge avec les données existantes (muscles, url, nom)
    const base = existingMap.get(id) ?? {}
    const merged = {
      ...base,
      ...data,
      nom: data.nom || base.nom || '',
      categorie: data.categorie || base.categorie || '',
      muscles_travailles: {
        principaux:  data.muscles_travailles?.principaux?.length
          ? data.muscles_travailles.principaux
          : base.muscles_travailles?.principaux ?? [],
        secondaires: data.muscles_travailles?.secondaires?.length
          ? data.muscles_travailles.secondaires
          : base.muscles_travailles?.secondaires ?? [],
      },
      media: {
        video_youtube: data.media?.video_youtube || base.media?.video_youtube || '',
      },
    }

    const hasDesc = merged.details?.execution?.length > 50
    if (hasDesc) withDesc++
    console.log(hasDesc ? `✅ (${merged.details.execution.length} chars)` : '—')

    results.push(merged)

    // Sauvegarde progressive (au cas où le script s'interrompt)
    if ((i + 1) % 10 === 0 || i === EXERCISE_IDS.length - 1) {
      writeFileSync(outPath, JSON.stringify({ metadata: existing.metadata, exercices: results }, null, 2), 'utf8')
    }

    await sleep(800 + Math.random() * 400)   // 800-1200ms entre chaque requête
  }

  await browser.close()

  console.log(`\n✅ Terminé ! ${withDesc}/${results.length} exercices avec description`)
  console.log(`📁 Fichier : exercices_avec_descriptions.json`)
}

run().catch(e => { console.error('❌', e.message); process.exit(1) })
