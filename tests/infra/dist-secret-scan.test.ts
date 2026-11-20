import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const ROOT = resolve(__dirname, '../../')
const SCAN_SCRIPT = join(ROOT, 'scripts/scan-dist-for-secrets.mjs')

// A value no real build would ever contain by accident
const SENTINEL = 'sentinel-6f1c2a9e-do-not-ship'

let dist: string

function scan(env: Record<string, string> = {}, target = dist) {
  return spawnSync('node', [SCAN_SCRIPT, target], {
    encoding: 'utf-8',
    // Only what the test passes: the developer's own TOGETHER_API_KEY must not leak in
    env: { PATH: process.env.PATH ?? '', ...env },
  })
}

beforeEach(() => {
  dist = mkdtempSync(join(tmpdir(), 'dist-scan-'))
  mkdirSync(join(dist, 'assets'))
  writeFileSync(join(dist, 'index.html'), '<html><script src="/assets/app.js"></script></html>')
  writeFileSync(join(dist, 'assets', 'app.js'), 'fetch("/api/translate")')
})

afterEach(() => {
  rmSync(dist, { recursive: true, force: true })
})

describe('Dist scan for provider credentials', () => {
  it('passes for a build that contains no credential', () => {
    const result = scan({ TOGETHER_API_KEY: SENTINEL })

    expect(result.status).toBe(0)
  })

  it.each(['TOGETHER_API_KEY', 'VITE_TOGETHER_API_KEY'])(
    'fails when the value of %s is found in dist',
    (variable) => {
      writeFileSync(join(dist, 'assets', 'app.js'), `const k="${SENTINEL}"`)

      const result = scan({ [variable]: SENTINEL })

      expect(result.status).toBe(1)
      expect(result.stderr).toContain(join('assets', 'app.js'))
      expect(result.stderr).toContain(variable)
    },
  )

  it('never prints the credential value it found', () => {
    writeFileSync(join(dist, 'index.html'), SENTINEL)

    const result = scan({ TOGETHER_API_KEY: SENTINEL })

    expect(result.status).toBe(1)
    expect(result.stdout + result.stderr).not.toContain(SENTINEL)
  })

  it('fails when the provider key prefix is found in dist', () => {
    writeFileSync(join(dist, 'assets', 'app.js'), 'const k="tgp_v1_abcdef"')

    const result = scan()

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('tgp_v1_')
  })

  it('finds a credential in a nested directory', () => {
    mkdirSync(join(dist, 'assets', 'chunks'))
    writeFileSync(join(dist, 'assets', 'chunks', 'late.js'), SENTINEL)

    expect(scan({ TOGETHER_API_KEY: SENTINEL }).status).toBe(1)
  })

  it('ignores an unset or empty variable instead of matching everything', () => {
    expect(scan({ TOGETHER_API_KEY: '' }).status).toBe(0)
    expect(scan().status).toBe(0)
  })

  it('fails loudly when there is nothing to scan', () => {
    const result = scan({}, join(dist, 'does-not-exist'))

    expect(result.status).toBe(2)
    expect(result.stderr).toContain('does-not-exist')
  })
})

describe('No build-time credential in the image or CI', () => {
  const dockerfile = readFileSync(join(ROOT, 'Dockerfile'), 'utf-8')
  const ci = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf-8')

  it('declares no Docker ARG or ENV for the API key', () => {
    expect(dockerfile).not.toMatch(/^\s*(ARG|ENV)\s+\S*TOGETHER_API_KEY/im)
  })

  it('starts the app server instead of a static file server', () => {
    expect(dockerfile).toMatch(/^CMD \["node", "server\/index\.ts"\]$/m)
    expect(dockerfile).not.toMatch(/\bserve\b.*-s\b/)
  })

  it('passes the API key to no image build in any workflow', () => {
    const workflowsDir = join(ROOT, '.github/workflows')
    const offending: string[] = []

    for (const file of readdirSync(workflowsDir).filter((name) => name.endsWith('.yml'))) {
      for (const line of readFileSync(join(workflowsDir, file), 'utf-8').split('\n')) {
        // Only an `env:` sentinel mapping (ci.yml's build and scan steps) or a comment may name it:
        // a --build-arg or build-args entry would put the key in the image build
        const isEnvSentinel = /^\s+(VITE_)?TOGETHER_API_KEY:\s+\S+/.test(line)
        const isComment = line.trim().startsWith('#')

        if (/TOGETHER_API_KEY/.test(line) && !isEnvSentinel && !isComment) {
          offending.push(`${file}: ${line.trim()}`)
        }
      }
    }

    expect(offending).toEqual([])
  })

  it('runs the dist scan in CI after building with sentinel values set', () => {
    const workflow = parse(ci) as {
      jobs: Record<string, { steps: Array<{ run?: string; env?: Record<string, string> }> }>
    }
    const steps = workflow.jobs.build.steps
    const buildIndex = steps.findIndex((step) => step.run === 'pnpm run build')
    const scanIndex = steps.findIndex((step) => step.run === 'pnpm run scan:dist')

    expect(buildIndex).toBeGreaterThan(-1)
    expect(scanIndex).toBeGreaterThan(buildIndex)

    // The sentinel has to be in the build's environment, under the old VITE_ name too,
    // or the scan could not catch a regression that inlines it again
    const buildEnv = steps[buildIndex].env ?? {}
    expect(buildEnv.TOGETHER_API_KEY).toBeTruthy()
    expect(buildEnv.VITE_TOGETHER_API_KEY).toBe(buildEnv.TOGETHER_API_KEY)
    expect(steps[scanIndex].env?.TOGETHER_API_KEY).toBe(buildEnv.TOGETHER_API_KEY)
    expect(steps[scanIndex].env?.VITE_TOGETHER_API_KEY).toBe(buildEnv.TOGETHER_API_KEY)
  })
})
