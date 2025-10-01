import { ensureDir, saveFile, absolutize } from './utils.js'
import fs from 'node:fs/promises'

const BASE = 'https://www.evi.gv.at'

const fetchBin = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('img fetch ' + res.status)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

export const downloadImages = async () => {
  await ensureDir('assets/images')
  const files = await fs.readdir('data/detail').catch(() => [])
  for (const f of ['listing.html', ...files.map((x) => `detail/${x}`)]) {
    const html = await fs.readFile(`data/${f}`, 'utf8').catch(() => '')
    const imgs = Array.from(html.matchAll(/<img[^>]+src=["']([^"'>]+)["']/g)).map((m) => m[1])
    for (const src of imgs) {
      try {
        const abs = absolutize(src, BASE)
        const u = new URL(abs)
        let real = abs
        if (u.pathname.startsWith('/_next/image') && u.searchParams.get('url')) {
          const inner = u.searchParams.get('url')
          real = absolutize(inner, BASE)
        }
        const name = real.split('/').slice(-2).join('-').split('?')[0]
        const out = `assets/images/${name}`
        if (!await fs.stat(out).catch(() => null)) {
          const buf = await fetchBin(real)
          await saveFile(out, buf)
        }
      } catch {}
    }
  }
}
