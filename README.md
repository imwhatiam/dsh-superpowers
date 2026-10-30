# dsh-superpowers

Superpowers 7.0.1 for DeepSeek Harness. This package vendors the upstream `skills/` tree and adds one DSH adapter:

- Registers all 15 skills through `ctx.skills.registerProvider`;
- Injects the `using-superpowers` bootstrap once per top-level session through `agent/pre-step`;
- Skips delegated child sessions;
- Re-injects after compaction;
- Maps Superpowers actions to DSH tools in `skills/using-superpowers/references/dsh-tools.md`.

## Versioning

The plugin version mirrors the DeepSeek Harness release line it has been validated against. `v0.2.1` is validated on DSH `0.2.1-rc.5`. When a future DSH release is validated, bump the plugin version to that DSH base version.

## Install

> **Name note**: `dsh-superpowers` is already taken on npm. After choosing an available name (for example `dsh-superpowers-sync`), replace `<your-package-name>` below. The local development install is unaffected.

### From npm (recommended)

```bash
dsh plugin --profile web add <your-package-name>
```

### From GitHub release

```bash
dsh plugin --profile web add github:imwhatiam/dsh-superpowers#v0.2.1
```

### From local development directory (testing only)

```bash
dsh plugin --profile superpowers-test add /path/to/dsh-superpowers
```

Do not edit a profile's `package.json` or `cordis.patch.yml` by hand—use the `dsh plugin` CLI.

## Upstream updates

This package pins Superpowers v7.0.1 with deterministic hash verification. To check for updates:

```bash
npm run update:check   # compare UPSTREAM.json with latest semver tag from obra/superpowers
npm run update         # clones tag, runs sync-upstream.mjs, re-runs tests
npm test               # ensures compatibility
```

These update scripts are maintainer tools from the source checkout; they are not included in the published npm tarball.

If GitHub is only reachable through the local SOCKS tunnel, prefix the commands with `DSH_GIT_PROXY=socks5h://127.0.0.1:1080`.

After a successful update:

1. Bump `version` in `package.json`
2. Add entry to `CHANGELOG.md`
3. Tag and release: `git tag v0.2.2 && git push origin v0.2.2`
4. Update npm: `npm publish --access public`
5. Restart the DSH profile to reload the linked package

For automated weekly checks in CI/CD:

```yaml
# .github/workflows/update-check.yml
on:
  schedule:
    - cron: '0 9 * * 1'  # Mon-Fri at 9am UTC
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm test && npm run update:check || true
```

## Files structure

- `skills/` — All 15 Superpowers skills (byte-for-byte identical except patches)
- `lib/` — Pure DSH injection logic (`inject.js`, `skills.js`)
- `scripts/sync-upstream.mjs` — Local vendor script (not published)
- `scripts/update-upstream.mjs` — Automated update checker (not published)
- `tests/` — Static unit tests (not published)
- `UPSTREAM.json` — Hash-verified manifest of vendored content
- `cordis.patch.yml` — Bundle manifest (published)
- `LICENSE` — MIT license
- `THIRD_PARTY_NOTICES.md` — Attribution to Superpowers (obra)

## Quality gates

Current status (as of v0.2.1):

- ✅ **Test suite**: 7/7 tests passing
- ⚠️ **Crapper**: Known red (complexity issues in `parseBoolean`, `apply`)
- ⚠️ **Dryer**: Unsupported for JavaScript-only packages (Docker alternative available)
- ⚠️ **Mutator**: Needs more comprehensive test coverage for mutation testing

Recommendation: Publish as **preview** (`0.1.x`) until quality gates are green. Fix root causes incrementally:

1. Refactor `parseBoolean` into `lib/skills.js` (reduce complexity)
2. Add unit tests for `index.js` functions
3. Use mutation testing on pure functions

## DSH specifics

- **Bootstrap source**: User-role message, injected once per session, survives replay
- **Workspace path**: `.superpowers/` is workspace-local (add to `.gitignore`)
- **Graphviz**: Optional for `writing-skills` rendering (`dot` binary required)
- **Session storage**: Uses `$DSH_HOME/sessions/<workspace>/<id>/session.v4.jsonl.zstd`
- **Subagents**: Bootstrap skipped in delegated children (confirmed via session logs)

## Contributing

1. Fork this repo
2. Create a feature branch: `git checkout -b feature/amazing-improvement`
3. Make changes (follow coding-discipline: surface assumptions, minimal edits, failing tests first)
4. Run tests: `npm test`
5. Submit PR
6. Wait for review (including quality gate feedback)

For contribution questions, open an issue in the repository.

## License

MIT License — see [LICENSE](./LICENSE) and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## Credits

- Original Superpowers by Jesse Vincent (obra) — https://github.com/obra/superpowers
- Adapted for DeepSeek Harness by imwhatiam
- Community contributors and maintainers

---

**Disclaimer**: This plugin is not officially endorsed by DeepSeek. Install at your own risk and always verify third-party code before use.
