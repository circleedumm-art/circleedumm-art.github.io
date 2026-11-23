# Circle Learning Centre (CLC) Website

English and life-skills learning for youths in Myanmar. This repository contains the public website and the student, teacher and admin portals for Circle Learning Centre.

**Live site:** https://circleedumm-art.github.io/

## Features

- **Public site:** programs, class schedule, enrolment form (with optional scholarship essay), student reviews, how-to videos.
- **Student portal** (`student.html`): classes, weekly timetable, homework assignments and submissions, attendance, grades, exams, certificates, announcements, messages to the teacher, profile.
- **Teacher portal** (`teacher.html`): homework assignment and review with feedback, attendance, grades, exams, class materials, class time and links, announcements, messages, profile.
- **Admin dashboard** (`admin.html`): enrolments, accounts, classes, announcements, site content, reviews, reports.
- **Bilingual:** English and Burmese (EN / မြန်မာ), light and dark themes.
- **Installable PWA:** service worker, offline page, "Add to Home Screen".
- **Festive decorations** on special days (`festive.js`).

## Tech stack

Plain HTML, CSS and JavaScript (no build step), Firebase Authentication and Cloud Firestore, hosted on GitHub Pages.

## Quick start

1. **Create a Firebase project** with Authentication (Email/Password and Google) and Cloud Firestore.
2. **Edit `firebase-config.js`:**
   - Paste your web app config values.
   - Set `ADMIN_EMAIL` to the one Google account that is admin.
   - Keep `ID_DOMAIN` as the hidden domain used to turn a login ID like `S001` into an email.
3. **Deploy the rules:** copy `firestore.rules` into Firebase Console → Firestore → Rules. Change the admin email inside `isAdmin()` so it matches `ADMIN_EMAIL`.
4. **Run locally:** serve the folder with any static server, for example `python3 -m http.server 8000`, then open `http://localhost:8000`.
5. **Publish:** push to GitHub and enable GitHub Pages for the repository.
6. **First login:** sign in as admin with Google, open the **Site** tab and tap **Load starter programs**, then create teacher and student accounts.

## Security notes

- The Firebase config values are **not secrets**. Your data is protected by `firestore.rules`.
- The admin email must match in `firebase-config.js` and `firestore.rules`.
- Student and teacher accounts are created by the admin only. Guests can only add a pending enrolment.
- Only `https://` links are shown or opened.

## Yearly upkeep

- **Thadingyut decorations:** add next year's full-moon date to `THADINGYUT_FULL_MOON` in `festive.js`.
- **Force a refresh for everyone:** change `VERSION` in `sw.js`.
- **Optional images:** add `logo-dark.png` (dark theme logo) and `signature.png` (certificate signature) next to `logo.png`.
- **Preview a festive day:** add `?decor=christmas` (or `newyear`, `independence`, `thingyan`, `mayday`, `teachers`, `thadingyut`) to any page address.

## File map

| File | Purpose |
|---|---|
| `index.html`, `app.js` | Public website |
| `student.html`, `student.js`, `student-homework.js` | Student portal |
| `teacher.html`, `teacher.js`, `teacher-homework.js` | Teacher portal |
| `admin.html`, `admin.js` | Admin dashboard |
| `common.js` | Shared helpers (schedule, attendance, messages, announcements) |
| `defaults.js` | Starter programs |
| `firebase-config.js` | Firebase config, admin email, login domain |
| `firestore.rules` | Database security rules |
| `style.css` | All styling |
| `festive.js`, `ripple.js` | Decorations and click effect |
| `sw.js`, `pwa.js`, `manifest.webmanifest`, `offline.html` | PWA support |
| `404.html` | Redirects old `/CLC-Web/` links |
| `robots.txt`, `sitemap.xml` | Search engine files |

## Contributing

Suggestions and fixes are welcome. Open an issue or pull request. Please keep the site free of build tools, keep both languages in step, and never weaken `firestore.rules`.

## License

Code is released under the [MIT License](LICENSE). The CLC name, logo, signature and program wording are excluded; see the license for details.
