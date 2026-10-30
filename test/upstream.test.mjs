import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

test('the vendored raw tree matches UPSTREAM.json', () => {
  const output = execFileSync(process.execPath, ['scripts/sync-upstream.mjs', '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.match(output, /^ok 7\.0\.1 sha256:[a-f0-9]{64}\n$/u);
});

test('UPSTREAM.json pins the raw upstream release and contains no adapter file', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'UPSTREAM.json'), 'utf8'));
  assert.equal(manifest.version, '7.0.1');
  assert.match(manifest.treeHash, /^sha256:[a-f0-9]{64}$/u);
  assert.match(manifest.source.commit, /^[a-f0-9]{40}$/u);
  assert.equal(Object.hasOwn(manifest.files, 'using-superpowers/references/dsh-tools.md'), false);
  assert.equal(Object.keys(manifest.files).length, 84);
});
