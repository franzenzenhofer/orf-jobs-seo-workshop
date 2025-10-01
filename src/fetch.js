import { saveFile, ensureDir, absolutize, sleep } from './utils.js'
import path from 'node:path'

const BASE = 'https://www.evi.gv.at'
const LIST_URL = `${BASE}/lp/orfjobs`

const fetchText = async (url) => {
  const res = await fetch(url, { headers: { 'user-agent': 'evi-dummy/0.1' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

export const fetchAll = async () => {
  await ensureDir('data/detail')
  if (process.env.SNAPSHOT === '1') return
  const listing = await fetchText(LIST_URL)
  await saveFile('data/listing.html', listing)

  // naive link extraction to reduce deps
  const links = Array.from(listing.matchAll(/href="([^"]+)"/g))
    .map((m) => m[1])
    .filter((u) => /\/b\/pi\//.test(u))
    .map((u) => absolutize(u, BASE))
  const uniq = [...new Set(links)].slice(0, 60)

  for (const url of uniq) {
    const id = url.split('/').pop()
    const p = path.join('data/detail', `${id}.html`)
    try {
      const html = await fetchText(url)
      await saveFile(p, html)
      await sleep(100)
    } catch (e) {
      await saveFile(p, `<!-- fetch failed: ${e.message} -->`)
    }
  }
}
