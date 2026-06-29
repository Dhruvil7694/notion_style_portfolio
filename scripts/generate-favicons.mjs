#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

import sharp from "sharp"

const ROOT = process.cwd()
const SOURCE_DIR = path.join(ROOT, "src/shared/assets/logo")
const OUTPUT_DIR = path.join(ROOT, "public/icons")
const APP_ICON_PATH = path.join(ROOT, "src/app/icon.png")
const APP_APPLE_ICON_PATH = path.join(ROOT, "src/app/apple-icon.png")

const VARIANTS = [
  {
    name: "light",
    source: "logo_light.png",
    background: "#171717",
  },
  {
    name: "dark",
    source: "logo_dark.png",
    background: "#ffffff",
  },
]

const SIZES = [16, 32, 48]
const ALPHA_THRESHOLD = 20
const BOUNDS_PADDING_RATIO = 0.06
const ICON_PADDING_RATIO = 0.14
const BORDER_RADIUS_RATIO = 0.2

async function getOpaqueBounds(sourcePath) {
  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let minX = info.width
  let minY = info.height
  let maxX = 0
  let maxY = 0

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const alpha = data[(y * info.width + x) * 4 + 3]
      if (alpha > ALPHA_THRESHOLD) {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    throw new Error(`No opaque logo pixels found in ${sourcePath}`)
  }

  const markWidth = maxX - minX + 1
  const markHeight = maxY - minY + 1
  const padX = Math.round(markWidth * BOUNDS_PADDING_RATIO)
  const padY = Math.round(markHeight * BOUNDS_PADDING_RATIO)
  const left = Math.max(0, minX - padX)
  const top = Math.max(0, minY - padY)
  const width = Math.min(info.width - left, markWidth + padX * 2)
  const height = Math.min(info.height - top, markHeight + padY * 2)

  return { left, top, width, height }
}

function roundedSquareBackground(size, background) {
  const radius = Math.max(2, Math.round(size * BORDER_RADIUS_RATIO))
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${background}"/></svg>`
  )
}

async function renderSquareIcon(sourcePath, size, background) {
  const bounds = await getOpaqueBounds(sourcePath)
  const padding = Math.max(2, Math.round(size * ICON_PADDING_RATIO))
  const inner = size - padding * 2

  const logo = await sharp(sourcePath)
    .extract(bounds)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  return sharp(roundedSquareBackground(size, background))
    .resize(size, size)
    .composite([{ input: logo, top: padding, left: padding }])
    .png()
    .toBuffer()
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  for (const variant of VARIANTS) {
    const sourcePath = path.join(SOURCE_DIR, variant.source)

    for (const size of SIZES) {
      const outputPath = path.join(
        OUTPUT_DIR,
        `favicon-${size}-${variant.name}.png`
      )
      const buffer = await renderSquareIcon(
        sourcePath,
        size,
        variant.background
      )
      await writeFile(outputPath, buffer)
      console.log(`wrote ${path.relative(ROOT, outputPath)}`)
    }

    const applePath = path.join(OUTPUT_DIR, `apple-icon-${variant.name}.png`)
    const appleBuffer = await renderSquareIcon(
      sourcePath,
      180,
      variant.background
    )
    await writeFile(applePath, appleBuffer)
    console.log(`wrote ${path.relative(ROOT, applePath)}`)
  }

  const appIconBuffer = await renderSquareIcon(
    path.join(SOURCE_DIR, "logo_dark.png"),
    48,
    "#ffffff"
  )
  await writeFile(APP_ICON_PATH, appIconBuffer)
  console.log(`wrote ${path.relative(ROOT, APP_ICON_PATH)}`)

  const appAppleBuffer = await renderSquareIcon(
    path.join(SOURCE_DIR, "logo_dark.png"),
    180,
    "#ffffff"
  )
  await writeFile(APP_APPLE_ICON_PATH, appAppleBuffer)
  console.log(`wrote ${path.relative(ROOT, APP_APPLE_ICON_PATH)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
