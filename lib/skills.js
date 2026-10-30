import { readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_SKILLS_DIR = fileURLToPath(new URL('../skills/', import.meta.url));
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u;

function scalar(value) {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replaceAll('\\"', '"').replaceAll('\\\\', '\\');
  }
  if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replaceAll("''", "'");
  }
  return trimmed;
}

function parseFrontmatter(text) {
  const metadata = {};
  for (const line of text.split(/\r?\n/u)) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    if (/^\s/u.test(line)) continue;
    const separator = line.indexOf(':');
    if (separator <= 0) throw new Error(`invalid frontmatter line: ${line}`);
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1);
    if (value.trim() === '|' || value.trim() === '>') throw new Error(`block scalar is not supported for ${key}`);
    metadata[key] = scalar(value);
  }
  return metadata;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === 'yes' || normalized === 'on' || normalized === '1') return true;
  if (normalized === 'false' || normalized === 'no' || normalized === 'off' || normalized === '0') return false;
  throw new Error(`invalid boolean invocation value: ${String(value)}`);
}

/**
 * Parse one SKILL.md file. The frontmatter is a flat YAML subset; the returned body excludes it.
 * @param {string} raw complete file contents
 * @param {string} expectedName skill directory name
 */
export function parseSkillFile(raw, expectedName) {
  const match = FRONTMATTER.exec(raw);
  if (match === null) throw new Error(`skill "${expectedName}" has no YAML frontmatter`);
  const metadata = parseFrontmatter(match[1]);
  const name = metadata.name;
  if (typeof name !== 'string' || !SKILL_NAME.test(name)) {
    throw new Error(`skill "${expectedName}" has invalid name`);
  }
  if (name !== expectedName) {
    throw new Error(`skill "${expectedName}" declares name "${name}"`);
  }
  const description = metadata.description;
  if (typeof description !== 'string' || description.length === 0) {
    throw new Error(`skill "${expectedName}" has no description`);
  }
  const whenToUse = metadata.whenToUse;
  if (whenToUse !== undefined && typeof whenToUse !== 'string') {
    throw new Error(`skill "${expectedName}" has a non-string whenToUse`);
  }
  return {
    name,
    description,
    ...(whenToUse === undefined ? {} : { whenToUse }),
    invocation: {
      modelInvocable: !parseBoolean(metadata['disable-model-invocation'], false),
      userInvocable: parseBoolean(metadata['user-invocable'], true),
    },
    body: raw.slice(match[0].length),
  };
}

/**
 * Load every direct `<skill>/SKILL.md` under the package's skills directory.
 * @param {string} skillsDir absolute skill root
 */
export function loadCatalog(skillsDir = DEFAULT_SKILLS_DIR) {
  const entries = readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .sort((left, right) => left.name.localeCompare(right.name));
  return entries.map((entry) => {
    const directory = join(skillsDir, entry.name);
    const locator = join(directory, 'SKILL.md');
    const parsed = parseSkillFile(readFileSync(locator, 'utf8'), entry.name);
    return {
      name: parsed.name,
      description: parsed.description,
      ...(parsed.whenToUse === undefined ? {} : { whenToUse: parsed.whenToUse }),
      invocation: parsed.invocation,
      resourceBase: { kind: 'directory', path: directory.split(sep).join('/') },
      locator,
      path: locator,
    };
  });
}

export const SKILLS_DIR = DEFAULT_SKILLS_DIR;
