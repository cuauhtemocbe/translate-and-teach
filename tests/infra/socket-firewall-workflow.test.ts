import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

interface WorkflowStep {
  uses?: string
  run?: string
  if?: string
  with?: Record<string, unknown>
}

interface WorkflowJob {
  if?: string
  'runs-on': string
  permissions?: Record<string, string>
  steps: WorkflowStep[]
}

interface Workflow {
  jobs: Record<string, WorkflowJob>
}

const workflowPath = resolve(
  __dirname,
  '../../.github/workflows/dependabot-socket-firewall.yml',
)
const workflow = parse(readFileSync(workflowPath, 'utf-8')) as Workflow
const job = workflow.jobs['socket-check']

describe('.github/workflows/dependabot-socket-firewall.yml', () => {
  it('only runs for Dependabot-authored PRs', () => {
    expect(job.if).toBe("github.actor == 'dependabot[bot]'")
  })

  it('declares the permissions needed to close a PR', () => {
    expect(job.permissions).toMatchObject({
      'pull-requests': 'write',
      contents: 'read',
    })
  })

  it('pins actions/checkout and SocketDev/action by commit SHA, not a floating tag', () => {
    const usesSteps = job.steps
      .map((step) => step.uses)
      .filter((uses): uses is string => Boolean(uses))

    const checkout = usesSteps.find((uses) => uses.startsWith('actions/checkout@'))
    const socketAction = usesSteps.find((uses) => uses.startsWith('SocketDev/action@'))

    expect(checkout).toBeDefined()
    expect(socketAction).toBeDefined()

    const shaPattern = /@[0-9a-f]{40}\b/
    expect(checkout).toMatch(shaPattern)
    expect(socketAction).toMatch(shaPattern)
  })

  it('installs dependencies through the firewall and closes the PR on failure', () => {
    const installStep = job.steps.find((step) => step.run?.includes('sfw pnpm install'))
    expect(installStep).toBeDefined()

    const closeStep = job.steps.find((step) => step.run?.includes('gh pr close'))
    expect(closeStep).toBeDefined()
    expect(closeStep?.if).toBe("steps.install.outcome == 'failure'")
  })

  // The "clean PR passes" and "flagged PR is closed" end-to-end scenarios require a real
  // Dependabot PR and are verified manually per the issue's Definition of Done, not by this suite.
})
