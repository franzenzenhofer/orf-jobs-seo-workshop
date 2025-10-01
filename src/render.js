import { readFile, saveFile } from './utils.js'
import { minify } from 'html-minifier-terser'

const tpl = async (p) => readFile(p)
const human = (d) => d?.split('-').reverse().join('.')

const renderList = async (jobs, page, pages, allJobs) => {
  const head = await tpl('templates/head.html')
  const foot = await tpl('templates/foot.html')
  const itemTpl = await tpl('templates/jobItem.html')
  const faq = await tpl('templates/faq.html')
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
  const random = allJobs.filter(j=>!jobs.find(x=>x.id===j.id)).sort(()=>0.5-Math.random()).slice(0,5)
  const interlink = random.map(j=>`<li><a href="/lp/orfjobs/jobs/${j.id}/">${j.title}</a></li>`).join('')
  let html = head.replaceAll('{{title}}', title).replaceAll('{{description}}', desc).replaceAll('{{canonical}}', canon)
  html += `<h1>Aktuelle Jobs im ORF</h1><ul class="divide">${items}</ul><nav aria-label="Seitennavigation" class="pagination">${pag}</nav>`
  html += `<h3>Discover EVI</h3><ul>${interlink}</ul>`
  html += faq
  const ld = { '@context':'https://schema.org', '@graph':[
    { '@type':'ItemList', itemListElement: jobs.map((j,i)=>({ '@type':'ListItem', position:i+1, url:`/lp/orfjobs/jobs/${j.id}/` })) },
    { '@type':'FAQPage', mainEntity:[
      { '@type':'Question', name:'Wer darf mit einer Position im ORF betraut werden?', acceptedAnswer:{ '@type':'Answer', text:'Detaillierte Informationen zu den Anforderungen und Vorgaben zur Bestellung eines Generaldirektors, Direktors, Landesdirektors oder leitenden Angestellten finden Sie im ORF-Gesetz. RIS - ORF-Gesetz § 26 - Bundesrecht konsolidiert.' }},
      { '@type':'Question', name:'Welche anderen Stellenausschreibungen müssen auf EVI ausgeschrieben werden?', acceptedAnswer:{ '@type':'Answer', text:'Auf EVI werden unter anderem Leitungspositionen in bundesnahen Unternehmen sowie Richter- und Staatsanwaltstellen ausgeschrieben. Besuchen Sie unsere Stellenausschreibungen auf der Startseite unter evi.gv.at, um einen Überblick über aktuelle Positionen zu erhalten.' }},
      { '@type':'Question', name:'Ich suche eine ORF Stellenausschreibung, die nicht in der Liste ist. Können Sie mir weiterhelfen?', acceptedAnswer:{ '@type':'Answer', text:'In dieser Liste sehen Sie ausschließlich die aktuell aktiven Ausschreibungen des ORF. Alle veröffentlichten und vergangenen Stellenangebote können Sie jederzeit über die allgemeine Suche auf der Startseite evi.gv.at abrufen.' }},
      { '@type':'Question', name:'Ich möchte informiert werden, sobald es neue ORF Ausschreibungen gibt. Gibt es einen Benachrichtigungs-Agenten?', acceptedAnswer:{ '@type':'Answer', text:'Ja, Sie können sich für Benachrichtigungen über den roten Button "Updates abonnieren" anmelden. Einmal täglich werden Sie so automatisch über neue ORF-Stellenausschreibungen informiert.' }}
    ]}
  ]}
  html += `<script type="application/ld+json">${JSON.stringify(ld)}</script>`
  html += foot
  return minify(html,{collapseWhitespace:true,minifyCSS:true,removeComments:true})
}

const detailPage = async (j) => {
  const head = await tpl('templates/head.html')
  const foot = await tpl('templates/foot.html')
  const title = `${j.title} | ORF Jobs | EVI`
  const desc = `${j.title} beim ${j.org||'Österreichischen Rundfunk (ORF)'}. Bewerbungsfrist: ${human(j.applyEnd)||'siehe Details'}. ${j.salary?'Gehalt: '+j.salary:''}`
  const canon = `/lp/orfjobs/jobs/${j.id}/`
  let html = head.replaceAll('{{title}}', title).replaceAll('{{description}}', desc).replaceAll('{{canonical}}', canon)
  html += `<article><h1>${j.title}</h1><dl>`
  if(j.org) html+=`<dt>Organisation:</dt><dd>${j.org}</dd>`
  if(j.loc) html+=`<dt>Standort:</dt><dd>${j.loc}</dd>`
  if(j.published) html+=`<dt>Veröffentlicht am:</dt><dd><time datetime="${j.published}">${human(j.published)}</time></dd>`
  if(j.applyStart) html+=`<dt>Bewerbungsfrist beginnt:</dt><dd><time datetime="${j.applyStart}">${human(j.applyStart)}</time></dd>`
  if(j.applyEnd) html+=`<dt>Bewerbungsfrist endet:</dt><dd><time datetime="${j.applyEnd}">${human(j.applyEnd)}</time></dd>`
  if(j.salary) html+=`<dt>Jahresgehalt (Brutto):</dt><dd>${j.salary}</dd>`
  if(j.from) html+=`<dt>Beschäftigungsbeginn:</dt><dd><time datetime="${j.from}">${human(j.from)}</time></dd>`
  if(j.to) html+=`<dt>Beschäftigungsende:</dt><dd><time datetime="${j.to}">${human(j.to)}</time></dd>`
  if(j.group) html+=`<dt>Verwendungsgruppe:</dt><dd>${j.group}</dd>`
  html+=`</dl></article>`
  const ld = {
    '@context':'https://schema.org',
    '@type':'JobPosting',
    title:j.title,
    description:j.title,
    identifier:{
      '@type':'PropertyValue',
      name:j.org||'ORF',
      value:j.id
    },
    hiringOrganization:{
      '@type':'Organization',
      name:j.org||'Österreichischer Rundfund (ORF)',
      sameAs:'https://orf.at'
    },
    datePosted:j.published,
    validThrough:j.applyEnd,
    employmentType:j.group?'FULL_TIME':'FULL_TIME',
    jobLocation:{
      '@type':'Place',
      address:{
        '@type':'PostalAddress',
        addressLocality:j.loc||'Wien',
        addressCountry:'AT'
      }
    }
  }
  if(j.salary) {
    ld.baseSalary = {
      '@type':'MonetaryAmount',
      currency:'EUR',
      value:{
        '@type':'QuantitativeValue',
        value:j.salary.replace(/[^0-9.]/g,'')||0,
        unitText:'YEAR'
      }
    }
  }
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
    const html = await renderList(slice, p, pages, jobs)
    const out = p===1? 'public/index.html':`public/page/${p}/index.html`
    await saveFile(out, html)
  }
  for (const j of jobs) {
    const html = await detailPage(j)
    await saveFile(`public/jobs/${j.id}/index.html`, html)
  }
}
