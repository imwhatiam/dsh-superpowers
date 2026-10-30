import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

test('a future upstream version does not break the dynamic provenance tests', () => {
  const temp = mkdtempSync(join(ROOT, 'tests', 'upgrade-compat-'));
  try {
    for (const directory of ['skills', 'scripts']) {
      cpSync(join(ROOT, directory), join(temp, directory), { recursive: true });
    }
    mkdirSync(join(temp, 'test'), { recursive: true });
    cpSync(join(ROOT, 'test', 'upstream.test.mjs'), join(temp, 'test', 'upstream.test.mjs'));
    const manifest = JSON.parse(readFileSync(join(ROOT, 'UPSTREAM.json'), 'utf8'));
    manifest.version = '9.9.9';
    manifest.source.tag = 'v9.9.9';
    writeFileSync(join(temp, 'UPSTREAM.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    execFileSync(process.execPath, ['--test', 'test/upstream.test.mjs'], {
      cwd: temp,
      env,
      stdio: 'inherit',
    });
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});