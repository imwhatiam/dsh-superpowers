# Changelog

All notable changes to this project will be documented in this file.

## [0.2.1] - 2026-10-30

### Changed
- Aligned the plugin version with the DeepSeek Harness 0.2.1 release line.
- Validated against DeepSeek Harness v0.2.1-rc.5 source and documentation.
- Updated package metadata for the rc.5 peer/dev dependency ranges and bundle manifest.
- Aligned skill provider candidate/resource-base handling with the rc.5 skill provider pattern.
- Added the version-sync policy to the README: future DSH validation bumps the plugin version to the validated DSH base version.

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
