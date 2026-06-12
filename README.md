# CodeQuest

CodeQuest is a beginner-friendly, gamified coding tutor built with React and Vite. It is a local-first Progressive Web App (PWA), so learner progress is saved in the browser with `localStorage` instead of a backend.

## Current features

- XP, levels, streaks, and a daily checklist.
- Beginner lesson path with unlocks and completion rewards.
- Code Playground for editing HTML, CSS, and JavaScript locally.
- AI Prompt Helper that creates copyable prompts without API keys or paid integrations.
- Guided beginner projects that can load starter code into the Playground.
- Profile screen with install guidance and progress backup/restore.
- PWA manifest and production service worker for install support.
- Responsive layout for phone and desktop screens.
- GitHub Pages deployment with GitHub Actions.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the local development server:

   ```bash
   npm run dev
   ```

3. Open the URL printed by Vite. It is usually:

   ```text
   http://localhost:5173
   ```

4. Create a production build:

   ```bash
   npm run build
   ```

5. Preview the production build locally:

   ```bash
   npm run preview
   ```

## GitHub Pages deployment

This repository is configured for the GitHub Pages project URL:

```text
https://connorharleywork.github.io/coding-quest-pwa/
```

The Vite config uses `/` while running `npm run dev`, and `/coding-quest-pwa/` for production builds so assets, the manifest, icons, and service worker load correctly from the GitHub Pages project path.

### How deployment works

The workflow at `.github/workflows/deploy.yml`:

1. Runs when code is pushed to `main`.
2. Can also be started manually from the GitHub Actions tab.
3. Installs dependencies with `npm ci`.
4. Builds the app with `npm run build`.
5. Uploads the generated `dist` folder as a GitHub Pages artifact.
6. Deploys that artifact to GitHub Pages.

Do not commit the `dist` folder manually. GitHub Actions creates and deploys it for you.

### One-time GitHub.com setup after merging

After this pull request is merged into `main`:

1. Open the repository on GitHub.com.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Save if GitHub asks you to save the setting.
5. Go to the **Actions** tab and confirm the **Deploy CodeQuest to GitHub Pages** workflow runs successfully.
6. Open the live site at:

   ```text
   https://connorharleywork.github.io/coding-quest-pwa/
   ```

## Testing the live deployed app

After the GitHub Pages workflow finishes:

1. Open the live URL in a normal browser tab.
2. Confirm the dashboard loads and the URL starts with `/coding-quest-pwa/`.
3. Refresh the page and confirm it still loads instead of showing a blank page.
4. Visit each section from the bottom navigation: Home, Learn, Practice, AI Helper, Projects, and Profile.
5. Complete a checklist item or lesson, refresh, and confirm XP/progress stays saved.
6. Open Profile, export a progress JSON backup, then import it to confirm backup/restore works.
7. On a phone or browser with install support, try installing the PWA and reopening it.

## LocalStorage note

Progress is local-first and stored by browser location. That means progress saved on `http://localhost:5173` and progress saved on `https://connorharleywork.github.io/coding-quest-pwa/` may be separate. Use the Profile backup/restore tools to move progress between localhost, the live GitHub Pages site, browsers, or devices.

## Project structure

```text
.
├── .github/workflows/deploy.yml # GitHub Pages deployment workflow
├── public/
│   ├── icons/                   # PWA icons
│   ├── manifest.webmanifest     # PWA metadata
│   └── sw.js                    # Production service worker shell cache
├── src/
│   ├── components/              # Reusable UI pieces such as nav and stat cards
│   ├── data/                    # Lessons, projects, checklist, and AI prompt data
│   ├── hooks/useLocalStorage.js # Reusable localStorage persistence hook
│   ├── utils/progress.js        # XP, streak, checklist, and progress helpers
│   ├── App.jsx                  # Main app screens and local-first behavior
│   ├── main.jsx                 # React entry point and service worker registration
│   └── styles.css               # Mobile-first app styling
├── index.html                   # Vite HTML entry file
├── package.json                 # NPM scripts and dependencies
└── vite.config.js               # Vite config with GitHub Pages base path
```

## Suggested next improvements

- Add small automated tests for progress import/export and streak edge cases.
- Add a visible “last backed up” timestamp after export/import.
- Add optional IndexedDB storage for larger future lesson content while keeping the app local-first.
- Add celebratory micro-animations for project completion with reduced-motion support.
