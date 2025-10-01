import fs from 'node:fs/promises'
import path from 'node:path'
import { ensureDir } from './utils.js'

export const copyDir = async (src, dest) => {
  await ensureDir(dest)
  for (const e of await fs.readdir(src).catch(()=>[])){
    const sp=path.join(src,e), dp=path.join(dest,e)
    const st=await fs.stat(sp)
    if (st.isDirectory()) await copyDir(sp, dp)
    else await fs.copyFile(sp, dp)
  }
}
