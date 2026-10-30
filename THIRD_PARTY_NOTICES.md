# Third Party Notices

This product includes software from the following sources:

## Superpowers v7.0.1

- **Author**: Jesse Vincent (obra)
- **Repository**: https://github.com/obra/superpowers
- **Version / commit**: v7.0.1 / 2ce8aa15d05bd57213e6f746f953aafb7ded7a8b
- **License**: MIT License
- **Usage**: The `skills/` directory is a byte-for-byte copy of the upstream Superpowers v7.0.1 skills tree.

The full text of the MIT License is included in the LICENSE file at the root of this repository.

All Superpowers skill content is used under the original MIT license. DSH-specific behavior is kept outside the upstream tree:

- `adapter/dsh-tools.md` maps Superpowers actions to DSH tools.
- `adapter/path-policy.md` maps upstream `~/.superpowers` references to workspace `.superpowers/`.
- `adapter/bootstrap.js` composes the per-session bootstrap.
- The skill provider and session injection logic live in `index.js` and `lib/`.
