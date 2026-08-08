# 🎯 Regex Challenge Game

A modern, premium-feeling educational web app where players master Regular Expressions by solving interactive pattern-matching challenges — built as a **true multi-page site** with a separate, standalone leaderboard dashboard.

---

## 📖 Project Overview

Regex Challenge Game guides players through **7 progressively unlocked categories** (Numbers, Letters, Dates, Passwords, Emails, URLs, Phone Numbers). In each challenge, the player is shown a regex pattern and a description, and must type a string that satisfies that pattern. Correct answers award points (with a time-based bonus decay), incorrect answers require another attempt — there is no skipping. After finishing every category, players see a detailed results screen and can save their score to a global Top 10 leaderboard, presented on its own dedicated page.

Built with **plain HTML/CSS/JavaScript** (no frameworks) and **Supabase** as the only backend, this project runs with no build step and no authentication.

---

## 🧭 Pages (separate, real navigations — not a single-page app)

| Page | File | Purpose |
|------|------|---------|
| Welcome | `index.html` | Hero landing screen, "Start Game" (resets progress) and a link to the leaderboard |
| Categories | `categories.html` | The 7-category dashboard grid, showing locked/unlocked/completed state |
| Challenge | `game.html` | The active regex challenge, timer, scoring, and the "Category Complete" celebration |
| Results | `results.html` | Final statistics summary + Save Score modal |
| **Leaderboard** | `leaderboard.html` | **Standalone dashboard page** — Top 10 scores from Supabase, reachable independently from the welcome screen or after saving a score |

Each page is a real `.html` file loaded via full navigation (`<a href>` / `window.location.href`). Game progress (score, unlocked categories, timers-in-progress data, etc.) is carried between pages using `localStorage`, so refreshing or navigating back/forward behaves correctly.

---

## ✨ Features

- 🏠 Animated hero welcome screen with floating regex illustrations
- 🗂️ 7 categories, unlocked sequentially as previous ones are completed
- 🧩 Multiple hand-crafted regex challenges per category (stored entirely in Supabase — never hardcoded)
- ⌨️ Live input validation against the real `RegExp` pattern from the database
- ✅ Success animation (green glow + check icon) / ❌ shake animation on wrong answers
- 🔒 "Next Challenge" is disabled until the current challenge is solved correctly
- ⏱️ Per-challenge scoring: 10+ base points, −1 point per second elapsed, minimum 0
- 📊 Live score, timer, challenge counter, and animated progress bars (per-category and overall)
- 🎉 Category-complete celebration with bonus points and confetti
- 🏆 Full final-results summary: score, accuracy, correct/incorrect counts, average/fastest/slowest response time, total time, completed categories
- 📝 Nickname modal + Supabase-backed **standalone Top 10 leaderboard page**
- 💎 Glassmorphism UI, soft shadows, gradients, and smooth micro-interactions inspired by Linear / Stripe / Apple / Vercel
- 📱 Fully responsive across desktop, laptop, tablet, and mobile
- 🔗 Real multi-page navigation with shared, persisted game state

---

## 🛠️ Technologies

| Layer      | Technology                          |
|------------|--------------------------------------|
| Markup     | HTML5 (5 separate pages)             |
| Styling    | CSS3 (custom properties, no framework), single shared `style.css` |
| Logic      | Vanilla JavaScript (ES6+, async/await), one script per page + shared helpers |
| Backend    | Supabase (Postgres + REST via JS SDK) |
| Icons      | Lucide Icons (CDN)                   |
| Fonts      | Google Fonts — Inter                 |

No React, Vue, Angular, jQuery, Bootstrap, Tailwind, TypeScript, or server-side frameworks are used.

---

## 📁 Folder Structure

```
regex-challenge-game/
├── index.html         # Welcome / landing page
├── welcome.js          # Logic for index.html
├── categories.html     # Category selection dashboard
├── categories.js       # Logic for categories.html
├── game.html            # Active challenge + category-complete view
├── game.js               # Logic for game.html
├── results.html          # Final results summary + save-score modal
├── results.js             # Logic for results.html
├── leaderboard.html       # Standalone leaderboard dashboard
├── leaderboard.js          # Logic for leaderboard.html
├── state.js                 # Shared localStorage-backed game state
├── ui.js                     # Shared UI helpers (toast, loading, icons, formatting)
├── confetti.js                # Shared canvas confetti effect
├── supabase.js                 # Supabase client + all DB queries
├── style.css                    # Shared design system & responsive styles
├── database.sql                  # Schema, RLS policies, seed data
└── README.md                      # This file
```

---

## 🚀 Installation

1. **Download** this folder to your machine.
2. No build tools or package managers are required — it's static HTML/CSS/JS.
3. Serve the folder with any static file server, for example:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8080
   ```
4. Open the served URL (defaults to `index.html`) in your browser.

> ⚠️ A local server is recommended over opening `index.html` directly via `file://`, for consistent behavior with Supabase requests and page navigation.

---

## 🔧 Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once ready, open **Project Settings → API** and copy:
   - **Project URL**
   - **anon public API key**
3. Open `supabase.js` and replace:
   ```js
   const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR-SUPABASE-ANON-KEY';
   ```
   with your actual values. Every page includes this same file, so you only edit it once.

---

## 🗄️ Database Import

1. In your Supabase project, open the **SQL Editor**.
2. Create a **New Query**.
3. Paste the entire contents of `database.sql`.
4. Click **Run**.

This will:

- Drop and recreate `categories`, `regex_challenges`, and `leaderboard` tables
- Enable Row Level Security with public **read** access on categories/challenges and public **read + insert** access on the leaderboard (no auth required)
- Seed all 7 categories and 5–6 regex challenges per category

Verify in **Table Editor** — you should see 7 rows in `categories` and ~35 rows in `regex_challenges`.

---

## ▶️ Playing the Game

1. Serve the project folder and open `index.html`.
2. Enter a **username** in the field on the dashboard (required) — this is remembered on your browser for next time, and is what your score gets tallied under in Supabase.
3. Click **Start Game** — this resets any previous progress and takes you to `categories.html`.
4. Only **Numbers** is unlocked at first. Click it to go to `game.html` and solve its challenges.
5. Solving every challenge in a category unlocks the next one, in this order:
   `Numbers → Letters → Dates → Passwords → Emails → URLs → Phone Numbers`
6. **Every time a category is completed**, the points just earned are pushed straight to Supabase and added to your username's running leaderboard total — so even if you close the tab partway through, whatever you've cleared so far is already saved and visible on the leaderboard. A completed run also counts once toward "games played"; a category clear on its own does not.
7. After the last category, you land on `results.html` with full statistics.
8. Click **Save Score to Leaderboard** to confirm — this only sends whatever hasn't already been synced (usually nothing, since categories already pushed it) and marks the run as a completed game.
9. The leaderboard is also reachable anytime from the welcome screen's **View Leaderboard** link, independent of playing a game.

---

## ☁️ Deployment

This is a static, multi-page site — deploy it anywhere that serves static files:

- **Netlify / Vercel**: drag-and-drop the folder or connect the Git repo. No build command needed.
- **GitHub Pages**: push to a repo and enable Pages on the root (or `/docs`) branch. `index.html` is automatically the entry point.
- **Any static host** (S3, Cloudflare Pages, Surge, etc.) works identically — just make sure all `.html`, `.js`, and `.css` files stay in the same directory so relative links resolve.

Your Supabase `anon` key is safe to expose client-side — it's designed for browser use and is governed by Row Level Security policies.

---

## 🧱 Architecture Notes

- **Multi-page navigation**: each screen is its own `.html` file with its own `<script>` for page-specific logic — real browser navigations (`<a href>`, `window.location.href`), not JS-driven view-swapping within a single page.
- **Shared game state**: `state.js` exposes `loadState()` / `saveState()` / `resetState()` backed by `localStorage`, so score, timers-in-progress data, unlocked/completed categories, and response times survive page loads and back/forward navigation.
- **Shared utilities**: `ui.js` (toast, loading overlay, icon init, formatting) and `confetti.js` (canvas confetti) are reused across pages to avoid duplicate code.
- **Data flow**: categories and challenges are fetched fresh from Supabase on the pages that need them (`categories.html`, `game.js`'s completion check, `results.html`); no challenge content is ever hardcoded in JS.
- **Scoring**: each challenge starts a 1-second interval timer on `game.html`; live score is `max(0, basePoints - secondsElapsed)`, locked in the instant a correct answer is submitted and immediately persisted to `localStorage`.
- **Session-based progress**: starting a new game from the welcome screen always resets `localStorage` progress, matching the "no accounts" requirement — there's nothing to log into, but progress does persist across a single browsing session/page reloads until a new game is started.

---

## 📄 License

This project is provided as-is for educational and portfolio purposes. You are free to use, modify, and distribute it.
