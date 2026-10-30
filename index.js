import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUNDLED_SKILL_RANK } from '@deepseek-ai/dsh-skill';
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import { buildBootstrap } from './lib/bootstrap.js';
import { loadCatalog, parseSkillFile } from './lib/skills.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const SKILLS_DIR = join(ROOT, 'skills');
const BOOTSTRAP_SOURCE = 'superpowers-bootstrap';
const COMPACT_CHECKPOINT_SOURCE = 'compact-checkpoint';
const bootstrappedSessions = new WeakSet();

const catalog = loadCatalog(SKILLS_DIR).map((skill) => ({
  ...skill,
  source: 'bundled',
  provider: 'superpowers',
  rank: BUNDLED_SKILL_RANK,
}));
const bootstrap = buildBootstrap(
  readFileSync(join(SKILLS_DIR, 'using-superpowers', 'SKILL.md'), 'utf8'),
  readFileSync(join(ROOT, 'adapter', 'dsh-tools.md'), 'utf8'),
  readFileSync(join(ROOT, 'adapter', 'path-policy.md'), 'utf8'),
);

function toSummary(skill) {
  const { locator: _locator, rank: _rank, ...summary } = skill;
  return summary;
}

const provider = {
  name: 'superpowers',
  async list() {
    return catalog;
  },
  async get(candidate, options) {
    const raw = await readFile(candidate.locator, { encoding: 'utf8', signal: options.signal });
    const parsed = parseSkillFile(raw, candidate.name);
    return {
      ...toSummary(candidate),
      content: parsed.body,
    };
  },
};

function isRootAgent(ctx, agent) {
  return ctx.agents.roots().some((root) => root.id === agent.id);
}

function hasSkillTool(ctx, agent) {
  return ctx.tools.get('skill', agent) !== undefined;
}

function sessionHasBootstrap(session) {
  return session.deriveMessages().some((message) => message.source?.kind === BOOTSTRAP_SOURCE);
}

function insertionIndex(messages) {
  const lastCheckpoint = messages.findLastIndex((message) => message.source?.kind === COMPACT_CHECKPOINT_SOURCE);
  return lastCheckpoint + 1;
}

function bootstrapMessage() {
  return createUserMessage({
    content: [{ type: 'text', text: bootstrap }],
    source: { kind: BOOTSTRAP_SOURCE, form: 'bootstrap' },
  });
}

export const name = 'superpowers';
export const inject = ['skills', 'agents', 'tools'];

export function apply(ctx) {
  ctx.skills.registerProvider(() => provider);

  ctx.on('agent/pre-step', async (payload, next) => {
    const decision = await next();
    if (decision.kind !== 'enter' || decision.messages.length === 0) return decision;
    const { agent } = payload;
    if (!isRootAgent(ctx, agent) || !hasSkillTool(ctx, agent)) return decision;

    const session = agent.session;
    if (bootstrappedSessions.has(session) || sessionHasBootstrap(session)) {
      bootstrappedSessions.add(session);
      return decision;
    }

    bootstrappedSessions.add(session);
    return {
      ...decision,
      messages: decision.messages.toSpliced(insertionIndex(decision.messages), 0, bootstrapMessage()),
    };
  });

  ctx.on('session/event', (session, event) => {
    if (event.type === 'compaction/end') bootstrappedSessions.delete(session);
  });
}
