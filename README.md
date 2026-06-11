# CodeQuest

CodeQuest is a beginner-friendly, gamified coding tutor built as a local-first Progressive Web App. Milestone 2 keeps the original app shell and adds safer XP, level, streak, daily-goal, and profile-stat behavior using only browser storage.

## What is included through milestone 2

- React + Vite project setup.
- Mobile-first dashboard for iPhone-sized screens that also scales nicely on Mac.
- App name, today's lesson card, XP total, level, streak, daily checklist, daily goal progress, and continue learning button.
- Bottom navigation for Home, Learn, Practice, Projects, and Profile.
- `localStorage` persistence for total XP, current level, current streak, last active date, completed checklist items per day, completed lessons, and earned badges.
- Daily checklist reset using the user's device-local date.
- Automatic once-per-day completion for the “Open CodeQuest” checklist item.
- XP safeguards so checklist and lesson XP are awarded only once and do not increase on refresh.
- A Profile screen with total XP, level, streak, completed lessons, badges earned, and daily goal progress.
- Basic PWA manifest, SVG app icon, and production service worker shell cache.
- Sample data only; no backend, paid APIs, or full course system yet.

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

## Testing XP and streak features locally

1. Open the app and confirm the “Open CodeQuest” checklist item is completed automatically.
2. Refresh the page and confirm XP does **not** increase again for “Open CodeQuest.”
3. Complete checklist items until the daily goal is reached; the streak should increase only when that goal completes.
4. Press “Continue learning” once; lesson XP should be awarded once and the button should switch to “Lesson complete ✓.”
5. Use the Profile tab to confirm total XP, level, streak, completed lessons, earned badges, and daily goal progress.
6. To simulate a clean first run, clear the `codequest-progress` key from browser `localStorage` and refresh.

## Project structure

```text
.
├── public/
│   ├── icons/icon.svg          # App icon used by the manifest and browser tab
│   ├── manifest.webmanifest    # PWA metadata for install prompts
│   └── sw.js                   # Small production service worker for shell caching
├── src/
│   ├── components/             # Reusable UI pieces such as nav and stat cards
│   ├── data/sampleData.js      # Temporary lesson, checklist, nav, goal, and badge data
│   ├── hooks/useLocalStorage.js # Reusable localStorage persistence hook
│   ├── lib/progress.js         # Local XP, level, streak, daily goal, and badge logic
│   ├── App.jsx                 # Dashboard, profile, and progress UI behavior
│   ├── main.jsx                # React app entry point and service worker registration
│   └── styles.css              # Mobile-first app styling
├── .gitignore                  # Keeps dependencies, builds, and local files out of git
├── index.html                  # Vite HTML entry file
├── package.json                # NPM scripts and dependencies
└── vite.config.js              # Vite JSX runtime configuration
```

## Suggested next improvements

- Add unit tests for `src/lib/progress.js` so XP and streak edge cases are covered automatically.
- Add real navigation screens for Learn, Practice, and Projects.
- Store richer lesson content in IndexedDB for a stronger offline learning experience.
- Add optional celebration animations and sounds for badges, with reduced-motion and mute controls.
- Add an export/import progress option so local-first learners can back up their progress.
