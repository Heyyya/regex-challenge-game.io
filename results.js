/**
 * results.js — logic for results.html
 * ------------------------------------------------------------
 */

let pageState = null;
let allCategoriesCache = [];

document.addEventListener('DOMContentLoaded', init);

async function init() {
  pageState = loadState();

  if (pageState.completedCategoryIds.length === 0) {
    // Nobody has finished anything yet — nothing to show.
    window.location.href = 'index.html';
    return;
  }

  if (!pageState.username) {
    // Safety net: no username on this session — send them back to sign in.
    window.location.href = 'index.html';
    return;
  }

  bindEvents();
  await renderResults();
  fireConfetti(2600);
  initIcons();
}

function bindEvents() {
  document.getElementById('btn-save-score').addEventListener('click', () => {
    document.getElementById('nickname-display').textContent = pageState.username;
    openModal('modal-nickname');
  });
  document.getElementById('btn-confirm-nickname').addEventListener('click', handleSaveNickname);

  document.querySelectorAll('.modal-close').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
}

async function renderResults() {
  const totalAnswers = pageState.correctCount + pageState.incorrectCount;
  const accuracy = totalAnswers > 0 ? Math.round((pageState.correctCount / totalAnswers) * 100) : 100;
  const totalTimeSeconds = pageState.gameStartTime ? Math.round((Date.now() - pageState.gameStartTime) / 1000) : 0;

  const times = pageState.responseTimes || [];
  const avgTime = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const fastest = times.length ? Math.min(...times) : 0;
  const slowest = times.length ? Math.max(...times) : 0;

  document.getElementById('result-final-score').textContent = pageState.score;
  document.getElementById('result-accuracy').textContent = `${accuracy}%`;
  document.getElementById('result-correct').textContent = pageState.correctCount;
  document.getElementById('result-incorrect').textContent = pageState.incorrectCount;
  document.getElementById('result-avg-time').textContent = `${avgTime.toFixed(1)}s`;
  document.getElementById('result-fastest').textContent = `${fastest.toFixed(1)}s`;
  document.getElementById('result-slowest').textContent = `${slowest.toFixed(1)}s`;
  document.getElementById('result-total-time').textContent = formatDuration(totalTimeSeconds);

  // Persist computed stats for the leaderboard save step.
  pageState.finalStats = { accuracy, totalTimeSeconds };
  saveState(pageState);

  try {
    allCategoriesCache = await fetchCategories();
  } catch (err) {
    allCategoriesCache = [];
  }

  const catWrap = document.getElementById('result-categories');
  catWrap.innerHTML = '';
  const sorted = [...allCategoriesCache].sort((a, b) => a.display_order - b.display_order);
  sorted.forEach((cat) => {
    if (pageState.completedCategoryIds.includes(cat.id)) {
      const chip = document.createElement('span');
      chip.className = 'result-category-chip';
      chip.innerHTML = `<i data-lucide="check-circle"></i> ${escapeHtml(cat.name)}`;
      catWrap.appendChild(chip);
    }
  });
  initIcons();
}

function handleSaveNickname() {
  saveScoreAndGoToLeaderboard(pageState.username);
}

async function saveScoreAndGoToLeaderboard(username) {
  const btn = document.getElementById('btn-confirm-nickname');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Saving...';

  const stats = pageState.finalStats || { accuracy: 0, totalTimeSeconds: 0 };

  // Only send whatever hasn't already been synced via per-category
  // saves in game.js — keeps the leaderboard tally accurate even
  // though most (or all) of the score was likely pushed already.
  const scoreDelta = Math.max(0, pageState.score - (pageState.syncedScore || 0));
  const timeDelta = Math.max(0, stats.totalTimeSeconds - (pageState.syncedTimeSeconds || 0));
  const countGame = !pageState.gameCounted;

  try {
    // Tallied server-side: this delta is ADDED to the username's
    // running leaderboard total via upsert_leaderboard_score.
    await saveLeaderboardEntry({
      username,
      score: scoreDelta,
      accuracy: stats.accuracy,
      completionTime: timeDelta,
      countGame
    });
    pageState.syncedScore = pageState.score;
    pageState.syncedTimeSeconds = stats.totalTimeSeconds;
    if (countGame) pageState.gameCounted = true;
    saveState(pageState);
    window.location.href = 'leaderboard.html';
  } catch (err) {
    document.getElementById('nickname-error').textContent = `❌ ${err.message}`;
    document.getElementById('nickname-error').className = 'feedback-message show incorrect';
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    initIcons();
  }
}

function openModal(id) {
  document.getElementById(id).classList.add('active');
  initIcons();
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}
