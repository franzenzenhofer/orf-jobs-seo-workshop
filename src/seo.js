import { load } from 'cheerio'

export const injectSEO = (html, { title, desc, canon, ld, ogImage }) => {
  const $ = load(html)
  const H = $('head')
  if (!H.length) return html
  $('script').remove()
  $('link[rel="preload"][as="script"]').remove()
  $('link[rel="canonical"], meta[name="description"], meta[property^="og:"], meta[name^="twitter:"]').remove()
  H.append(`<link rel="canonical" href="${canon}">`)
  if (desc) H.append(`<meta name="description" content="${desc}">`)
  H.append(`<meta property="og:type" content="website">`)
  H.append(`<meta property="og:title" content="${title}">`)
  H.append(`<meta property="og:description" content="${desc}">`)
  H.append(`<meta property="og:url" content="${canon}">`)
  if (ogImage) { H.append(`<meta property="og:image" content="${ogImage}">`); H.append(`<meta name="twitter:image" content="${ogImage}">`) }
  H.append(`<meta name="twitter:card" content="summary_large_image">`)
  if (ld) H.append(`<script type="application/ld+json">${JSON.stringify(ld)}</script>`)
  // Minimal list styling to improve separation while preserving layout
  H.append(`<style>.job-posting{padding:1rem 0}.job-posting+.job-posting{border-top:1px solid rgba(0,0,0,.08)}.expired-label{background:#eef2f7;border-radius:4px;padding:.1rem .5rem;color:#445}.job-posting dt{color:#667}</style>`)
  return $.html()
}
