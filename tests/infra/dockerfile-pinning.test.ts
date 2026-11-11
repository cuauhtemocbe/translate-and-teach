import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function fromLines(dockerfile: string): string[] {
  return dockerfile
    .split('\n')
    .filter((line) => line.trim().toUpperCase().startsWith('FROM '))
}

function readDockerfile(name: string): string {
  return readFileSync(resolve(__dirname, '../../', name), 'utf-8')
}

// "FROM node:<tag>@sha256:<digest> AS builder" -> "node:<tag>@sha256:<digest>"
function nodeImage(fromLine: string): string {
  return fromLine.trim().split(/\s+/)[1]
}

describe('Reproducible image builds', () => {
  it('pins the builder and production stage FROM lines by digest', () => {
    const lines = fromLines(readDockerfile('Dockerfile'))

    expect(lines).toHaveLength(2)
    for (const line of lines) {
      expect(line).toMatch(/@sha256:[0-9a-f]{64}/)
    }
  })

  it('pins Dockerfile.dev by digest too', () => {
    const lines = fromLines(readDockerfile('Dockerfile.dev'))

    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) {
      expect(line).toMatch(/@sha256:[0-9a-f]{64}/)
    }
  })

  it('uses one identical node image string in every FROM line of both Dockerfiles', () => {
    const lines = [
      ...fromLines(readDockerfile('Dockerfile')),
      ...fromLines(readDockerfile('Dockerfile.dev')),
    ]
    const images = new Set(lines.map(nodeImage))

    expect(lines).toHaveLength(3)
    expect(images.size).toBe(1)
    expect([...images][0]).toMatch(
      /^node:\d+\.\d+\.\d+-alpine\d+\.\d+@sha256:[0-9a-f]{64}$/,
    )
  })

  // "Dependabot keeps the pinned digest current" is verified structurally by the dependabot.yml
  // docker-ecosystem test (tests/infra/dependabot.test.ts) — Dependabot itself opening the update
  // PR is an external, unautomatable behavior.
})
