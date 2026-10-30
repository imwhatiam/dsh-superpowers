const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/u;

/** Remove the YAML frontmatter from one skill body. */
export function stripFrontmatter(raw) {
  return raw.replace(FRONTMATTER, '').replace(/^\r?\n/, '');
}

/**
 * Build the exact text injected as the per-session bootstrap user message.
 * @param {string} usingSuperpowersRaw contents of using-superpowers/SKILL.md
 * @param {string} toolsMapping contents of references/dsh-tools.md
 */
export function buildBootstrap(usingSuperpowersRaw, toolsMapping) {
  return [
    '<EXTREMELY_IMPORTANT>',
    'You have superpowers.',
    '',
    '**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - you are currently following it. Do NOT use the skill tool to load "using-superpowers" again - that would be redundant.**',
    '',
    stripFrontmatter(usingSuperpowersRaw).trim(),
    '',
    toolsMapping.trim(),
    '</EXTREMELY_IMPORTANT>',
  ].join('\n');
}
