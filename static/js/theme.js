/**
 * theme.js — Dark / Light mode toggle
 * Persists user preference to localStorage.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'bpai-theme';

  /** Read the saved preference or fall back to system preference. */
  function getSavedTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /** Apply theme to <html> and update all toggle icons on the page. */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    // Update every theme toggle icon found on the page
    document.querySelectorAll('#themeIcon, #themeIconDash').forEach(function (icon) {
      icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars';
    });
  }

  /** Toggle between light and dark. */
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // Apply on load (before DOM paint to avoid flash)
  applyTheme(getSavedTheme());

  // Wire up toggle buttons after DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('#themeToggle, #themeToggleDash').forEach(function (btn) {
      btn.addEventListener('click', toggleTheme);
    });
  });
})();
