// Tiny theme manager — toggles dark/light and persists to localStorage
export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

export function toggleTheme() {
  const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem('ghub-theme', next);
  } catch (e) {
    /* ignore */
  }
  return next;
}
