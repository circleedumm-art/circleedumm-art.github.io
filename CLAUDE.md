# Circle Learning Centre

Static HTML/CSS/vanilla JS + Firebase Auth/Firestore on GitHub Pages. No build step to run the site; dev-only tooling in CI is fine.

## Rules for every change
- One PR = one goal. Branch from main as claude/<topic>. Aim for <300 changed lines; if it grows, stop and propose a split.
- Keep English and Burmese in step: every user-facing string exists in both.
- Never weaken firestore.rules. If rules change, say so at the top of the PR.
- If you change any file listed in sw.js SHELL, bump VERSION.
- No unrelated edits or reformatting.
- Run the checks you can. State exactly what you did NOT verify. Never write "tested" without evidence.
- PR body: What / Why / Files / How verified / Manual steps for the owner / Risk and rollback.

## Checks
`npm install && npm run check` (undefined variables, HTML structure, manifest JSON, EN/MY keys).
Rules tests (need Java 21 + Node 22): `npm --prefix tests install && npm --prefix tests test`

## Gotchas
- Scripts are classic (non-module) and share globals per page. A shared const such as FV must be declared at the top level of each page's own script.
- Student and teacher portals have their own translation tables; keep both languages in step there too.
