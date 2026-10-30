# Changelog

All notable changes to this project will be documented in this file.

## [0.2.1] - 2026-10-30

### Changed
- Aligned the plugin version with the DeepSeek Harness 0.2.1 release line.
- Validated against DeepSeek Harness v0.2.1-rc.5 source and documentation.
- Updated package metadata for the rc.5 peer/dev dependency ranges and bundle manifest.
- Aligned skill provider candidate/resource-base handling with the rc.5 skill provider pattern.
- Added the version-sync policy to the README: future DSH validation bumps the plugin version to the validated DSH base version.
- Separated the raw upstream `skills/` tree from the DSH `adapter/`; the four DSH text patches now live in the adapter/bootstrap layer.
- Added a raw upstream manifest keyed by the full v7.0.1 commit, SHA-256 content hashes, and `100644`/`100755` file modes.
- Switched Frontmatter parsing to YAML and added `metadata`/multi-line support.
- Made upstream sync stage and validate before replacing `skills/`; update now runs the full test suite.
- Added the weekly `upstream-sync` GitHub Actions workflow, which opens a PR and does not publish npm automatically.
- Made tests derive skill names and counts from `UPSTREAM.json`, so a future upstream release is not blocked by fixed v7.0.1/84/15 assertions.
- Added raw-parity verification to the workflow, update path, and publish gate.
- Made manifest replacement transactional alongside `skills/`; numeric SemVer comparison now covers `7.0.9` vs `7.0.10`.
- Provider `get()` returns `undefined` for a missing skill file, and catalog discovery skips directories without `SKILL.md`.
- Added rc.5 tool-contract checks, rejected-source and manifest-write failure rollback tests, and a future-version compatibility test.

## [0.1.0] - 2026-10-30

### Added
- Initial release of Superpowers plugin for DeepSeek Harness v0.2.1-rc.3+
- All 15 Superpowers skills from v7.0.1 with DSH-specific adaptations
- Per-session bootstrap injection mechanism
- Upstream sync scripts (`sync-upstream.mjs`, `update-upstream.mjs`)
- Comprehensive test suite (7 tests passing)
- DSH tool mapping (`references/dsh-tools.md`)
- Diagnosing path patching (workspace-local `.superpowers` instead of `~/.superpowers`)

### Changes
- Uses deterministic upstream version pinning (Superpowers 7.0.1)
- Tree hash verification for reproducibility
- Minimal modifications to original Superpowers content
- Zero runtime dependencies besides peer DSH packages

### Security
- No postinstall scripts or build steps
- No network access during installation
- All code reviewed and sanitized
- Transparent third-party attribution in THIRD_PARTY_NOTICES.md

---

## Upcoming Features
- GitHub Actions CI/CD pipeline
- Automated upstream update detection
- Full mutation testing coverage
- Documentation site generation
