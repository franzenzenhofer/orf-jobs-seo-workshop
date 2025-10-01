import fs from 'node:fs/promises'
import path from 'node:path'

const mustHave = [
  ['public/index.html', ['<link rel="canonical"', 'application/ld+json', '<meta name="description"']]
]

const rgxExternalImg = /(https?:)?\/\//
const rgxExternalScript = /<script[^>]+src=\"(https?:)?\//i
const imgAltMissing = /<img(?![^>]*\balt=)/i

const listHtmlFiles = async (root) => {
  const stack=[root]; const out=[]
  while(stack.length){
    const dir=stack.pop()
    for(const e of await fs.readdir(dir)){
      const p=dir+'/'+e
      const st=await fs.stat(p)
      if(st.isDirectory()) stack.push(p)
      else if(p.endsWith('.html')) out.push(p)
    }
  }
  return out
}

const checkLocalImages = async () => {
  const files = await listHtmlFiles('public')
  for (const f of files){
    const html = await fs.readFile(f,'utf8')
    const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/g)].map(m=>({src:m[1], file:f}))
    for (const {src,file} of imgs){
      if (rgxExternalImg.test(src) || src.startsWith('/')) throw new Error(`External or root-abs image in ${file}: ${src}`)
      const dir = path.dirname(file)
      const full = path.resolve(dir, src)
      try { await fs.stat(full) } catch { throw new Error(`Missing image file for ${file}: ${src}`) }
    }
  }
}

const checkFileLen = async (dir) => {
  const ents = await fs.readdir(dir)
  for (const f of ents) {
    if (!/\.(js|html|md|json)$/.test(f)) continue
    const t = await fs.readFile(`${dir}/${f}`, 'utf8')
    const lines = t.split(/\r?\n/).length
    if (lines > 75) throw new Error(`${dir}/${f} exceeds 75 lines (${lines})`)
  }
}

const main = async () => {
  for (const [file, needles] of mustHave) {
    const html = await fs.readFile(file, 'utf8')
    for (const n of needles) if (!html.includes(n)) throw new Error(`${file} missing ${n}`)
    if (rgxExternalScript.test(html)) throw new Error(`${file} contains external <script src>`)
    if (imgAltMissing.test(html)) throw new Error(`${file} has <img> without alt attribute`)
    if (!/li class=\"[^\"]*job-posting/.test(html)) throw new Error(`${file} missing semantic job items`)
    if (!/<article[^>]*aria-labelledby=/.test(html)) throw new Error(`${file} missing <article aria-labelledby>`)
    if (!/<h3[^>]*>\s*<a /.test(html)) throw new Error(`${file} missing <h3><a> title link`)
    if (!/<dl[^>]*class=\"[^\"]*job-details/.test(html) && !/class=\"[^\"]*job-details/.test(html)) console.warn('Note: job-details class not found; ensure dl present')
  }
  await checkLocalImages()
  await checkFileLen('src'); await checkFileLen('templates'); await checkFileLen('scripts')
  console.log('Lint OK')
}

main().catch((e)=>{ console.error(e.message||e); process.exit(1) })
