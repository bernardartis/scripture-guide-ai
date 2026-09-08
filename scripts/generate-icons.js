const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Check if sharp is available
try {
  require('sharp')
} catch {
  console.log('Installing sharp for icon generation...')
  execSync('npm install sharp --save-dev', { stdio: 'inherit' })
}

const sharp = require('sharp')

const ICON_SIZES = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]
const outputDir = 'ios/App/App/Assets.xcassets/AppIcon.appiconset'

async function generateIcons() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Create a PNG version of the app icon at 1024x1024
  // Deep navy background (#0e1420), deep blue pin (#2E3A59), warm white center (#F8F7F4), gold dot (#D6C7A1)
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
      <rect width="1024" height="1024" rx="230" fill="#0e1420"/>
      <circle cx="512" cy="440" r="160" fill="#2E3A59"/>
      <circle cx="512" cy="440" r="80" fill="#F8F7F4"/>
      <circle cx="512" cy="440" r="28" fill="#D6C7A1"/>
      <path d="M512 600 C512 600 332 720 332 840 Q332 928 512 928 Q692 928 692 840 C692 720 512 600 512 600Z" fill="#2E3A59"/>
    </svg>
  `

  const svgBuffer = Buffer.from(svgContent)

  for (const size of ICON_SIZES) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}.png`))
    console.log(`Generated ${size}x${size} icon`)
  }

  // Generate Contents.json for Xcode
  const contents = {
    images: [
      { size: '20x20', idiom: 'iphone', filename: 'icon-40.png', scale: '2x' },
      { size: '20x20', idiom: 'iphone', filename: 'icon-60.png', scale: '3x' },
      { size: '29x29', idiom: 'iphone', filename: 'icon-58.png', scale: '2x' },
      { size: '29x29', idiom: 'iphone', filename: 'icon-87.png', scale: '3x' },
      { size: '40x40', idiom: 'iphone', filename: 'icon-80.png', scale: '2x' },
      { size: '40x40', idiom: 'iphone', filename: 'icon-120.png', scale: '3x' },
      { size: '60x60', idiom: 'iphone', filename: 'icon-120.png', scale: '2x' },
      { size: '60x60', idiom: 'iphone', filename: 'icon-180.png', scale: '3x' },
      { size: '20x20', idiom: 'ipad', filename: 'icon-20.png', scale: '1x' },
      { size: '20x20', idiom: 'ipad', filename: 'icon-40.png', scale: '2x' },
      { size: '29x29', idiom: 'ipad', filename: 'icon-29.png', scale: '1x' },
      { size: '29x29', idiom: 'ipad', filename: 'icon-58.png', scale: '2x' },
      { size: '40x40', idiom: 'ipad', filename: 'icon-40.png', scale: '1x' },
      { size: '40x40', idiom: 'ipad', filename: 'icon-80.png', scale: '2x' },
      { size: '76x76', idiom: 'ipad', filename: 'icon-76.png', scale: '1x' },
      { size: '76x76', idiom: 'ipad', filename: 'icon-152.png', scale: '2x' },
      { size: '83.5x83.5', idiom: 'ipad', filename: 'icon-167.png', scale: '2x' },
      { size: '1024x1024', idiom: 'ios-marketing', filename: 'icon-1024.png', scale: '1x' },
    ],
    info: { version: 1, author: 'xcode' },
  }

  fs.writeFileSync(
    path.join(outputDir, 'Contents.json'),
    JSON.stringify(contents, null, 2)
  )
  console.log('Generated Contents.json')
  console.log('All icons generated successfully')
}

generateIcons().catch(console.error)
