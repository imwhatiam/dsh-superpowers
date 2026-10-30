#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MANIFEST = join(ROOT, 'UPSTREAM.json');
const DEFAULT_REMOTE = 'https://github.com/obra/superpowers.git';
const GIT_PROXY = process.env.DSH_GIT_PROXY || process.env.HTTPS_PROXY || process.env.ALL_PROXY || '';
const gitArgs = (args) => (GIT_PROXY === '' ? args : ['-c', `http.proxy=${GIT_PROXY}`, ...args]);

const args = process.argv.slice(2);
const options = { check: false, remote: DEFAULT_REMOTE };
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === '--check') options.check = true;
  else if (args[index] === '--remote') options.remote = args[++index];
  else if (args[index] === '--help' || args[index] === '-h') {
    console.log('usage: node scripts/update-upstream.mjs [--check] [--remote <git-url>]');
    process.exit(0);
  } else {
    throw new Error(`unknown argument: ${args[index]}`);
  }
}

function tags(remote) {
  const output = execFileSync('git', gitArgs(['ls-remote', '--tags', '--refs', remote]), {
    encoding: 'utf8',
    timeout: 120000,
  });
  return output
    .split('\n')
    .map((line) => line.split('\t')[1])
    .filter((ref) => typeof ref === 'string' && ref.startsWith('refs/tags/'))
    .map((ref) => ref.slice('refs/tags/'.length))
    .map((tag) => ({ tag, version: tag.replace(/^v/u, '') }))
    .filter(({ version }) => /^\d+\.\d+\.\d+$/u.test(version));
}

function compare(left, right) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

const current = JSON.parse(readFileSync(MANIFEST, 'utf8')).version;
const available = tags(options.remote).sort((left, right) => compare(left.version, right.version));
const latest = available.at(-1);
if (latest === undefined) throw new Error('no semver tags found');
const update = compare(latest.version, current) > 0;
console.log(JSON.stringify({ current, latest: latest.version, updateAvailable: update }, null, 2));

if (options.check) process.exit(update ? 2 : 0);
if (!update) process.exit(0);

const checkout = resolve(ROOT, 'tests', `upstream-${latest.version}-${process.pid}`);
mkdirSync(join(ROOT, 'tests'), { recursive: true });
try {
  execFileSync('git', gitArgs(['clone', '--depth', '1', '--branch', latest.tag, options.remote, checkout]), {
    stdio: 'inherit',
    timeout: 120000,
  });
  execFileSync(process.execPath, ['scripts/sync-upstream.mjs', '--from', checkout, '--version', latest.version], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, ['--test', 'test/skills.test.mjs', 'test/upstream.test.mjs'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  console.log(`updated to ${latest}; restart the profile to load the new skills`);
} finally {
  if (existsSync(checkout)) rmSync(checkout, { recursive: true, force: true });
}
