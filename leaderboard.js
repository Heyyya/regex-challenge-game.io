/**
 * leaderboard.js — logic for leaderboard.html
 * ------------------------------------------------------------
 */

document.addEventListener('DOMContentLoaded', init);

async function init() {
  initIcons();
  const listEl = document.getElementById('leaderboard-list');

  try {
    setupContinuePlayingLinks();
  } catch (err) {
    console.error('Error setting up continue-playing links:', err);
  }

  try {
    const entries = await fetchTopLeaderboard();
    renderLeaderboard(entries);
  } catch (err) {
    console.error('Error loading leaderboard:', err);
    listEl.innerHTML = `<div class="leaderboard-empty">${escapeHtml(err.message || 'Unable to load the leaderboard.')}</div>`;
  }
  initIcons();
}

/**
 * "Continue Playing" should only resume an in-progress player.
 * If nobody has entered a username on this browser yet, send them
 * to the dashboard to sign in instead of a categories page that
 * has nothing to resume.
 */
function setupContinuePlayingLinks() {
  const activeUsername = getActiveUsername();
  const links = [
    document.getElementById('btn-continue-playing'),
    document.getElementById('btn-continue-playing-main')
  ].filter(Boolean);

  if (!activeUsername) {
    links.forEach((link) => { link.href = 'index.html'; });
  }
}

function renderLeaderboard(entries) {
  const listEl = document.getElementById('leaderboard-list');
  listEl.innerHTML = '';

  if (!entries || entries.length === 0) {
    listEl.innerHTML = '<div class="leaderboard-empty">No scores yet. Be the first!</div>';
    return;
  }

  entries.forEach((entry, index) => {
    const rank = index + 1;
    const row = document.createElement('div');
    row.className = `leaderboard-row rank-${rank}`;
    row.style.animation = `fadeInUp 0.4s ease both`;
    row.style.animationDelay = `${index * 0.04}s`;
    row.innerHTML = `
      <div class="leaderboard-rank">${rank}</div>
      <div class="leaderboard-info">
        <div class="leaderboard-name">${escapeHtml(entry.username)}</div>
        <div class="leaderboard-sub">${entry.accuracy}% accuracy • ${entry.games_played || 1} game${(entry.games_played || 1) === 1 ? '' : 's'} • ${formatDuration(entry.completion_time)}</div>
      </div>
      <div class="leaderboard-score">${entry.score} pts</div>
    `;
    listEl.appendChild(row);
  });
}
