import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function fromLines(dockerfile: string): string[] {
  return dockerfile
    .split('\n')
    .filter((line) => line.trim().toUpperCase().startsWith('FROM '))
}

describe('Reproducible production image builds', () => {
  it('pins the builder and production stage FROM lines by digest', () => {
    const dockerfile = readFileSync(resolve(__dirname, '../../Dockerfile'), 'utf-8')
    const lines = fromLines(dockerfile)

    expect(lines).toHaveLength(2)
    for (const line of lines) {
      expect(line).toMatch(/@sha256:[0-9a-f]{64}/)
    }
  })

  it('leaves Dockerfile.dev on a floating tag', () => {
    const dockerfileDev = readFileSync(resolve(__dirname, '../../Dockerfile.dev'), 'utf-8')
    const lines = fromLines(dockerfileDev)

    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) {
      expect(line).not.toMatch(/@sha256:/)
    }
  })

  // "Dependabot keeps the pinned digest current" is verified structurally by the dependabot.yml
  // docker-ecosystem test (tests/infra/dependabot.test.ts) — Dependabot itself opening the update
  // PR is an external, unautomatable behavior.
})
