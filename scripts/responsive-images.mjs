// Makes smaller copies of every image in public/media (828px and 1440px wide,
// WebP) so phones and laptops don't download the full 2232px originals.
// Runs at build time, so images added later through the editor get them too.
// The copies are not committed (see .gitignore).
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

export const WIDTHS = [828, 1440]
const root = path.join(process.cwd(), 'public/media')
const isSource = (f) => /\.(webp|png|jpe?g)$/i.test(f) && !/\.w\d+\.webp$/i.test(f)

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : isSource(e.name) ? [p] : []
  })
}

const variantPath = (file, w) => file.replace(/\.[^.]+$/, `.w${w}.webp`)

async function makeVariants(file) {
  const stat = fs.statSync(file)
  for (const w of WIDTHS) {
    const out = variantPath(file, w)
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= stat.mtimeMs) continue
    const meta = await sharp(file, { animated: true }).metadata()
    await sharp(file, { animated: true })
      .resize({ width: Math.min(w, meta.width || w), withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toFile(out)
  }
}

const files = walk(root)
const started = Date.now()
let i = 0
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (i < files.length) {
      const file = files[i++]
      try {
        await makeVariants(file)
      } catch (error) {
        console.warn(`Could not resize ${path.relative(root, file)}: ${error.message}`)
      }
    }
  }),
)
console.log(`Responsive images ready for ${files.length} files in ${((Date.now() - started) / 1000).toFixed(0)}s`)
