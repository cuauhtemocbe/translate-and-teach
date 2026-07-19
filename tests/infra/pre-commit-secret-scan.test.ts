import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const hookPath = resolve(__dirname, '../../.husky/pre-commit')

// A realistic secret shape (GitHub PAT pattern) that gitleaks' default ruleset
// flags — not a real credential. (AWS-style "EXAMPLE" keys are allowlisted by
// gitleaks' default config as a common false-positive suppression, so they
// don't work for this test.) Built by concatenation so this source file never
// contains the contiguous token literal — GitHub's own push protection uses
// the same detection pattern and would otherwise flag this fixture as a real
// leaked credential.
const SECRET_SHAPED_STRING = ['ghp_wWPw5k4aXcaT4fNP0UcnZwJUVFk6', 'LO0pINUx'].join('')

let repoDir: string

function git(args: string[], cwd = repoDir) {
  execFileSync('git', args, { cwd, stdio: 'pipe' })
}

function runPreCommitHook(): { status: number; output: string } {
  try {
    const output = execFileSync(hookPath, { cwd: repoDir, stdio: 'pipe' }).toString()
    return { status: 0, output }
  } catch (error) {
    const err = error as { status: number; stdout: Buffer; stderr: Buffer }
    return { status: err.status, output: err.stdout.toString() + err.stderr.toString() }
  }
}

beforeEach(() => {
  repoDir = mkdtempSync(join(tmpdir(), 'gitleaks-precommit-test-'))
  git(['init', '-q'])
  git(['config', 'user.email', 'test@example.com'])
  git(['config', 'user.name', 'Test'])
})

afterEach(() => {
  rmSync(repoDir, { recursive: true, force: true })
})

describe('Pre-commit secret scanning', () => {
  it('aborts the commit when a staged file contains a secret-shaped string', () => {
    writeFileSync(join(repoDir, 'config.js'), `const key = "${SECRET_SHAPED_STRING}"\n`)
    git(['add', 'config.js'])

    const result = runPreCommitHook()

    expect(result.status).not.toBe(0)
    expect(result.output).toMatch(/secret/i)
  })

  it('proceeds when no secrets are staged', () => {
    writeFileSync(join(repoDir, 'readme.md'), '# Hello world\n')
    git(['add', 'readme.md'])

    const result = runPreCommitHook()

    expect(result.status).toBe(0)
  })

  it('only scans the staged diff, not full history', () => {
    // Commit a secret in an old, unrelated commit.
    writeFileSync(join(repoDir, 'old-secret.js'), `const key = "${SECRET_SHAPED_STRING}"\n`)
    git(['add', 'old-secret.js'])
    git(['commit', '-q', '--no-verify', '-m', 'old commit with a secret'])

    // Stage a new, clean change.
    writeFileSync(join(repoDir, 'feature.js'), 'export const add = (a, b) => a + b\n')
    git(['add', 'feature.js'])

    const result = runPreCommitHook()

    expect(result.status).toBe(0)
  })
})
