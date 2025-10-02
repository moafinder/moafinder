#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

function usage(message) {
  if (message) console.error(message)
  console.error('Usage: node scripts/apply-env.mjs <target> [--dry-run]')
  process.exit(message ? 1 : 0)
}

const args = process.argv.slice(2)
if (args.length === 0) {
  usage('Missing <target>.')
}

const target = args[0]
const dryRun = args.includes('--dry-run')

const envsetPath = path.join(repoRoot, 'env', 'targets', `${target}.envset`)
if (!fs.existsSync(envsetPath)) {
  const suggestions = fs
    .readdirSync(path.join(repoRoot, 'env', 'targets'))
    .filter((file) => file.endsWith('.example.envset'))
    .map((file) => file.replace(/\.example\.envset$/, ''))

  const suggestionText = suggestions.length
    ? `Available targets: ${suggestions.join(', ')}`
    : 'No example targets found yet. Create one under env/targets/. '

  usage(`Cannot find ${envsetPath}. ${suggestionText}`)
}

function parseEnvset(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  const sections = new Map()
  let currentSection = 'common'
  sections.set(currentSection, [])

  const lines = text.split(/\r?\n/)
  lines.forEach((rawLine, index) => {
    const trimmed = rawLine.trim()
    if (!trimmed || trimmed.startsWith('#')) return

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const sectionName = trimmed.slice(1, -1).trim()
      if (!sectionName) {
        throw new Error(`Empty section name at line ${index + 1} in ${filePath}`)
      }
      currentSection = sectionName.toLowerCase()
      if (!sections.has(currentSection)) {
        sections.set(currentSection, [])
      }
      return
    }

    const eqIndex = rawLine.indexOf('=')
    if (eqIndex === -1) {
      throw new Error(`Invalid line ${index + 1} in ${filePath}: missing '='`)
    }

    const key = rawLine.slice(0, eqIndex).trim()
    const value = rawLine.slice(eqIndex + 1).trim()

    if (!key) {
      throw new Error(`Invalid line ${index + 1} in ${filePath}: missing key before '='`)
    }

    if (!sections.has(currentSection)) {
      sections.set(currentSection, [])
    }

    sections.get(currentSection).push({ key, value })
  })

  return sections
}

function mergeSections(sections, names) {
  const merged = new Map()
  names.forEach((name) => {
    const entries = sections.get(name) ?? []
    entries.forEach(({ key, value }) => {
      merged.set(key, value)
    })
  })

  return Array.from(merged.entries()).map(([key, value]) => `${key}=${value}`)
}

function ensureTrailingNewline(content) {
  if (!content) return ''
  return content.endsWith('\n') ? content : `${content}\n`
}

function writeFileIfContent(filePath, lines) {
  if (!lines.length) return null
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath)
  const directory = path.dirname(absolute)
  fs.mkdirSync(directory, { recursive: true })
  const content = ensureTrailingNewline(lines.join('\n'))
  if (dryRun) {
    return { file: absolute, preview: content }
  }
  fs.writeFileSync(absolute, content)
  return { file: absolute }
}

const sections = parseEnvset(envsetPath)
const outputs = []

const commonNames = ['common']

const backendLines = mergeSections(sections, [...commonNames, 'backend'])
outputs.push(
  writeFileIfContent('backend/.env', backendLines),
  writeFileIfContent('backend/.env.local', backendLines)
)

const backendTargetPath = `backend/.env.${target}`
if (backendTargetPath !== 'backend/.env.local') {
  outputs.push(writeFileIfContent(backendTargetPath, backendLines))
}

const frontendLines = mergeSections(sections, [...commonNames, 'frontend'])
outputs.push(writeFileIfContent('frontend/.env.local', frontendLines))

const frontendTargetPath = `frontend/.env.${target}`
if (frontendTargetPath !== 'frontend/.env.local') {
  outputs.push(writeFileIfContent(frontendTargetPath, frontendLines))
}

const apprunnerLines = mergeSections(sections, [...commonNames, 'backend', 'apprunner'])
outputs.push(writeFileIfContent(`env/out/${target}-apprunner.env`, apprunnerLines))

const wrote = outputs.filter(Boolean)

if (!wrote.length) {
  console.warn('Nothing to write – envset contained no variables.')
  process.exit(0)
}

console.log(`${dryRun ? 'Would write' : 'Wrote'} ${wrote.length} file${wrote.length === 1 ? '' : 's'}:`)
wrote.forEach(({ file }) => {
  console.log(`  - ${path.relative(repoRoot, file)}`)
})

if (dryRun) {
  console.log('\nRun again without --dry-run to persist the changes.')
}
