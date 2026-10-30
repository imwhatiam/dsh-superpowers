import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const COMMIT = '2ce8aa15d05bd57213e6f746f953aafb7ded7a8b';

function check() {
  return execFileSync(process.execPath, ['scripts/sync-upstream.mjs', '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
}

test('a rejected upstream tree leaves the installed skills and manifest unchanged', () => {
  const before = check();
  const source = mkdtempSync(join(ROOT, 'tests', 'sync-fail-'));
  try {
    mkdirSync(join(source, 'skills', 'using-superpowers'), { recursive: true });
    writeFileSync(
      join(source, 'skills', 'using-superpowers', 'SKILL.md'),
      '- DeepSeek Harness: `references/dsh-tools.md`\n',
    );
    assert.throws(() => {
      execFileSync(process.execPath, [
        'scripts/sync-upstream.mjs',
        '--from', source,
        '--version', '7.0.1',
        '--commit', COMMIT,
      ], { cwd: ROOT, stdio: 'pipe' });
    }, (error) => error.status !== 0);
  } finally {
    rmSync(source, { recursive: true, force: true });
  }
  assert.equal(check(), before);
});