# CodeQuest

CodeQuest is a beginner-friendly, gamified coding tutor built as a local-first Progressive Web App. Milestone 1 focuses on the home dashboard experience only: sample learning data, local progress storage, and an app-like mobile-first UI.

## What is included in milestone 1

- React + Vite project setup.
- Mobile-first dashboard for iPhone-sized screens that also scales nicely on Mac.
- App name, today's lesson card, XP total, level, streak, daily checklist, and continue learning button.
- Bottom navigation placeholders for Home, Learn, Practice, Projects, and Profile.
- `localStorage` persistence for XP, streak, completed lessons, and checklist progress.
- Basic PWA manifest, SVG app icon, and production service worker shell cache.
- Sample data only; no backend or full course system yet.

## Setup instructions

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the local development server:

   ```bash
   npm run dev
   ```

3. Open the URL printed by Vite in your browser. It is usually:

   ```text
   http://localhost:5173
   ```

4. Create a production build when you want to test the installable PWA shell:

   ```bash
   npm run build
   ```

5. Run the project check command, which currently creates a production build:

   ```bash
   npm run check
   ```

6. Preview the production build locally:

   ```bash
   npm run preview
   ```

## Project structure

```text
.
├── public/
│   ├── icons/icon.svg          # App icon used by the manifest and browser tab
│   ├── manifest.webmanifest    # PWA metadata for install prompts
│   └── sw.js                   # Small production service worker for shell caching
├── src/
│   ├── components/             # Reusable UI pieces such as nav and stat cards
│   ├── data/sampleData.js      # Temporary lesson, checklist, and nav sample data
│   ├── hooks/useLocalStorage.js # Reusable localStorage persistence hook
│   ├── App.jsx                 # Milestone 1 dashboard UI and progress behavior
│   ├── main.jsx                # React app entry point and service worker registration
│   └── styles.css              # Mobile-first app styling
├── .gitignore                  # Keeps dependencies, builds, and local files out of git
├── index.html                  # Vite HTML entry file
├── package.json                # NPM scripts and dependencies
└── vite.config.js              # Vite JSX runtime configuration
└── package.json                # NPM scripts and dependencies
```

## Suggested next improvements

- Add real navigation screens for Learn, Practice, Projects, and Profile.
- Move progress rules into a dedicated quest engine so XP and streak logic are easier to test.
- Add lesson content stored in IndexedDB for richer offline learning.
- Include animations and sound effects for completing quests, with reduced-motion support.
- Add unit tests for localStorage persistence and XP calculations.
