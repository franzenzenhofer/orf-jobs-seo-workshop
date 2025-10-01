import { load } from 'cheerio'
import { readFile, saveFile, absolutize } from './utils.js'
import { injectSEO } from './seo.js'
import { writeListingPages } from './listing.js'

const BASE='https://www.evi.gv.at'
const imgName=(url)=>url.split('/').slice(-2).join('-').split('?')[0]

const rewriteAssets=(html, ctxPrefix='')=>{
  const $=load(html)
  const prefix = (ctxPrefix? ctxPrefix + '/' : '') + 'assets/images/'
  $('a[href^="/b/pi/"]').each((_,a)=>{
    const id=($(a).attr('href')||'').split('/').pop()
    $(a).attr('href', `/lp/orfjobs/jobs/${id}/`)
  })
  $('img[src]').each((_,img)=>{
    const src=$(img).attr('src')||''
    const abs=absolutize(src, BASE)
    const u=new URL(abs)
    let real=abs
    if (u.pathname.startsWith('/_next/image') && u.searchParams.get('url')) {
      const inner=u.searchParams.get('url')
      real=absolutize(inner, BASE)
      $(img).removeAttr('srcset').removeAttr('sizes')
    }
    $(img).attr('src', `${prefix}${imgName(real)}`)
    const name = imgName(real)
    const alt = $(img).attr('alt')
    if ((!alt || alt.trim()==='') && /usability-test-banner-background/.test(name)) {
      $(img).attr('alt','Header-Hintergrundbild: Aktuelle Jobs im ORF')
    }
  })
  $('[srcset]').each((_,el)=>{
    const v=$(el).attr('srcset')||''
    const out=v.split(',').map(s=>{
      const [u,d]=s.trim().split(' ')
      const abs=absolutize(u, BASE)
      return `${prefix}${imgName(abs)}${d?(' '+d):''}`
    }).join(', ')
    if(out) $(el).attr('srcset', out)
  })
  $('link[rel="preload"][as="image"]').each((_,l)=>{
    const abs=absolutize($(l).attr('href')||'', BASE)
    $(l).attr('href', `${prefix}${imgName(abs)}`)
  })
  return $.html()
}

// injectSEO imported from './seo.js'

export const mirrorListing=async (jobs)=>{
  let html=await readFile('data/listing.html')
  html=rewriteAssets(html,'')
  await writeListingPages(html, jobs)
}

export const mirrorDetails=async (jobs)=>{
  for(const j of jobs){
    let html=await readFile(`data/detail/${j.id}.html`).catch(()=>'<html><head></head><body></body></html>')
    html=rewriteAssets(html,'../..')
    const ld={'@context':'https://schema.org','@type':'JobPosting',title:j.title,hiringOrganization:{'@type':'Organization',name:j.org||'ORF'},datePosted:j.published||undefined,validThrough:j.applyEnd||undefined}
    html=injectSEO(html,{title:j.title||'Job',desc:`Stelle: ${j.title||''}`,canon:`/lp/orfjobs/jobs/${j.id}/`,ld, ogImage:'../../assets/images/images-usability-test-banner-background.webp'})
    await saveFile(`public/jobs/${j.id}/index.html`, html)
  }
}
