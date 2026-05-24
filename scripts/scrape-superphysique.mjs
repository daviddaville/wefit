/**
 * Scraper for superphysique.org exercise catalog
 *
 * Usage:
 *   node scripts/scrape-superphysique.mjs --discover   ← inspect page structure
 *   node scripts/scrape-superphysique.mjs              ← full scrape → exercises.json
 *
 * Requires: npm install --save-dev cheerio
 */

import * as cheerio from 'cheerio'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const DISCOVER = process.argv.includes('--discover')

const BASE_URL = 'https://www.superphysique.org'
const LIST_URL = `${BASE_URL}/musculation/exercices_musculation`

const HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xhtml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
  'Referer':         'https://www.superphysique.org/',
  'Cache-Control':   'no-cache',
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchPage(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status} → ${url}`)
  return await res.text()
}

// ── Map level headings to canonical values ────────────────────────────────────
function parseLevel(text) {
  const t = text.toUpperCase()
  if (t.includes('BASE')     || t.includes('★') && !t.includes('★★')) return 'base'
  if (t.includes('AVANCÉ')   || t.includes('★★') && !t.includes('★★★')) return 'advanced'
  if (t.includes('FINITION') || t.includes('★★★')) return 'finishing'
  return null
}

function parseSide(text) {
  const t = text.toUpperCase()
  if (t.includes('ANTÉR')) return 'anterior'
  if (t.includes('POSTÉR')) return 'posterior'
  return null
}

// ── Phase 1: discover structure ───────────────────────────────────────────────
async function discover() {
  console.log(`\nFetching ${LIST_URL}...\n`)
  const html = await fetchPage(LIST_URL)
  const $ = cheerio.load(html)

  console.log('=== HEADINGS ===')
  $('h1,h2,h3,h4,h5,h6').each((_, el) => {
    console.log(`<${el.tagName}>  ${$(el).text().trim().slice(0, 80)}`)
  })

  console.log('\n=== FIRST 30 LINKS ===')
  $('a[href]').slice(0, 30).each((_, el) => {
    console.log(`${$(el).attr('href')}  →  ${$(el).text().trim().slice(0, 60)}`)
  })

  console.log('\n✅ Use these to adjust the selectors in scrapeList()')
}

// ── Phase 2: scrape list page ─────────────────────────────────────────────────
async function scrapeList() {
  console.log(`\nFetching exercise list...`)
  const html = await fetchPage(LIST_URL)
  const $ = cheerio.load(html)

  const items = []  // { name, href, muscle_group, level, muscle_side }

  let currentSide = 'anterior'
  let currentMuscle = ''
  let currentLevel = 'base'

  // Walk every meaningful block element in document order
  $('h2, h3, h4, h5, li').each((_, el) => {
    const tag  = el.tagName.toLowerCase()
    const text = $(el).text().trim()
    if (!text) return

    const side = parseSide(text)
    if (side) { currentSide = side; return }

    const level = parseLevel(text)
    if (level) { currentLevel = level; return }

    if (tag === 'h3' || tag === 'h4') {
      // Muscle group heading (Pectoraux, Dos, Épaules…)
      if (!parseSide(text) && !parseLevel(text)) {
        currentMuscle = text
      }
      return
    }

    // List item — may contain the exercise link
    const link = $(el).find('a[href]').first()
    const href = link.attr('href')
    const name = (link.text().trim() || text).replace(/\s+/g, ' ')
    if (!name || name.length < 3) return

    const fullHref = href
      ? (href.startsWith('http') ? href : `${BASE_URL}${href}`)
      : null

    items.push({
      name,
      href:         fullHref,
      muscle_group: currentMuscle,
      level:        currentLevel,
      muscle_side:  currentSide,
    })
  })

  console.log(`  Found ${items.length} exercises`)
  return items
}

// ── Phase 3: scrape individual detail page ────────────────────────────────────
async function scrapeDetail(item) {
  if (!item.href) return { ...item, description: null, video_url: null, joint_notes: null }

  let html
  try {
    html = await fetchPage(item.href)
  } catch (e) {
    console.warn(`  ⚠ ${item.name}: ${e.message}`)
    return { ...item, description: null, video_url: null, joint_notes: null }
  }

  const $ = cheerio.load(html)

  // ── Video ──────────────────────────────────────────────────────────────────
  let video_url = null
  const iframe = $('iframe[src*="youtube"]').first()
  if (iframe.length) {
    const src = iframe.attr('src') || ''
    const m   = src.match(/embed\/([A-Za-z0-9_-]{11})/)
    if (m) video_url = `https://www.youtube.com/watch?v=${m[1]}`
  }

  // ── Description (execution section) ────────────────────────────────────────
  let description = null
  // Try to find the execution paragraph — look for a heading containing "EXÉCUTION"
  // then grab the text that follows it
  let execFound = false
  const paragraphs = []
  $('h2, h3, h4, p, div').each((_, el) => {
    const t = $(el).text().trim()
    if (!t) return
    if (t.toUpperCase().includes('EXÉCUTION')) { execFound = true; return }
    if (execFound && (el.tagName === 'p' || el.tagName === 'div')) {
      // Stop at the next section heading
      if (t.length > 40) { paragraphs.push(t); }
      if (paragraphs.length >= 3) return false  // enough
    }
  })
  if (paragraphs.length) description = paragraphs.join('\n\n')

  // Fallback: first long paragraph on the page
  if (!description) {
    $('p').each((_, el) => {
      const t = $(el).text().trim()
      if (t.length > 80) { description = t; return false }
    })
  }

  // ── Joint notes ────────────────────────────────────────────────────────────
  let joint_notes = null
  $('h2,h3,h4,p').each((_, el) => {
    const t = $(el).text().trim()
    if (t.toUpperCase().includes('CONTRE-INDICATION') || t.toUpperCase().includes('DANGER')) {
      const next = $(el).next()
      const note = next.text().trim()
      if (note && note.toLowerCase() !== 'aucun') joint_notes = note
      return false
    }
  })

  return { ...item, description, video_url, joint_notes }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  if (DISCOVER) { await discover(); return }

  const list = await scrapeList()
  if (!list.length) {
    console.error('\n❌ No exercises found — run with --discover to inspect the page structure')
    process.exit(1)
  }

  console.log('\nScraping detail pages (1 req/sec)...')
  const results = []

  for (const item of list) {
    process.stdout.write(`  → ${item.name.slice(0, 50).padEnd(50)} `)
    const detail = await scrapeDetail(item)
    results.push(detail)
    console.log(detail.video_url ? '🎬' : detail.description ? '📝' : '—')
    await sleep(1000)   // be polite: 1 request/sec
  }

  const outPath = resolve(__dir, '../exercises.json')
  writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8')

  console.log(`\n✅ ${results.length} exercises saved → exercises.json`)
  console.log(`   with video  : ${results.filter(r => r.video_url).length}`)
  console.log(`   with desc   : ${results.filter(r => r.description).length}`)
  console.log(`   with warning: ${results.filter(r => r.joint_notes).length}`)
}

run().catch(e => { console.error('❌', e.message); process.exit(1) })
