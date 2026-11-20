#!/usr/bin/env node
// Fails when the built site (dist/) contains a provider credential.
//
// Vite inlines every VITE_* variable into the files it emits, so a credential
// that reaches the build is published to every visitor. This scan is the
// regression gate for that: CI builds with a sentinel value in
// TOGETHER_API_KEY / VITE_TOGETHER_API_KEY and runs this against the output.
//
// Usage: node scripts/scan-dist-for-secrets.mjs <dist-dir>
// Exit:  0 clean, 1 credential found, 2 nothing to scan.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// UNVERIFIED: no Together.ai documentation confirms this prefix, and some
// sources describe their keys as plain hex strings with no fixed prefix. Replace
// it with the first characters of a real key if they differ. The sentinel check
// below is what actually catches a regression.
const PROVIDER_KEY_PREFIX = 'tgp_v1_';

const distDir = process.argv[2];

if (!distDir) {
  console.error('Usage: scan-dist-for-secrets.mjs <dist-dir>');
  process.exit(2);
}

// Needles are labelled so a finding can be reported without printing the secret itself
const needles = [{ label: `provider key prefix ${PROVIDER_KEY_PREFIX}`, value: PROVIDER_KEY_PREFIX }];

for (const variable of ['TOGETHER_API_KEY', 'VITE_TOGETHER_API_KEY']) {
  const value = process.env[variable]?.trim();

  // An empty needle would match every file
  if (value) {
    needles.push({ label: `the value of ${variable}`, value });
  }
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      yield* walk(path);
    } else if (entry.isFile()) {
      yield path;
    }
  }
}

let isDirectory = false;

try {
  isDirectory = statSync(distDir).isDirectory();
} catch {
  // reported below
}

if (!isDirectory) {
  console.error(`Nothing to scan: ${distDir} is not a directory. Run the build first.`);
  process.exit(2);
}

const findings = [];

for (const file of walk(distDir)) {
  const content = readFileSync(file);

  for (const { label, value } of needles) {
    if (content.includes(value)) {
      findings.push(`${relative(distDir, file)} contains ${label}`);
    }
  }
}

if (findings.length > 0) {
  console.error('Provider credential found in the built site:');
  for (const finding of findings) {
    console.error(`  - ${finding}`);
  }
  process.exit(1);
}

console.log(`No provider credential found in ${distDir}.`);
