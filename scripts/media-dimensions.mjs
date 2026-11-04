// Records the width/height of every image and video in public/media so pages
// can reserve the right space before media loads. Runs before every build.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { imageSize } from 'image-size'

const root = process.cwd()
const mediaRoot = path.join(root, 'public/media')
const outFile = path.join(root, 'content/media-dimensions.json')
const previous = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {}
const result = {}

const hasFfprobe = (() => {
  try {
    execFileSync('ffprobe', ['-version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })

for (const file of walk(mediaRoot)) {
  const publicPath = '/' + path.relative(path.join(root, 'public'), file).split(path.sep).join('/')
  const ext = path.extname(file).toLowerCase()
  try {
    if (['.mp4', '.webm', '.mov'].includes(ext)) {
      if (previous[publicPath]) {
        result[publicPath] = previous[publicPath]
      } else if (hasFfprobe) {
        const [width, height] = execFileSync('ffprobe', [
          '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file,
        ]).toString().trim().split(',').map(Number)
        if (width && height) result[publicPath] = { width, height }
      }
      continue
    }
    const { width, height } = imageSize(fs.readFileSync(file))
    if (width && height) result[publicPath] = { width, height }
  } catch {
    if (previous[publicPath]) result[publicPath] = previous[publicPath]
  }
}

fs.writeFileSync(outFile, JSON.stringify(result, null, 1) + '\n')
console.log(`media-dimensions: ${Object.keys(result).length} files measured`)
