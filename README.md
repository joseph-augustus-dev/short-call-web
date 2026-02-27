# Short Call Web (Rebuilt Demo)

Short Call Web is a rebuilt static demo for short-call operations with role-based flows (Employee, Manager, Schedule, Admin).

## What was rebuilt

- Fresh single-page app (`index.html`, `styles.css`, `app.js`) to replace the previous version.
- Strong Schedule dashboard focused on:
  - approving/rejecting short-calls from **all departments**;
  - daily operations monitoring with **filters** (date/today, department, shift);
  - future absence/no-show management.
- Employee absence notification flow:
  - employees can notify illness/no-show/other;
  - employees **cannot** remove themselves;
  - only Schedule/Admin can remove an applicant from a call.

## Demo users

- `employee@shortcall.demo` / `demo123`
- `manager@shortcall.demo` / `demo123`
- `schedule@shortcall.demo` / `demo123`
- `admin@shortcall.demo` / `demo123`

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## GitHub Pages note

The repository keeps both root files and a `docs/` mirror (`docs/index.html`, `docs/app.js`, `docs/styles.css`) for compatibility with either GitHub Actions source or branch `/docs` source.
