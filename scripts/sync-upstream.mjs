#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKILLS_DIR = join(ROOT, 'skills');
const MAPPING_SOURCE = join(ROOT, 'patches', 'using-superpowers', 'references', 'dsh-tools.md');
const MANIFEST = join(ROOT, 'UPSTREAM.json');
const UPSTREAM_URL = 'https://github.com/obra/superpowers';
const GIT_PROXY = process.env.DSH_GIT_PROXY || process.env.HTTPS_PROXY || process.env.ALL_PROXY || '';
const gitArgs = (args) => (GIT_PROXY === '' ? args : ['-c', `http.proxy=${GIT_PROXY}`, ...args]);

const args = process.argv.slice(2);
const options = { check: false, from: null, version: '7.0.1' };
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--check') options.check = true;
  else if (arg === '--from') options.from = args[++index];
  else if (arg === '--version') options.version = args[++index];
  else if (arg === '--help' || arg === '-h') {
    console.log('usage: node scripts/sync-upstream.mjs [--check] [--from <superpowers-checkout>] [--version <tag>]');
    console.log('  --from      local checkout or remote URL');
    console.log('  --version   explicit tag/version');
    process.exit(0);
  } else {
    throw new Error(`unknown argument: ${arg}`);
  }
}
options.version = String(options.version).replace(/^v/u, '');

function sha256(file) {
  return `sha256:${createHash('sha256').update(readFileSync(file)).digest('hex')}`;
}

function listFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function treeHash(skillsDirectory) {
  const files = listFiles(skillsDirectory)
    .map((file) => [relative(skillsDirectory, file).split('\\').join('/'), sha256(file)])
    .sort(([left], [right]) => left.localeCompare(right));
  const digest = createHash('sha256');
  for (const [path, hash] of files) digest.update(`${path}\0${hash}\n`);
  return {
    treeHash: `sha256:${digest.digest('hex')}`,
    files: Object.fromEntries(files),
  };
}

function read(file) {
  return readFileSync(file, 'utf8');
}

function write(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function replaceAll(file, from, to) {
  const before = read(file);
  const after = before.split(from).join(to);
  if (!before.includes(from)) throw new Error(`path patch target not found in ${file}`);
  write(file, after);
}

function addDshPlatformPointer(file) {
  const before = read(file);
  const marker = '- Muse: `references/muse-tools.md`';
  const pointer = '- DeepSeek Harness: `references/dsh-tools.md`';
  if (before.includes(pointer)) return;
  if (!before.includes(marker)) throw new Error(`platform pointer target not found in ${file}`);
  write(file, before.replace(marker, `${marker}\n${pointer}`));
}

function applyDshPatches() {
  addDshPlatformPointer(join(SKILLS_DIR, 'using-superpowers', 'SKILL.md'));
  for (const file of [
    join(SKILLS_DIR, 'diagnosing-superpowers', 'SKILL.md'),
    join(SKILLS_DIR, 'diagnosing-superpowers', 'templates', 'case.md'),
    join(SKILLS_DIR, 'diagnosing-superpowers', 'templates', 'report.md'),
  ]) {
    replaceAll(file, '~/.superpowers', '.superpowers');
  }
  cpSync(MAPPING_SOURCE, join(SKILLS_DIR, 'using-superpowers', 'references', 'dsh-tools.md'));
}

function assertPatched() {
  const using = read(join(SKILLS_DIR, 'using-superpowers', 'SKILL.md'));
  if (!using.includes('- DeepSeek Harness: `references/dsh-tools.md`')) throw new Error('DSH platform pointer is missing');
  for (const file of [
    join(SKILLS_DIR, 'diagnosing-superpowers', 'SKILL.md'),
    join(SKILLS_DIR, 'diagnosing-superpowers', 'templates', 'case.md'),
    join(SKILLS_DIR, 'diagnosing-superpowers', 'templates', 'report.md'),
  ]) {
    if (read(file).includes('~/.superpowers')) throw new Error(`home path remains in ${file}`);
  }
  if (!existsSync(join(SKILLS_DIR, 'using-superpowers', 'references', 'dsh-tools.md'))) {
    throw new Error('dsh-tools.md is missing');
  }
}

if (options.check) {
  assertPatched();
  if (!existsSync(MANIFEST)) throw new Error('UPSTREAM.json does not exist');
  const expected = JSON.parse(read(MANIFEST));
  const actual = treeHash(SKILLS_DIR);
  if (expected.treeHash !== actual.treeHash) {
    throw new Error(`skills tree does not match UPSTREAM.json (expected ${expected.treeHash}, got ${actual.treeHash})`);
  }
  console.log(`ok ${expected.version} ${expected.treeHash}`);
  process.exit(0);
}

let tempDir = null;
if (!options.from) {
  console.log('Fetching latest tag from upstream...');
  try {
    const tags = execFileSync('git', gitArgs(['ls-remote', '--tags', UPSTREAM_URL]), { encoding: 'utf8' });
    const matches = [...tags.matchAll(/^([a-f0-9]+)\s+refs\/tags\/v(\d+\.\d+\.\d+)/gm)];
    if (matches.length === 0) throw new Error('No tags found');
    // Sort by version number (simple string comparison for semver)
    const sorted = matches.sort((a, b) => a[2].localeCompare(b[2])).pop();
    options.version = sorted[2];
    const commit = sorted[1];
    console.log(`Found latest tag: v${options.version} (${commit.substring(0, 7)})`);

    // Create temp directory for clone
    tempDir = join(ROOT, 'tests', `sync-temp-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    execFileSync('git', gitArgs(['clone', '--depth', '1', '--branch', `v${options.version}`, UPSTREAM_URL, tempDir]), { stdio: 'inherit' });
    options.from = resolve(tempDir);
  } catch (e) {
    if (tempDir !== null) rmSync(tempDir, { recursive: true, force: true });
    throw new Error(`Failed to fetch from git: ${e.message}`);
  }
}
const source = resolve(options.from);
const sourceSkills = join(source, 'skills');
if (!existsSync(sourceSkills) || !statSync(sourceSkills).isDirectory()) {
  if (tempDir !== null) rmSync(tempDir, { recursive: true, force: true });
  throw new Error(`no skills directory under ${source}`);
}

try {
  rmSync(SKILLS_DIR, { recursive: true, force: true });
  cpSync(sourceSkills, SKILLS_DIR, { recursive: true });
  applyDshPatches();
  assertPatched();
  if (existsSync(join(source, 'LICENSE'))) cpSync(join(source, 'LICENSE'), join(ROOT, 'LICENSE'));

  const { treeHash: digest, files } = treeHash(SKILLS_DIR);
  writeFileSync(MANIFEST, `${JSON.stringify({
    upstream: UPSTREAM_URL,
    version: options.version,
    source: {
      type: "git",
      url: UPSTREAM_URL,
      tag: `v${options.version}`
    },
    syncedAt: new Date().toISOString(),
    treeHash: digest,
    files,
  }, null, 2)}\n`);
  console.log(`synced ${options.version} ${digest}`);
} finally {
  if (tempDir !== null) rmSync(tempDir, { recursive: true, force: true });
}
