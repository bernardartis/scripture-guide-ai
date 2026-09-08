const { execSync } = require('child_process')
try { require('sharp') } catch { execSync('npm install sharp --save-dev', { stdio: 'inherit' }) }
const sharp = require('sharp')
const fs = require('fs')

const svgContent = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732">
    <rect width="2732" height="2732" fill="#F8F7F4"/>
    <circle cx="1366" cy="1200" r="220" fill="#2E3A59"/>
    <circle cx="1366" cy="1200" r="110" fill="#F8F7F4"/>
    <circle cx="1366" cy="1200" r="38" fill="#D6C7A1"/>
    <path d="M1366 1420 C1366 1420 1156 1560 1156 1720 Q1156 1840 1366 1840 Q1576 1840 1576 1720 C1576 1560 1366 1420 1366 1420Z" fill="#2E3A59"/>
    <text x="1366" y="2000" text-anchor="middle" font-family="Georgia, serif" font-size="120" fill="#1a2238">Emmaus</text>
    <text x="1366" y="2120" text-anchor="middle" font-family="Georgia, serif" font-size="60" fill="#6B7280">Walk with the Word</text>
  </svg>
`

sharp(Buffer.from(svgContent))
  .resize(2732, 2732)
  .png()
  .toFile('ios/App/App/Assets.xcassets/Splash.imageset/splash.png')
  .then(() => console.log('Splash generated'))
  .catch(console.error)
