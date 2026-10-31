import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUNDLED_SKILL_RANK } from '@deepseek-ai/dsh-skill';
import { buildBootstrap } from './bootstrap.js';
import { loadCatalog } from './skills.js';

/**
 * Load the vendored catalog and the bootstrap text, degrading each part on its
 * own so a broken skill file cannot fail the host that loads this plugin.
 * @param {{ skillsDir: string, rootDir: string, onError?: (part: 'catalog' | 'bootstrap', error: Error) => void }} options
 * @returns {{ catalog: object[], bootstrap: string | undefined }} the parts that loaded
 */
export function loadPluginState({ skillsDir, rootDir, onError = () => {} }) {
  const catalog = [];
  let bootstrap;

  try {
    for (const skill of loadCatalog(skillsDir)) {
      catalog.push({ ...skill, source: 'bundled', provider: 'superpowers', rank: BUNDLED_SKILL_RANK });
    }
  } catch (error) {
    onError('catalog', error);
  }

  try {
    bootstrap = buildBootstrap(
      readFileSync(join(skillsDir, 'using-superpowers', 'SKILL.md'), 'utf8'),
      readFileSync(join(rootDir, 'adapter', 'dsh-tools.md'), 'utf8'),
      readFileSync(join(rootDir, 'adapter', 'path-policy.md'), 'utf8'),
    );
  } catch (error) {
    onError('bootstrap', error);
  }

  return { catalog, bootstrap };
}
