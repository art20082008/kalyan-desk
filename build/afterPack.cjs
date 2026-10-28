const fs = require('fs')
const path = require('path')

// Эти dll не нужны интерфейсу без видео и без программного WebGL.
// Без них архив помещается в лимит репозитория, а окно открывается как обычно.
const OPTIONAL = ['vk_swiftshader.dll', 'vk_swiftshader_icd.json', 'ffmpeg.dll']

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return
  for (const name of OPTIONAL) {
    const file = path.join(context.appOutDir, name)
    if (fs.existsSync(file)) fs.rmSync(file)
  }
}
