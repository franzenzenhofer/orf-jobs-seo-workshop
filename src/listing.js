import { load } from 'cheerio'; import { saveFile } from './utils.js'; import { injectSEO } from './seo.js'
const human = (d) => d ? d.split('-').reverse().join('.') : ''
const jobLi = (j) => { const expired=j.status!=='active'; const dl=(k,v)=>v?`<dt>${k}</dt><dd>${v}</dd>`:''; return `<li class="mb-4 max-w-[120ch] job-posting ${expired?'status-expired':'status-active'}" data-job-id="${j.id}"><div class="grid gap-2 pb-4 lg:grid-cols-[22ch_1fr] lg:gap-4"><article aria-labelledby="job-title-${j.id}"><header><h3 class="text-lg" id="job-title-${j.id}"><a class="hover:underline" href="/lp/orfjobs/jobs/${j.id}/">${j.title||''}</a></h3>${j.org?`<p class="hiring-organization">${j.org}</p>`:''}</header>${expired?'<div class="expired-label">Bewerbungsfrist abgelaufen</div>':''}<dl class="job-details grid gap-1 lg:grid-cols-[22ch_1fr] lg:gap-4">${dl('Standort:', j.loc||'')}${j.published?`<dt>Veröffentlicht am:</dt><dd><time datetime="${j.published}">${human(j.published)}</time></dd>`:''}${j.applyStart?`<dt>Bewerbungsfrist beginnt:</dt><dd><time datetime="${j.applyStart}">${human(j.applyStart)}</time></dd>`:''}${j.applyEnd?`<dt>Bewerbungsfrist endet:</dt><dd><time datetime="${j.applyEnd}">${human(j.applyEnd)}</time></dd>`:''}${dl('Jahresgehalt (Brutto):', j.salary||'')}${j.from?`<dt>Beschäftigungsbeginn:</dt><dd><time datetime="${j.from}">${human(j.from)}</time></dd>`:''}${j.to?`<dt>Beschäftigungsende:</dt><dd><time datetime="${j.to}">${human(j.to)}</time></dd>`:''}${dl('Verwendungsgruppe:', j.group||'')}</dl></article></div></li>` }
const pagNav=(pages,page)=>`<nav aria-label="Seitennavigation" class="pagination">${Array.from({length:pages},(_,i)=>{const n=i+1,cls=n===page?'page-item current':'page-item';return n===page?`<span class="${cls}">${n}</span>`:`<span class="${cls}" data-page-id="${n}" role="button" tabindex="0">${n}</span>`}).join(' ')}</nav>`
const addPagerScript=(html)=>{ const $=load(html); const s=`(<script>(()=>{const n=document.querySelector('nav.pagination');if(!n)return;function h(e){const t=e.target.closest('[data-page-id]');if(!t||t.tagName==='A')return;const p=t.getAttribute('data-page-id');const a=document.createElement('a');a.href=p==='1'?'/lp/orfjobs':'/lp/orfjobs/page/'+p+'/';a.textContent=t.textContent;a.className=t.className;a.classList.remove('current');t.replaceWith(a);}n.addEventListener('mousedown',h,true);n.addEventListener('touchstart',h,true);n.addEventListener('focusin',h,true);})();</script>)`; $('body').append(s); return $.html() }
export const writeListingPages = async (baseHtml, jobs) => {
  const active=jobs.filter(j=>j.status==='active'); const expired=jobs.filter(j=>j.status!=='active');
  const ordered=[...active]; while(ordered.length<10&&expired.length) ordered.push(expired.shift()); ordered.push(...expired)
  const per=10, pages=Math.max(1,Math.ceil(ordered.length/per)); const og='/lp/orfjobs/assets/images/images-usability-test-banner-background.webp'
  for (let p=1;p<=pages;p++){
    const slice=ordered.slice((p-1)*per,p*per)
    let html=baseHtml
    const $=load(html)
    const ul=$('ul.divide-trennLinie.divide-y').first(); if(ul.length) ul.html(slice.map(jobLi).join(''))
    $('main, section, div').each((_,el)=>{ if($(el).find('ul:has(li.job-posting)').length>0){ $(el).append(pagNav(pages,p)); return false }})
    // FAQ: open and build JSON-LD
    const faqSec=$('section:contains("Häufig gestellte Fragen")').first()
    const qas=[]; const scope = faqSec.length? faqSec : $('main')
    scope.find('details').each((_,d)=>{ const dd=$(d); dd.attr('open', ''); const q=dd.find('summary').text().trim().replace(/\s+/g,' '); if(!q) return; const a=dd.clone(); a.find('summary').remove(); const ans=a.text().trim().replace(/\s+/g,' '); if(ans) qas.push({ '@type':'Question', name:q, acceptedAnswer:{ '@type':'Answer', text: ans } }) })
    html=$.html()
    const ldGraph=[{ '@type':'ItemList', itemListElement: slice.map((j,i)=>({'@type':'ListItem',position:i+1,url:`/lp/orfjobs/jobs/${j.id}/`})) }]
    if (qas.length) ldGraph.push({ '@type':'FAQPage', mainEntity: qas })
    html=injectSEO(html,{title:'Offene Jobs im ORF | EVI',desc:'Entdecken Sie aktuelle Jobs beim Österreichischen Rundfunk (ORF) auf EVI.',canon:'/lp/orfjobs',ld:{ '@context':'https://schema.org','@graph': ldGraph },ogImage:og})
    html=addPagerScript(html)
    const out=p===1?'public/index.html':`public/page/${p}/index.html`; await saveFile(out, html)
  }
}
