/**
 * game.js — logic for game.html
 * ------------------------------------------------------------
 * Requires pageState.currentChallengeQueue to already be
 * populated (set by categories.js before navigating here).
 * ------------------------------------------------------------
 */

const CATEGORY_BONUS_POINTS = 25;

let pageState = null;
let timerInterval = null;
let timerSeconds = 0;
let challengeStartedAt = null;

document.addEventListener('DOMContentLoaded', init);

function init() {
  pageState = loadState();

  if (!pageState.currentChallengeQueue || pageState.currentChallengeQueue.length === 0) {
    // No active challenge — bounce back to category selection.
    window.location.href = 'categories.html';
    return;
  }

  bindEvents();
  loadChallenge();
  initIcons();
}

function bindEvents() {
  document.getElementById('answer-form').addEventListener('submit', handleSubmitAnswer);
  document.getElementById('answer-input').addEventListener('input', clearFeedbackState);
  document.getElementById('btn-next').addEventListener('click', handleNextChallenge);
}

function $(id) { return document.getElementById(id); }

// ---------------------------------------------------------------
function loadChallenge() {
  const queue = pageState.currentChallengeQueue;
  const challenge = queue[pageState.currentChallengeIndex];

  const input = $('answer-input');
  input.value = '';
  input.classList.remove('correct', 'incorrect');
  input.disabled = false;
  clearFeedbackState();

  $('btn-next').disabled = true;
  $('btn-submit').disabled = false;

  $('challenge-category-name').textContent = pageState.currentCategoryName || 'Category';
  $('challenge-counter').textContent = `Challenge ${pageState.currentChallengeIndex + 1} / ${queue.length}`;
  $('challenge-description').textContent = challenge.description;
  $('challenge-pattern').textContent = challenge.regex_pattern;

  const difficultyBadge = $('challenge-difficulty');
  difficultyBadge.textContent = challenge.difficulty;
  difficultyBadge.className = `badge ${DIFFICULTY_BADGE_CLASS[challenge.difficulty] || 'badge-medium'}`;

  $('challenge-points').textContent = `+${challenge.points} pts`;

  const progressPct = Math.round((pageState.currentChallengeIndex / queue.length) * 100);
  $('challenge-progress-fill').style.width = `${progressPct}%`;

  $('stat-score').textContent = pageState.score;

  const card = $('challenge-card');
  card.classList.remove('fade-in-up');
  void card.offsetWidth;
  card.classList.add('fade-in-up');

  startTimer();
  input.focus();
  initIcons();
}

// ---------------------------------------------------------------
// Timer
// ---------------------------------------------------------------
function startTimer() {
  stopTimer();
  timerSeconds = 0;
  challengeStartedAt = Date.now();
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timerSeconds += 1;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  $('stat-timer').textContent = `${timerSeconds}s`;
}

// ---------------------------------------------------------------
// Answer submission
// ---------------------------------------------------------------
function handleSubmitAnswer(e) {
  e.preventDefault();
  const input = $('answer-input');
  const value = input.value;
  const challenge = pageState.currentChallengeQueue[pageState.currentChallengeIndex];

  if (!value.trim()) {
    showFieldFeedback(false, 'Please enter an answer.');
    return;
  }

  let isMatch = false;
  try {
    const regex = new RegExp(challenge.regex_pattern);
    isMatch = regex.test(value);
  } catch (err) {
    console.error('Invalid regex pattern:', challenge.regex_pattern, err);
    showToast('This challenge has an invalid pattern.', 'error');
    return;
  }

  if (isMatch) {
    handleCorrectAnswer(challenge);
  } else {
    handleIncorrectAnswer();
  }
}

function handleCorrectAnswer(challenge) {
  stopTimer();

  const earned = Math.max(0, challenge.points - timerSeconds);
  pageState.score += earned;
  pageState.correctCount += 1;

  const elapsed = Math.max(0, (Date.now() - challengeStartedAt) / 1000);
  pageState.responseTimes.push(elapsed);

  saveState(pageState);

  $('stat-score').textContent = pageState.score;

  const input = $('answer-input');
  input.classList.remove('incorrect');
  input.classList.add('correct');
  input.disabled = true;

  showFieldFeedback(true, `Correct! +${earned} points`);

  $('btn-submit').disabled = true;
  $('btn-next').disabled = false;
  $('btn-next').focus();
}

function handleIncorrectAnswer() {
  pageState.incorrectCount += 1;
  saveState(pageState);

  const input = $('answer-input');
  input.classList.remove('correct');
  input.classList.add('incorrect');

  showFieldFeedback(false, 'Incorrect. Try again.');

  input.style.animation = 'none';
  void input.offsetWidth;
  input.style.animation = '';
}

function showFieldFeedback(correct, message) {
  const icon = $('feedback-icon');
  const msg = $('feedback-message');

  icon.className = `feedback-icon show ${correct ? 'correct' : 'incorrect'}`;
  icon.innerHTML = correct
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  msg.textContent = (correct ? '✔ ' : '❌ ') + message;
  msg.className = `feedback-message show ${correct ? 'correct' : 'incorrect'}`;
}

function clearFeedbackState() {
  const input = $('answer-input');
  input.classList.remove('incorrect');
  $('feedback-icon').className = 'feedback-icon';
  $('feedback-message').className = 'feedback-message';
}

// ---------------------------------------------------------------
// Next challenge / category completion
// ---------------------------------------------------------------
function handleNextChallenge() {
  const queue = pageState.currentChallengeQueue;

  if (pageState.currentChallengeIndex < queue.length - 1) {
    pageState.currentChallengeIndex += 1;
    saveState(pageState);
    loadChallenge();
  } else {
    completeCategory();
  }
}

async function completeCategory() {
  const categoryId = pageState.currentCategoryId;

  if (!pageState.completedCategoryIds.includes(categoryId)) {
    pageState.completedCategoryIds.push(categoryId);
  }

  const bonus = CATEGORY_BONUS_POINTS;
  pageState.score += bonus;
  pageState.categoryBonusEarned[categoryId] = bonus;

  let isLastCategory = false;

  try {
    const categories = await fetchCategories();
    const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);
    const currentIndex = sorted.findIndex((c) => c.id === categoryId);
    const nextCategory = sorted[currentIndex + 1];

    if (nextCategory) {
      if (!pageState.unlockedCategoryIds.includes(nextCategory.id)) {
        pageState.unlockedCategoryIds.push(nextCategory.id);
      }
    } else {
      isLastCategory = true;
    }
  } catch (err) {
    console.error('Could not determine next category:', err);
  }

  // Clear the active-challenge pointers now that this category is done.
  pageState.currentChallengeQueue = [];
  pageState.currentChallengeIndex = 0;
  saveState(pageState);

  $('category-complete-name').textContent = `${pageState.currentCategoryName} Mastered`;
  $('category-complete-score').textContent = pageState.score;
  $('category-complete-bonus').textContent = `+${bonus}`;

  const nextBtn = $('btn-next-category');
  if (isLastCategory) {
    $('btn-next-category-label').textContent = 'View Final Results';
    nextBtn.href = 'results.html';
  } else {
    $('btn-next-category-label').textContent = 'Next Category';
    nextBtn.href = 'categories.html';
  }

  document.getElementById('view-challenge').classList.remove('active');
  document.getElementById('view-category-complete').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  initIcons();

  fireConfetti(isLastCategory ? 2200 : 900);

  // Push newly-earned points to the Supabase leaderboard now, so the
  // player shows up (and their score keeps growing) even if they never
  // reach the final results screen.
  syncProgressToLeaderboard(isLastCategory);
}

/**
 * Send only the score/time earned SINCE the last sync to Supabase,
 * tallied under the player's username. Safe to call after every
 * category — never resends points that were already saved.
 * @param {boolean} countGame - true only when this is the final
 *   category, so "games played" is counted once per completed run.
 */
async function syncProgressToLeaderboard(countGame) {
  if (!pageState.username) return;

  const scoreDelta = pageState.score - (pageState.syncedScore || 0);
  const totalTimeSeconds = pageState.gameStartTime
    ? Math.round((Date.now() - pageState.gameStartTime) / 1000)
    : 0;
  const timeDelta = totalTimeSeconds - (pageState.syncedTimeSeconds || 0);

  if (scoreDelta <= 0 && !countGame) return;

  const totalAnswers = pageState.correctCount + pageState.incorrectCount;
  const accuracy = totalAnswers > 0 ? Math.round((pageState.correctCount / totalAnswers) * 100) : 100;

  try {
    await saveLeaderboardEntry({
      username: pageState.username,
      score: Math.max(0, scoreDelta),
      accuracy,
      completionTime: Math.max(0, timeDelta),
      countGame
    });
    pageState.syncedScore = pageState.score;
    pageState.syncedTimeSeconds = totalTimeSeconds;
    if (countGame) pageState.gameCounted = true;
    saveState(pageState);
  } catch (err) {
    // Non-fatal: the player can still keep playing / try again from results.
    console.error('Leaderboard sync failed:', err);
  }
}
