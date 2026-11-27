Repo: circleedumm-art/circleedumm-art.github.io (Circle Learning Centre).
Static HTML/CSS/vanilla JS + Firebase Auth/Firestore on GitHub Pages.
Rules for every PR:
- One PR = one goal. Branch from main as claude/<topic>. Aim for <300 changed lines; if it grows, stop and propose a split.
- The site must run with no build step. Dev-only tooling in CI is fine.
- Keep English and Burmese in step: every user-facing string exists in both.
- Never weaken firestore.rules. If rules change, say so at the top of the PR.
- If you change any file listed in sw.js SHELL, bump VERSION.
- No unrelated edits or reformatting.
- Run the checks you can. State exactly what you did NOT verify. Never write "tested" without evidence.
- PR body: What / Why / Files / How verified / Manual steps for the owner (Firebase console etc.) / Risk and rollback.