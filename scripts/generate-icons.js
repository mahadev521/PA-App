// Generates all PWA icon sizes from icon.svg using sharp
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(join(__dirname, '../public/icon.svg'))

const icons = [
  { size: 16,  file: 'favicon-16.png' },
  { size: 32,  file: 'favicon-32.png' },
  { size: 180, file: 'apple-touch-icon.png' },
  { size: 192, file: 'icon-192.png' },
  { size: 512, file: 'icon-512.png' },
]

Promise.all(
  icons.map(({ size, file }) =>
    sharp(svg)
      .resize(size, size)
      .png()
      .toFile(join(__dirname, '../public', file))
      .then(() => console.log(`✓ ${file}`))
  )
).then(() => console.log('All icons generated.')).catch(console.error)
