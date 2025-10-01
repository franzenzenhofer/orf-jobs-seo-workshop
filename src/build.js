import { fetchAll } from './fetch.js'
import { parseAll } from './parse.js'
import { downloadImages } from './images.js'
import { render } from './render.js'
import { mirrorListing, mirrorDetails } from './mirror.js'
import { writeSitemap } from './sitemap.js'
import { copyDir } from './copy.js'

const run = async () => {
  console.log('Fetching listing and details...')
  await fetchAll()
  console.log('Parsing jobs...')
  const jobs = await parseAll()
  console.log(`Found ${jobs.length} jobs`)
  console.log('Downloading images...')
  await downloadImages()
  await copyDir('assets/images','public/assets/images')
  console.log('Rendering static pages (exact mirror)...')
  await mirrorListing(jobs)
  await mirrorDetails(jobs)
  console.log('Writing sitemap and robots...')
  await writeSitemap(jobs)
  console.log('Done. Output in public/')
}

run().catch((e)=>{ console.error(e); process.exit(1) })
