import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function reducedMotionBlock(css: string): string {
  const match = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*{([\s\S]*?)\n}/);
  expect(match, 'expected a @media (prefers-reduced-motion: reduce) block').not.toBeNull();
  return match?.[1] ?? '';
}

function readComponentCss(file: string): string {
  return readFileSync(resolve(__dirname, '../components', file), 'utf-8');
}

describe('prefers-reduced-motion guards', () => {
  it('ResultCard.css disables hover transitions and transform', () => {
    const block = reducedMotionBlock(readComponentCss('ResultCard.css'));

    expect(block).toMatch(/\.result-card[\s\S]*transition:\s*none/);
    expect(block).toMatch(/\.result-card:hover[\s\S]*transform:\s*none/);
    expect(block).toMatch(/\.result-card-icon/);
  });

  it('Features.css disables the entrance animation and hover motion', () => {
    const block = reducedMotionBlock(readComponentCss('Features.css'));

    expect(block).toMatch(/\.feature-card[\s\S]*animation:\s*none/);
    expect(block).toMatch(/\.feature-card[\s\S]*transition:\s*none/);
    expect(block).toMatch(/\.feature-card:hover[\s\S]*transform:\s*none/);
    expect(block).toMatch(/\.feature-icon-wrapper/);
  });

  it('ThemeToggle.css disables hover/active transform and icon rotation', () => {
    const block = reducedMotionBlock(readComponentCss('ThemeToggle.css'));

    expect(block).toMatch(/\.theme-toggle[\s\S]*transition:\s*none/);
    expect(block).toMatch(/\.theme-toggle:hover[\s\S]*transform:\s*none/);
    expect(block).toMatch(/\.theme-toggle-icon/);
  });

  it('TranslationTimer.css (existing pattern) still disables its pulse animation', () => {
    const block = reducedMotionBlock(readComponentCss('TranslationTimer.css'));

    expect(block).toMatch(/animation:\s*none/);
  });

  it('Hero.css has no animation to guard (verified via git history, not a regression)', () => {
    const css = readComponentCss('Hero.css');

    expect(css).not.toMatch(/animation:|transition:|@keyframes/);
  });
});
