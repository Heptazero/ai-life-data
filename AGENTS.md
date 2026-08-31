# Agent instructions

- This repository is a local, file-first personal context hub. Do not add a server unless the user explicitly asks for an always-on remote process.
- Treat Branch Timeline, Obsidian Markdown, `diary/`, `applogs/`, and `persona.md` as user-owned source data. Adapters are read-only.
- Treat `sources/` and `derived/` as regenerable output owned by `life sync`.
- Read `derived/current-state.json` first, then follow source indexes to the minimum relevant original files.
- Do not persist tokens, cookies, chat session databases, or unfiltered conversation logs.
- Preserve provenance. Model inference must never be written as an explicit source fact.
- Validate changes with `npm run check`, `npm test`, and `npm run build`.
