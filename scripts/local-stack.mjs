#!/usr/bin/env node
import { spawn, spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const backendDir = path.join(repoRoot, 'backend')
const frontendDir = path.join(repoRoot, 'frontend')
const targetsDir = path.join(repoRoot, 'env', 'targets')
const outDir = path.join(repoRoot, 'env', 'out')
const pidFile = path.join(outDir, 'local-stack.pids.json')

function usage(message) {
  if (message) {
    console.error(message)
  }
  console.error('Usage: node scripts/local-stack.mjs <up|down> [target] [--skip-install] [--keep-mongo] [--target=name]')
  process.exit(message ? 1 : 0)
}

function parseOptions(args) {
  const options = {
    target: 'local',
    skipInstall: false,
    keepMongo: false,
  }

  let positionalTargetConsumed = false

  for (const arg of args) {
    if (arg === '--skip-install') {
      options.skipInstall = true
      continue
    }
    if (arg === '--keep-mongo') {
      options.keepMongo = true
      continue
    }
    if (arg.startsWith('--target=')) {
      options.target = arg.slice('--target='.length) || options.target
      continue
    }
    if (!positionalTargetConsumed && !arg.startsWith('--')) {
      options.target = arg
      positionalTargetConsumed = true
      continue
    }

    usage(`Unknown option: ${arg}`)
  }

  return options
}

function runSync(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with code ${result.status}`)
  }
}

function ensureEnvsetExists(target) {
  const envsetPath = path.join(targetsDir, `${target}.envset`)
  if (!fs.existsSync(envsetPath)) {
    const examples = fs
      .readdirSync(targetsDir)
      .filter((name) => name.endsWith('.example.envset'))
      .map((name) => name.replace(/\.example\.envset$/, ''))
    const hint = examples.length ? `Available targets: ${examples.join(', ')}` : 'No example targets found under env/targets.'
    throw new Error(`Missing ${path.relative(repoRoot, envsetPath)}. ${hint}`)
  }
}

async function terminateChild(child, name) {
  if (!child || child.killed || child.exitCode !== null) {
    return
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (child.exitCode === null) {
        child.kill('SIGKILL')
      }
    }, 5000)

    child.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })

    try {
      child.kill('SIGINT')
    } catch {
      clearTimeout(timer)
      resolve()
    }
  })
}

function writePidFile(data) {
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(pidFile, JSON.stringify(data, null, 2))
}

function removePidFile() {
  if (fs.existsSync(pidFile)) {
    fs.unlinkSync(pidFile)
  }
}

async function runUp(options) {
  ensureEnvsetExists(options.target)

  runSync(process.execPath, [path.join('scripts', 'apply-env.mjs'), options.target], repoRoot)

  if (!options.skipInstall) {
    runSync('pnpm', ['install'], backendDir)
    runSync('pnpm', ['install'], frontendDir)
  }

  runSync('docker', ['compose', 'up', '-d', 'mongo'], backendDir)

  const backendProc = spawn('pnpm', ['dev'], {
    cwd: backendDir,
    stdio: 'inherit',
    env: process.env,
  })

  const frontendProc = spawn('pnpm', ['dev', '--', '--host', 'localhost'], {
    cwd: frontendDir,
    stdio: 'inherit',
    env: process.env,
  })

  writePidFile({ backend: backendProc.pid, frontend: frontendProc.pid })

  console.log('\nLocal stack is running:')
  console.log('  Backend:  http://localhost:3000')
  console.log('  Frontend: http://localhost:5173')
  console.log('Press Ctrl+C to stop. This script will shut everything down for you.')

  let exitResolver
  const exitPromise = new Promise((resolve) => {
    exitResolver = resolve
  })

  const onBackendExit = (code, signal) => exitResolver({ type: 'backend-exit', code, signal })
  const onFrontendExit = (code, signal) => exitResolver({ type: 'frontend-exit', code, signal })
  const onSigInt = () => exitResolver({ type: 'signal', signal: 'SIGINT' })
  const onSigTerm = () => exitResolver({ type: 'signal', signal: 'SIGTERM' })

  backendProc.once('exit', onBackendExit)
  frontendProc.once('exit', onFrontendExit)
  process.once('SIGINT', onSigInt)
  process.once('SIGTERM', onSigTerm)

  const exitReason = await exitPromise

  process.removeListener('SIGINT', onSigInt)
  process.removeListener('SIGTERM', onSigTerm)
  backendProc.removeListener('exit', onBackendExit)
  frontendProc.removeListener('exit', onFrontendExit)

  console.log(`\nStopping local stack (${exitReason.type}).`)

  await terminateChild(frontendProc, 'frontend')
  await terminateChild(backendProc, 'backend')

  try {
    if (options.keepMongo) {
      runSync('docker', ['compose', 'stop', 'mongo'], backendDir)
    } else {
      runSync('docker', ['compose', 'down'], backendDir)
    }
  } catch (error) {
    console.warn(`Failed to stop Docker services: ${error.message}`)
  }

  removePidFile()
}

function killPid(pid, name) {
  if (typeof pid !== 'number' || Number.isNaN(pid)) {
    return
  }

  try {
    process.kill(pid, 'SIGTERM')
    setTimeout(() => {
      try {
        process.kill(pid, 0)
        process.kill(pid, 'SIGKILL')
      } catch {
        /* process already gone */
      }
    }, 3000)
    console.log(`Sent SIGTERM to ${name} (pid ${pid}).`)
  } catch {
    /* process not running */
  }
}

async function runDown(options) {
  if (fs.existsSync(pidFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(pidFile, 'utf8'))
      killPid(data.frontend, 'frontend dev server')
      killPid(data.backend, 'backend dev server')
    } catch (error) {
      console.warn(`Could not read ${path.relative(repoRoot, pidFile)}: ${error.message}`)
    }
    removePidFile()
  } else {
    console.log('No pid file found – assuming dev servers are not managed by this script.')
  }

  try {
    if (options.keepMongo) {
      runSync('docker', ['compose', 'stop', 'mongo'], backendDir)
    } else {
      runSync('docker', ['compose', 'down'], backendDir)
    }
  } catch (error) {
    console.warn(`Failed to stop Docker services: ${error.message}`)
  }

  console.log('Local stack stopped.')
}

async function main() {
  if (process.argv.length < 3) {
    usage()
  }

  const command = process.argv[2]
  const options = parseOptions(process.argv.slice(3))

  switch (command) {
    case 'up':
      await runUp(options)
      break
    case 'down':
      await runDown(options)
      break
    default:
      usage(`Unknown command: ${command}`)
  }
}

main().catch((error) => {
  console.error(`Local stack failed: ${error.message}`)
  process.exit(1)
})
