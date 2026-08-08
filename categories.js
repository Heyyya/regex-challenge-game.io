/**
 * categories.js — logic for categories.html
 * ------------------------------------------------------------
 */

let pageState = null;
let allCategories = [];
let challengesByCategory = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  pageState = loadState();

  // Safety net: if someone lands here with no progress at all
  // (e.g. bookmarked the page), start fresh from category 1.
  try {
    showLoading(true);
    allCategories = await fetchCategories();
    const allChallenges = await fetchAllChallenges();

    challengesByCategory = {};
    allChallenges.forEach((c) => {
      if (!challengesByCategory[c.category_id]) challengesByCategory[c.category_id] = [];
      challengesByCategory[c.category_id].push(c);
    });

    if (pageState.unlockedCategoryIds.length === 0) {
      const sorted = [...allCategories].sort((a, b) => a.display_order - b.display_order);
      if (sorted[0]) pageState.unlockedCategoryIds = [sorted[0].id];
      saveState(pageState);
    }

    renderCategories();
    showLoading(false);
  } catch (err) {
    showLoading(false);
    showToast(err.message || 'Failed to load categories.', 'error');
  }

  initIcons();
}

function renderCategories() {
  const grid = document.getElementById('category-grid');
  grid.innerHTML = '';

  const sorted = [...allCategories].sort((a, b) => a.display_order - b.display_order);

  sorted.forEach((category, index) => {
    const isUnlocked = pageState.unlockedCategoryIds.includes(category.id);
    const isCompleted = pageState.completedCategoryIds.includes(category.id);
    const total = (challengesByCategory[category.id] || []).length;

    const card = document.createElement('div');
    card.className = `category-card ${isUnlocked ? '' : 'locked'} ${isCompleted ? 'completed' : ''}`;
    card.style.animationDelay = `${index * 0.06}s`;

    card.innerHTML = `
      ${isCompleted ? `<div class="category-check-badge"><i data-lucide="check"></i></div>` : ''}
      ${!isUnlocked ? `<div class="category-lock-badge"><i data-lucide="lock"></i></div>` : ''}
      <div class="category-icon-wrap"><i data-lucide="${category.icon}"></i></div>
      <h3 class="category-title">${escapeHtml(category.name)}</h3>
      <p class="category-desc">${escapeHtml(category.description)}</p>
      <div class="category-footer">
        <span class="badge ${DIFFICULTY_BADGE_CLASS[category.difficulty] || 'badge-medium'}">${category.difficulty}</span>
        <span class="category-progress-mini">${isCompleted ? 'Completed' : `${total} Challenges`}</span>
      </div>
    `;

    if (isUnlocked) {
      card.addEventListener('click', () => startCategory(category));
    }

    grid.appendChild(card);
  });

  const totalCategories = allCategories.length || 1;
  const completed = pageState.completedCategoryIds.length;
  const pct = Math.round((completed / totalCategories) * 100);
  document.getElementById('overall-progress-fill').style.width = `${pct}%`;

  initIcons();
}

function startCategory(category) {
  const challenges = challengesByCategory[category.id] || [];
  if (challenges.length === 0) {
    showToast('This category has no challenges yet.', 'error');
    return;
  }

  pageState.currentCategoryId = category.id;
  pageState.currentCategoryName = category.name;
  pageState.currentChallengeQueue = shuffleArray(challenges);
  pageState.currentChallengeIndex = 0;

  if (!pageState.gameStartTime) pageState.gameStartTime = Date.now();

  saveState(pageState);
  window.location.href = 'game.html';
}
