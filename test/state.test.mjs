import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPluginState } from '../lib/state.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKILLS = join(ROOT, 'skills');
const BROKEN_SKILLS = join(ROOT, 'test', 'fixtures', 'broken-skills');
const MISSING_ROOT = join(ROOT, 'test', 'fixtures', 'no-adapter-here');

test('the shipped tree yields the full catalog and the bootstrap text', () => {
  const errors = [];
  const state = loadPluginState({ skillsDir: SKILLS, rootDir: ROOT, onError: (part, error) => errors.push([part, error]) });

  assert.deepEqual(errors, []);
  assert.equal(state.catalog.length > 0, true);
  assert.equal(state.catalog.every((skill) => skill.source === 'bundled'), true);
  assert.equal(state.catalog.every((skill) => skill.provider === 'superpowers'), true);
  assert.equal(typeof state.catalog[0].rank, 'number');
  assert.match(state.bootstrap, /<DSH_PLATFORM_ADAPTER>/u);
});

test('a malformed skill tree degrades to an empty catalog instead of throwing', () => {
  const errors = [];
  const state = loadPluginState({
    skillsDir: BROKEN_SKILLS,
    rootDir: ROOT,
    onError: (part, error) => errors.push([part, error]),
  });

  assert.deepEqual(state.catalog, []);
  assert.equal(errors.some(([part]) => part === 'catalog'), true);
  assert.equal(state.bootstrap, undefined, 'a broken skills tree also loses the bootstrap source file');
  assert.equal(errors.some(([part]) => part === 'bootstrap'), true);
});

test('a missing adapter keeps the catalog and drops only the bootstrap', () => {
  const errors = [];
  const state = loadPluginState({
    skillsDir: SKILLS,
    rootDir: MISSING_ROOT,
    onError: (part, error) => errors.push([part, error]),
  });

  assert.equal(state.catalog.length > 0, true, 'the catalog does not depend on the adapter files');
  assert.equal(state.bootstrap, undefined);
  assert.deepEqual(errors.map(([part]) => part), ['bootstrap']);
  assert.equal(errors[0][1].code, 'ENOENT');
});
