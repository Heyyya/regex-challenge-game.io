/**
 * welcome.js — logic for index.html (Welcome screen)
 * ------------------------------------------------------------
 * A username is REQUIRED before the game can start. It is used
 * to tally the player's score in Supabase's leaderboard table
 * (see upsert_leaderboard_score in database.sql) — playing
 * multiple times under the same username accumulates score
 * rather than creating separate leaderboard rows.
 *
 * Progress is kept PER USERNAME: entering a username that
 * already has saved progress on this browser RESUMES it
 * (unlocked/completed categories, current score, etc.) rather
 * than wiping it. Only a brand-new username starts at "Numbers".
 * ------------------------------------------------------------
 */

document.addEventListener('DOMContentLoaded', () => {
  initIcons();

  const usernameInput = document.getElementById('username-input');
  usernameInput.value = getSavedUsername();

  usernameInput.addEventListener('input', clearUsernameError);
  usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleStartGame();
  });

  document.getElementById('btn-start-game').addEventListener('click', handleStartGame);
});

function clearUsernameError() {
  const errorEl = document.getElementById('username-error');
  errorEl.textContent = '';
  errorEl.className = 'feedback-message';
}

function readValidatedUsername() {
  const input = document.getElementById('username-input');
  const errorEl = document.getElementById('username-error');
  const username = input.value.trim();

  if (!username) {
    errorEl.textContent = '❌ Please enter a username to play.';
    errorEl.className = 'feedback-message show incorrect';
    input.focus();
    return null;
  }
  if (username.length > 20) {
    errorEl.textContent = '❌ Username must be 20 characters or fewer.';
    errorEl.className = 'feedback-message show incorrect';
    input.focus();
    return null;
  }
  if (!/^[a-zA-Z0-9 _-]+$/.test(username)) {
    errorEl.textContent = '❌ Use only letters, numbers, spaces, - or _.';
    errorEl.className = 'feedback-message show incorrect';
    input.focus();
    return null;
  }

  return username;
}

async function handleStartGame() {
  const username = readValidatedUsername();
  if (!username) return;

  const btn = document.getElementById('btn-start-game');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader-2" class="spin-icon"></i> Loading...';
  initIcons();

  try {
    // Remember the username on this browser and confirm/create their
    // leaderboard row in Supabase so score tallying is set up.
    saveUsername(username);
    setActiveUsername(username);
    await fetchLeaderboardEntryByUsername(username);

    // Resume this username's saved progress if it exists; only start
    // fresh at "Numbers" if this is genuinely a new username.
    const existing = loadStateForUsername(username);
    let state;

    if (existing && existing.unlockedCategoryIds.length > 0) {
      state = existing;
    } else {
      state = getDefaultState();
      state.username = username;

      const categories = await fetchCategories();
      const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);
      const first = sorted[0];
      if (first) state.unlockedCategoryIds = [first.id];
    }

    saveState(state);
    window.location.href = 'categories.html';
  } catch (err) {
    showToast(err.message || 'Failed to start the game.', 'error');
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    initIcons();
  }
}
