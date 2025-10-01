import { saveFile } from './utils.js'

export const writeSitemap = async (jobs) => {
  const urls = [ '/lp/orfjobs', ...jobs.map(j=>`/lp/orfjobs/jobs/${j.id}/`) ]
  const body = urls.map(u=>`  <url><loc>${u}</loc></url>`).join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`
  await saveFile('public/sitemap.xml', xml)
  await saveFile('public/robots.txt', `User-agent: *\nAllow: /\nSitemap: /lp/orfjobs/sitemap.xml\n`)
}
