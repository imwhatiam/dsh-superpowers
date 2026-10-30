import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

test('the vendored tree matches UPSTREAM.json', () => {
  const output = execFileSync(process.execPath, ['scripts/sync-upstream.mjs', '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.match(output, /^ok 7\.0\.1 sha256:[a-f0-9]{64}\n$/u);
});

test('UPSTREAM.json pins the selected upstream release', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'UPSTREAM.json'), 'utf8'));
  assert.equal(manifest.version, '7.0.1');
  assert.match(manifest.treeHash, /^sha256:[a-f0-9]{64}$/u);
  assert.equal(manifest.files['using-superpowers/references/dsh-tools.md']?.startsWith('sha256:'), true);
});
