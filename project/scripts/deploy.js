#!/usr/bin/env node

/**
 * Deploys the built project to the 'gh-pages' branch for GitHub Pages.
 *
 * Uses a temp directory approach — never switches branches or deletes
 * files in the working tree, so the user's shell CWD stays valid.
 *
 * Steps:
 * 1. Builds the project (generate index + tsc + vite build)
 * 2. Copies build output to a temp directory outside the repo
 * 3. Inits a fresh git repo there, commits, force-pushes to gh-pages branch
 * 4. Cleans up the temp directory
 */

import { execSync } from 'child_process';
import { cpSync, rmSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';

const ROOT = resolve(import.meta.dirname, '../..');
const PROJECT = resolve(ROOT, 'project');
const DIST = resolve(PROJECT, 'dist');
const WIKI = resolve(ROOT, 'wiki');
const ASSETS = resolve(ROOT, 'assets');

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', cwd: opts.cwd || ROOT, ...opts });
}

function runCapture(cmd, opts = {}) {
  return execSync(cmd, { cwd: opts.cwd || ROOT, ...opts }).toString().trim();
}

async function main() {
  console.log('=== Wiki Deploy Script ===\n');

  // Step 1: Build
  console.log('Step 1: Building project...');
  run('npm run build', { cwd: PROJECT });

  if (!existsSync(DIST)) {
    throw new Error('Build output not found at ' + DIST);
  }

  // Step 2: Prepare temp deploy directory
  console.log('\nStep 2: Preparing deploy...');
  const tempDir = join(tmpdir(), `wiki-deploy-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });

  try {
    // Copy build output
    cpSync(DIST, tempDir, { recursive: true });
    writeFileSync(join(tempDir, '.nojekyll'), '');

    // Bundle content (wiki/ + assets/) so the deployed site is self-
    // contained and never depends on main being merged.
    if (existsSync(WIKI)) cpSync(WIKI, join(tempDir, 'wiki'), { recursive: true });
    if (existsSync(ASSETS)) cpSync(ASSETS, join(tempDir, 'assets'), { recursive: true });

    // Get the remote URL
    const remote = runCapture('git remote get-url origin');
    console.log(`  Remote: ${remote}`);

    // Step 3: Init a fresh repo, commit, force-push to gh-pages
    console.log('\nStep 3: Deploying to gh-pages branch...');
    run('git init', { cwd: tempDir });
    run('git checkout -b gh-pages', { cwd: tempDir });
    run('git add -A', { cwd: tempDir });
    run(`git commit -m "Deploy wiki — ${new Date().toISOString()}"`, { cwd: tempDir });
    run(`git remote add origin ${remote}`, { cwd: tempDir });
    run('git push --force origin gh-pages', { cwd: tempDir });

    console.log('\n=== Deploy complete! ===');
    console.log('Site: https://mabdullahahmad.github.io/Wiki/');
  } finally {
    // Step 4: Clean up
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error('\nDeploy failed:', err.message);
  process.exit(1);
});
