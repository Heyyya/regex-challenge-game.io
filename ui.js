/**
 * ui.js
 * ------------------------------------------------------------
 * Small shared UI helpers reused on every page: toast messages,
 * the loading overlay, and safe Lucide icon initialization.
 * ------------------------------------------------------------
 */

function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.className = 'toast';
  }, 3200);
}

function showLoading(visible) {
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;
  overlay.classList.toggle('hidden', !visible);
}

function initIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

const DIFFICULTY_BADGE_CLASS = {
  Beginner: 'badge-beginner',
  Easy: 'badge-easy',
  Medium: 'badge-medium',
  Hard: 'badge-hard',
  Expert: 'badge-expert'
};
