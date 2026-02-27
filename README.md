# Short Call Web (Demo)

Short Call Web is a public demonstration platform for managing fast staffing calls across operational departments, designed for low-friction adoption and end-to-end process visibility.

## Business intent

In operations with variable shift demand, teams need to:

- publish short-calls quickly;
- allow eligible employees to apply;
- maintain a transparent time-based queue;
- monitor application status (`pending`, `confirmed`, `waitlisted`);
- enforce governance by role (`employee`, `manager`, `admin`, `schedule`).

## Current functional scope

- **Demo authentication** using email/password, with architecture ready for future corporate SSO integration.
- **Role-based access control** through a central `requireAuth` middleware.
- **Employee workflow**:
  - view eligible short-calls;
  - apply to approved short-calls;
  - review queue position by timestamp;
  - track personal status.
- **Manager/Admin workflow**:
  - create short-call requests;
  - define cross-department openness;
  - review ranking and publication state.
- **Schedule workflow (approval gate)**:
  - approve or reject every created short-call request;
  - enforce frequency and department balancing before publication.
- **Explicit organization rules** with fixed departments:
  - EVS
  - Security
  - Host
  - Conversion
  - Operations
  - Maintenance
  - Administration

## Design direction

The interface follows a modern visual style inspired by BC Place Stadium colours:

- deep midnight blue foundations;
- bright stadium azure accents;
- clean silver/ice highlights;
- symbolic shapes (◉, ✦, ◆, ⬢) for a stronger visual identity.

## Technology stack

- HTML, CSS, and vanilla JavaScript.
- In-memory data for demo speed (refresh resets state).

## Demo users

- `employee@shortcall.demo` / `demo123`
- `manager@shortcall.demo` / `demo123`
- `admin@shortcall.demo` / `demo123`
- `schedule@shortcall.demo` / `demo123`

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## GitHub Pages deployment

Deployment is configured via GitHub Actions in `.github/workflows/pages.yml`.

### Workflow behaviour

1. Runs on push to `main` or `master`, and on manual dispatch.
2. Builds a static `dist/` artifact with:
   - `index.html`
   - `app.js`
   - `styles.css`
   - `404.html` (fallback copy of `index.html`)
3. Publishes to the `github-pages` environment.

### Publish steps

1. Push the repository to GitHub.
2. In **Settings → Pages**, select **GitHub Actions** as the source.
3. Push/merge to `main` (or `master`).
4. Monitor **Actions → Deploy Short Call Web Demo**.
5. Copy the final live URL from the `Deploy to GitHub Pages` step.

## Future roadmap

- MySQL persistence for production workloads.
- Dayforce SSO integration.
- Server-side APIs with audit trail and operational observability.
