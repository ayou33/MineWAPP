/**
 * File: worker.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/5/14 15:25
 */
import fs from 'fs'
import { minify } from 'terser'

function compressWorkers (root: string) {
  fs.readdirSync(root).forEach(async (file) => {
    const stat = fs.statSync(`${root}/${file}`)
    
    if (stat.isFile()) {
      const result = await minify(fs.readFileSync(`${root}/${file}`, 'utf-8'))
      fs.writeFileSync(`dist/worker/${file}`, result.code as string)
    } else {
      compressWorkers(`${root}/${file}`)
    }
  })
}

compressWorkers('public/worker')
