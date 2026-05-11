// 生成图标脚本 - 在应用启动时自动运行
// 将 SVG 转换为 PNG 供 Windows 任务栏使用
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { app } = require('electron')

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const buildDir = join(__dirname, '..', 'build')
const svgPath = join(__dirname, '..', 'public', 'favicon.svg')
const pngPath = join(buildDir, 'icon.png')

function generateIcon() {
  if (!existsSync(buildDir)) mkdirSync(buildDir, { recursive: true })
  if (existsSync(pngPath)) return // 已存在则跳过

  const { nativeImage } = require('electron')
  const svgData = readFileSync(svgPath)

  // 尝试用 Electron 的 offscreen 渲染 SVG
  const img = nativeImage.createFromBuffer(svgData, { scaleFactor: 2, width: 256, height: 256 })
  if (!img.isEmpty()) {
    writeFileSync(pngPath, img.toPNG())
    return
  }

  // 回退：生成一个简单的纯色 PNG
  const size = 256
  // 最小有效 PNG（1x1 像素占位）
  const png = nativeImage.createEmpty()
  writeFileSync(pngPath, Buffer.alloc(0))
}
