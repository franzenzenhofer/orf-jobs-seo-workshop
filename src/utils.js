import fs from 'node:fs/promises'
import path from 'node:path'

export const ensureDir = async (p) => fs.mkdir(p, { recursive: true })

export const saveFile = async (p, data) => {
  await ensureDir(path.dirname(p))
  await fs.writeFile(p, data)
}

export const readFile = async (p) => fs.readFile(p, 'utf8')

export const todayISO = () => new Date().toISOString().slice(0, 10)

export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const absolutize = (u, base) => new URL(u, base).toString()

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export const safeText = (el) => (el?.text()?.trim?.() ?? '').replace(/\s+/g, ' ')

export const parseDate = (s) => {
  const m = (s || '').match(/(\d{4})[-.](\d{2})[-.](\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  const dm = (s || '').match(/(\d{2})\.(\d{2})\.(\d{4})/)
  if (dm) return `${dm[3]}-${dm[2]}-${dm[1]}`
  return ''
}
