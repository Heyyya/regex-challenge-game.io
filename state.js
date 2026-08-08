/**
 * state.js
 * ------------------------------------------------------------
 * Shared, persisted game state used across all pages
 * (welcome.html, categories.html, game.html, results.html,
 * leaderboard.html). Since this is a real multi-page app with
 * full navigations between pages, state must survive page loads
 * — so it is persisted to localStorage (not just kept in memory).
 *
 * Progress is stored PER USERNAME (unlocked/completed categories,
 * score, etc.) so that returning as the same username on this
 * browser resumes exactly where you left off instead of wiping
 * cleared categories. A small "active username" pointer tracks
 * which username's progress is currently in play, so pages other
 * than the dashboard (categories/game/results/leaderboard) know
 * which saved state to load without needing the username passed
 * around explicitly.
 *
 * No authentication or personal data is stored — only game
 * progress for the current browser/session, keyed by username.
 * ------------------------------------------------------------
 */

const STATE_STORAGE_PREFIX = 'regexGame_state_v1__';
const ACTIVE_USERNAME_KEY = 'regexGame_activeUsername_v1';
const USERNAME_STORAGE_KEY = 'regexGame_username_v1';

function normalizeUsername(username) {
  return (username || '').trim().toLowerCase();
}

function stateKeyFor(username) {
  return STATE_STORAGE_PREFIX + normalizeUsername(username);
}

/** Get the last-used username (remembered across visits on this browser). */
function getSavedUsername() {
  try {
    return localStorage.getItem(USERNAME_STORAGE_KEY) || '';
  } catch (err) {
    return '';
  }
}

/** Remember the username on this browser so returning players don't retype it. */
function saveUsername(username) {
  try {
    localStorage.setItem(USERNAME_STORAGE_KEY, username);
  } catch (err) {
    console.error('Failed to save username:', err);
  }
}

/** Mark which username's progress is the one currently being played. */
function setActiveUsername(username) {
  try {
    localStorage.setItem(ACTIVE_USERNAME_KEY, username);
  } catch (err) {
    console.error('Failed to set active username:', err);
  }
}

/** Which username's progress should game/categories/results pages load. */
function getActiveUsername() {
  try {
    return localStorage.getItem(ACTIVE_USERNAME_KEY) || '';
  } catch (err) {
    return '';
  }
}

function getDefaultState() {
  return {
    username: '',              // player identity, tallied against Supabase leaderboard
    unlockedCategoryIds: [],   // category ids the player may enter
    completedCategoryIds: [],  // category ids fully solved
    score: 0,
    correctCount: 0,
    incorrectCount: 0,
    responseTimes: [],         // seconds per solved challenge
    gameStartTime: null,       // ms epoch, set when first category starts
    categoryBonusEarned: {},   // { categoryId: bonusPoints }

    // How much of `score` / elapsed time has already been pushed to
    // Supabase (see game.js syncProgressToLeaderboard). Lets partial
    // and final saves send only the NEW points each time, so nothing
    // gets double-counted in the tallied leaderboard total.
    syncedScore: 0,
    syncedTimeSeconds: 0,
    gameCounted: false,        // true once this playthrough has been counted in games_played

    // Active-category / active-challenge pointers (used by game.html)
    currentCategoryId: null,
    currentCategoryName: null,
    currentChallengeQueue: [], // shuffled challenge objects for the active category
    currentChallengeIndex: 0,

    // Cached once the game finishes, read by results.html / leaderboard flow
    finalStats: null
  };
}

/**
 * Load the persisted state for the currently active username,
 * merged over the defaults so new fields introduced later never
 * crash old saved states. Returns fresh defaults if no username
 * is active yet, or if that username has no saved progress.
 */
function loadState() {
  try {
    const username = getActiveUsername();
    if (!username) return getDefaultState();

    const raw = localStorage.getItem(stateKeyFor(username));
    if (!raw) return getDefaultState();

    const parsed = JSON.parse(raw);
    return Object.assign(getDefaultState(), parsed);
  } catch (err) {
    console.error('Failed to load game state, starting fresh:', err);
    return getDefaultState();
  }
}

/**
 * Load the persisted state for a SPECIFIC username, without
 * changing which username is "active". Used on the dashboard to
 * check whether a typed-in username already has progress, before
 * committing to it.
 */
function loadStateForUsername(username) {
  try {
    const raw = localStorage.getItem(stateKeyFor(username));
    if (!raw) return null;
    return Object.assign(getDefaultState(), JSON.parse(raw));
  } catch (err) {
    console.error('Failed to load state for username:', err);
    return null;
  }
}

/** Persist the given state object under its own username's key. */
function saveState(state) {
  try {
    const username = state.username || getActiveUsername();
    if (!username) return;
    localStorage.setItem(stateKeyFor(username), JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save game state:', err);
  }
}

/** Wipe ONLY the given username's progress and start them over. */
function resetState(username) {
  try {
    const target = username || getActiveUsername();
    if (target) localStorage.removeItem(stateKeyFor(target));
  } catch (err) {
    console.error('Failed to reset game state:', err);
  }
}
