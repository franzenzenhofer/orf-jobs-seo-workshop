import { load } from 'cheerio'
import { readFile, parseDate, safeText } from './utils.js'
import fs from 'node:fs/promises'

const BASE = 'https://www.evi.gv.at'

const parseDetail = async (id, fallbackPub='') => {
  const html = await readFile(`data/detail/${id}.html`).catch(() => '')
  const $ = load(html)
  const title = $('h1, h2').first().text().trim()
  const org = $('[itemprop="hiringOrganization"], .hiring-organization').first().text().trim()
  const text = $('body').text()
  const loc = $('[itemprop="jobLocation"], .job-location').first().text().trim() || (text.match(/Ort:?\s*(.+)/) || [])[1] || ''
  const pubByLabel = parseDate((text.match(/Veröffentlicht[^\d]*(\d{2}\.\d{2}\.\d{4}|\d{4}[-.]\d{2}[-.]\d{2})/)||[])[1])
  const published = pubByLabel || parseDate($('time[datetime]').first().attr('datetime') || text) || fallbackPub
  const applyStart = parseDate((text.match(/Bewerbungsfrist beginnt:?\s*([\s\S]{0,20})/) || [])[1])
  const applyEnd = parseDate((text.match(/Bewerbungsfrist endet:?\s*([\s\S]{0,20})/) || [])[1])
  let salary = (text.match(/(€|EUR)[^\n]{0,60}/) || [])[0] || ''
  if (/EURIN|\/_de_DE\//i.test(salary)) salary = ''
  const from = parseDate((text.match(/Beschäftigungsbeginn:?\s*([\s\S]{0,20})/) || [])[1])
  const to = parseDate((text.match(/Beschäftigungsende:?\s*([\s\S]{0,20})/) || [])[1])
  const group = (text.match(/Verwendungsgruppe:?\s*([A-Z0-9 ]{1,8})/) || [])[1] || ''
  return { id, url: `${BASE}/b/pi/${id}`, title, org, loc, published, applyStart, applyEnd, salary, from, to, group }
}

export const parseAll = async () => {
  const listing = await readFile('data/listing.html')
  const $ = load(listing)
  const items = []
  $('a[href*="/b/pi/"]').each((_, a) => {
    const href = $(a).attr('href')
    const id = (href || '').split('/').pop()
    const t = safeText($(a).find('p, h3').last()) || safeText($(a))
    const pub = parseDate(safeText($(a).find('time'))) || parseDate(safeText($(a)))
    if (id && !items.find((x) => x.id === id)) items.push({ id, title: t, published: pub })
  })
  const details = []
  for (const it of items) details.push(await parseDetail(it.id, it.published))
  const today = new Date().toISOString().slice(0, 10)
  for (const d of details) d.status = d.applyEnd && d.applyEnd < today ? 'expired' : 'active'
  details.sort((a, b) => (b.published || '').localeCompare(a.published || ''))
  return details
}
