import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadEnv } from 'vite'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import config from '../../vite.config'

// Vite inlines into the browser bundle every variable whose name starts with an
// envPrefix entry. The footer needs the model name; the credential must never
// match, whatever else changes in the prefix list.
const SENTINEL = 'sentinel-0d4e8c-do-not-ship'

let emptyEnvDir: string

function exposedToBrowser(): Record<string, string> {
  return loadEnv('production', emptyEnvDir, config.envPrefix)
}

beforeEach(() => {
  emptyEnvDir = mkdtempSync(join(tmpdir(), 'vite-env-'))
  vi.stubEnv('TOGETHER_MODEL', 'Qwen/Qwen3.8-Flash')
  vi.stubEnv('TOGETHER_API_KEY', SENTINEL)
})

afterEach(() => {
  vi.unstubAllEnvs()
  rmSync(emptyEnvDir, { recursive: true, force: true })
})

describe('Variables Vite exposes to the browser', () => {
  it('includes TOGETHER_MODEL, which the footer shows', () => {
    expect(exposedToBrowser().TOGETHER_MODEL).toBe('Qwen/Qwen3.8-Flash')
  })

  it('never includes the credential', () => {
    const exposed = exposedToBrowser()

    expect(exposed).not.toHaveProperty('TOGETHER_API_KEY')
    expect(Object.values(exposed)).not.toContain(SENTINEL)
  })

  it('does not widen the prefix to the whole TOGETHER_ namespace', () => {
    const prefixes = [config.envPrefix ?? []].flat()

    expect(prefixes).not.toContain('TOGETHER_')
    expect(prefixes).not.toContain('TOGETHER')
    expect(prefixes).not.toContain('')
  })
})
