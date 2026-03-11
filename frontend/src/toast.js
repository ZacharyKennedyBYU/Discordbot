// ═══════════════════════════════════════════════
//  CordBridge — Toast Notifications
// ═══════════════════════════════════════════════

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

export function toast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <span class="toast-icon">${ICONS[type] || ICONS.info}</span>
    <span>${message}</span>
  `;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('fade-out');
    el.addEventListener('animationend', () => el.remove());
  }, duration);
}
