import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

interface DependabotUpdate {
  'package-ecosystem': string
  directory: string
  schedule: { interval: string }
}

interface DependabotConfig {
  version: number
  updates: DependabotUpdate[]
}

const configPath = resolve(__dirname, '../../.github/dependabot.yml')
const config = parse(readFileSync(configPath, 'utf-8')) as DependabotConfig

function findUpdate(ecosystem: string): DependabotUpdate | undefined {
  return config.updates.find((u) => u['package-ecosystem'] === ecosystem)
}

describe('.github/dependabot.yml', () => {
  it('declares an npm ecosystem update with weekly interval', () => {
    const update = findUpdate('npm')
    expect(update).toBeDefined()
    expect(update?.directory).toBe('/')
    expect(update?.schedule.interval).toBe('weekly')
  })

  it('declares a docker ecosystem update with weekly interval', () => {
    const update = findUpdate('docker')
    expect(update).toBeDefined()
    expect(update?.schedule.interval).toBe('weekly')
  })

  it('declares a github-actions ecosystem update with weekly interval', () => {
    const update = findUpdate('github-actions')
    expect(update).toBeDefined()
    expect(update?.schedule.interval).toBe('weekly')
  })

  it('is valid per Dependabot schema fields (version 2, updates array)', () => {
    expect(config.version).toBe(2)
    expect(Array.isArray(config.updates)).toBe(true)
    expect(config.updates.length).toBeGreaterThanOrEqual(3)
  })
})
