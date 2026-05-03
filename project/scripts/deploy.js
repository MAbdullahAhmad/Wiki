#!/usr/bin/env node

/**
 * Deploys the built project to the 'pages' branch for GitHub Pages.
 * 
 * Steps:
 * 1. Builds the project (generate index + vite build)
 * 2. Copies build output to a temp directory
 * 3. Switches to 'pages' branch (creates if needed)
 * 4. Replaces branch contents with build output
 * 5. Commits and pushes
 * 6. Switches back to main branch
 */

import { execSync } from 'child_process';
import { cpSync, rmSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '../..');
const PROJECT = resolve(ROOT, 'project');
const DIST = resolve(PROJECT, 'dist');
const TEMP = resolve(ROOT, '.deploy-temp');

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: opts.cwd || ROOT, ...opts });
}

async function main() {
  console.log('=== Wiki Deploy Script ===\n');

  // Step 1: Build
  console.log('Step 1: Building project...');
  run('npm run build', { cwd: PROJECT });

  if (!existsSync(DIST)) {
    throw new Error('Build output not found at ' + DIST);
  }

  // Step 2: Copy build output to temp
  console.log('\nStep 2: Copying build output...');
  if (existsSync(TEMP)) rmSync(TEMP, { recursive: true });
  mkdirSync(TEMP, { recursive: true });
  cpSync(DIST, TEMP, { recursive: true });

  // Add .nojekyll to prevent Jekyll processing
  writeFileSync(resolve(TEMP, '.nojekyll'), '');

  // Add CNAME if needed (uncomment and set your domain)
  // writeFileSync(resolve(TEMP, 'CNAME'), 'your-domain.com');

  // Step 3: Switch to pages branch
  console.log('\nStep 3: Setting up pages branch...');
  try {
    run('git stash --include-untracked');
  } catch {
    // No changes to stash
  }

  try {
    run('git checkout pages');
  } catch {
    run('git checkout --orphan pages');
    run('git rm -rf .', { cwd: ROOT });
  }

  // Step 4: Replace contents
  console.log('\nStep 4: Replacing branch contents...');
  // Remove everything except .git and .deploy-temp
  const { readdirSync } = await import('fs');
  for (const item of readdirSync(ROOT)) {
    if (item === '.git' || item === '.deploy-temp' || item === 'node_modules') continue;
    rmSync(resolve(ROOT, item), { recursive: true, force: true });
  }

  // Copy from temp
  cpSync(TEMP, ROOT, { recursive: true });

  // Clean up temp
  rmSync(TEMP, { recursive: true });

  // Step 5: Commit and push
  console.log('\nStep 5: Committing...');
  run('git add -A');
  try {
    run(`git commit -m "Deploy wiki to GitHub Pages - ${new Date().toISOString()}"`);
    console.log('\nDeploy commit created. Run "git push origin pages" to publish.');
  } catch {
    console.log('No changes to commit.');
  }

  // Step 6: Switch back
  console.log('\nStep 6: Switching back to main...');
  run('git checkout main');
  try {
    run('git stash pop');
  } catch {
    // No stash to pop
  }

  console.log('\n=== Deploy complete! ===');
  console.log('Push with: git push origin pages');
}

main().catch((err) => {
  console.error('\nDeploy failed:', err.message);
  // Try to recover
  try {
    execSync('git checkout main', { cwd: ROOT, stdio: 'inherit' });
    try { execSync('git stash pop', { cwd: ROOT, stdio: 'pipe' }); } catch {}
  } catch {}
  if (existsSync(TEMP)) rmSync(TEMP, { recursive: true });
  process.exit(1);
});
