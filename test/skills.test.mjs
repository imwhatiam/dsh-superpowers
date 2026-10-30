import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog, parseSkillFile } from '../lib/skills.js';
import { buildBootstrap } from '../lib/bootstrap.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const catalog = loadCatalog(join(ROOT, 'skills'));

const EXPECTED = [
  'brainstorming',
  'diagnosing-superpowers',
  'dispatching-parallel-agents',
  'executing-plans',
  'finishing-a-development-branch',
  'receiving-code-review',
  'requesting-code-review',
  'subagent-driven-development',
  'systematic-debugging',
  'test-driven-development',
  'using-git-worktrees',
  'using-superpowers',
  'verification-before-completion',
  'writing-plans',
  'writing-skills',
];

test('catalogs exactly the upstream skill names', () => {
  assert.deepEqual(catalog.map((skill) => skill.name), EXPECTED);
});

test('each skill parses and keeps a resource directory', () => {
  for (const skill of catalog) {
    assert.equal(skill.description.length > 0, true);
    assert.equal(skill.resourceBase.kind, 'directory');
    assert.equal(typeof skill.resourceBase.path, 'string');
    assert.equal(typeof skill.locator, 'string');
    const parsed = parseSkillFile(readFileSync(skill.path, 'utf8'), skill.name);
    assert.equal(parsed.body.startsWith('---'), false);
  }
});

test('the DSH tool mapping is installed and referenced by using-superpowers', () => {
  const root = join(ROOT, 'skills', 'using-superpowers');
  const skill = readFileSync(join(root, 'SKILL.md'), 'utf8');
  assert.match(skill, /- DeepSeek Harness: `references\/dsh-tools\.md`/u);
  const mapping = readFileSync(join(root, 'references', 'dsh-tools.md'), 'utf8');
  assert.match(mapping, /`subagent`/u);
  assert.match(mapping, /`todo_write`/u);
  assert.match(mapping, /`bash`/u);
});

test('diagnosing-superpowers writes under the workspace, not the home directory', () => {
  const root = join(ROOT, 'skills', 'diagnosing-superpowers');
  for (const relative of ['SKILL.md', 'templates/case.md', 'templates/report.md']) {
    const text = readFileSync(join(root, relative), 'utf8');
    assert.equal(text.includes('~/.superpowers'), false);
    assert.match(text, /\.superpowers\/diagnosing-superpowers/u);
  }
});

test('bootstrap contains the full skill, the mapping, and no frontmatter', () => {
  const root = join(ROOT, 'skills', 'using-superpowers');
  const bootstrap = buildBootstrap(
    readFileSync(join(root, 'SKILL.md'), 'utf8'),
    readFileSync(join(root, 'references', 'dsh-tools.md'), 'utf8'),
  );
  assert.match(bootstrap, /^<EXTREMELY_IMPORTANT>/u);
  assert.match(bootstrap, /You have superpowers\./u);
  assert.match(bootstrap, /# DeepSeek Harness \(DSH\) Tool Mapping/u);
  assert.match(bootstrap, /<\/EXTREMELY_IMPORTANT>$/u);
  assert.equal(bootstrap.startsWith('---'), false);
  assert.ok(bootstrap.length > 5000);
});
