import { readFile, saveFile } from './utils.js'
import { minify } from 'html-minifier-terser'

const tpl = async (p) => readFile(p)
const human = (d) => d?.split('-').reverse().join('.')

const renderList = async (jobs, page, pages) => {
  const head = await tpl('templates/head.html')
  const foot = await tpl('templates/foot.html')
  const itemTpl = await tpl('templates/jobItem.html')
  const title = 'Aktuelle Jobs im ORF | Stellenausschreibungen | EVI'
  const desc = 'Alle aktuellen und vergangenen Stellenausschreibungen des Österreichischen Rundfunks (ORF). Detaillierte Informationen zu Bewerbungsfristen, Gehalt und Anforderungen.'
  const canon = page===1?'/lp/orfjobs':`/lp/orfjobs/page/${page}/`
  const items = jobs.map((j)=> itemTpl
    .replaceAll('{{status}}', j.status)
    .replaceAll('{{id}}', j.id)
    .replaceAll('{{title}}', j.title||'')
    .replace('{{#org}}', j.org? '':'<!--').replace('{{/org}}', j.org? '':'-->')
    .replaceAll('{{org}}', j.org||'')
    .replace('{{#expired}}', j.status==='expired'?'':'<!--').replace('{{/expired}}', j.status==='expired'?'':'-->')
    .replace('{{#loc}}', j.loc?'':'<!--').replace('{{/loc}}', j.loc?'':'-->').replaceAll('{{loc}}', j.loc||'')
    .replace('{{#published}}', j.published?'':'<!--').replace('{{/published}}', j.published?'':'-->')
    .replaceAll('{{published}}', j.published||'').replaceAll('{{publishedHuman}}', human(j.published)||'')
    .replace('{{#applyStart}}', j.applyStart?'':'<!--').replace('{{/applyStart}}', j.applyStart?'':'-->').replaceAll('{{applyStart}}', j.applyStart||'')
    .replace('{{#applyEnd}}', j.applyEnd?'':'<!--').replace('{{/applyEnd}}', j.applyEnd?'':'-->').replaceAll('{{applyEnd}}', j.applyEnd||'')
    .replace('{{#salary}}', j.salary?'':'<!--').replace('{{/salary}}', j.salary?'':'-->').replaceAll('{{salary}}', j.salary||'')
    .replace('{{#from}}', j.from?'':'<!--').replace('{{/from}}', j.from?'':'-->').replaceAll('{{from}}', j.from||'')
    .replace('{{#to}}', j.to?'':'<!--').replace('{{/to}}', j.to?'':'-->').replaceAll('{{to}}', j.to||'')
    .replace('{{#group}}', j.group?'':'<!--').replace('{{/group}}', j.group?'':'-->').replaceAll('{{group}}', j.group||'')
  ).join('\n')
  const pag = Array.from({length: pages},(_,i)=>{
    const n=i+1, cls=n===page?'page-item current':'page-item'
    return n===page?`<span class="${cls}">${n}</span>`:`<span class="${cls}" data-page-id="${n}" role="button" tabindex="0">${n}</span>`
  }).join(' ')
  let html = head.replaceAll('{{title}}', title).replaceAll('{{description}}', desc).replaceAll('{{canonical}}', canon)
  html += `<h1>ORF‑Jobs</h1><ul class="divide">${items}</ul><nav aria-label="Seitennavigation" class="pagination">${pag}</nav>`
  const ld = { '@context':'https://schema.org', '@type':'ItemList', itemListElement: jobs.map((j,i)=>({ '@type':'ListItem', position:i+1, url:`/lp/orfjobs/jobs/${j.id}/` })) }
  html += `<script type="application/ld+json">${JSON.stringify(ld)}</script>`
  html += foot
  return minify(html,{collapseWhitespace:true,minifyCSS:true,removeComments:true})
}

const detailPage = async (j) => {
  const head = await tpl('templates/head.html')
  const foot = await tpl('templates/foot.html')
  const title = `${j.title} – ORF‑Jobs`
  const desc = `Stelle: ${j.title} bei ${j.org||'ORF'}`
  const canon = `/lp/orfjobs/jobs/${j.id}/`
  let html = head.replaceAll('{{title}}', title).replaceAll('{{description}}', desc).replaceAll('{{canonical}}', canon)
  html += `<article><h1>${j.title}</h1><p>${j.org||''}</p>`
  html += `<p><strong>Veröffentlicht:</strong> ${human(j.published)||''}</p></article>`
  const ld = { '@context':'https://schema.org', '@type':'JobPosting', title:j.title, hiringOrganization:{'@type':'Organization',name:j.org||'ORF'}, datePosted:j.published||undefined, validThrough:j.applyEnd||undefined, jobLocation:{'@type':'Place',address:{'@type':'PostalAddress',addressLocality:j.loc||''}}, baseSalary:j.salary||undefined, employmentType: j.group||undefined }
  html += `<script type="application/ld+json">${JSON.stringify(ld)}</script>`
  html += foot
  return minify(html,{collapseWhitespace:true,minifyCSS:true,removeComments:true})
}

export const render = async (jobs) => {
  const active = jobs.filter(j=>j.status==='active')
  const expired = jobs.filter(j=>j.status!=='active')
  const list = [...active, ...expired]
  while (list.length<10 && expired.length) list.push(expired.shift())
  const per=10, pages=Math.max(1,Math.ceil(list.length/per))
  for(let p=1;p<=pages;p++){
    const slice=list.slice((p-1)*per, p*per)
    const html = await renderList(slice, p, pages)
    const out = p===1? 'public/index.html':`public/page/${p}/index.html`
    await saveFile(out, html)
  }
  for (const j of jobs) {
    const html = await detailPage(j)
    await saveFile(`public/jobs/${j.id}/index.html`, html)
  }
}
