import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const mapping = readFileSync(join(ROOT, 'adapter', 'dsh-tools.md'), 'utf8');
const contract = JSON.parse(readFileSync(join(ROOT, 'test', 'fixtures', 'dsh-tools.rc5.json'), 'utf8'));

test('adapter mapping names every rc.5 tool in the reviewed contract', () => {
  for (const tool of Object.keys(contract.tools)) {
    assert.match(mapping, new RegExp(`\`${tool}\``, 'u'), `missing ${tool}`);
  }
});

test('core tool parameter contracts match the reviewed rc.5 contract', () => {
  assert.deepEqual(contract.tools.read.required, ['file_path']);
  assert.deepEqual(contract.tools.write.required, ['file_path', 'content']);
  assert.deepEqual(contract.tools.edit.required, ['file_path', 'old_string', 'new_string']);
  assert.deepEqual(contract.tools.skill.required, ['name']);
  assert.deepEqual(contract.tools.subagent.required, ['prompt']);
});