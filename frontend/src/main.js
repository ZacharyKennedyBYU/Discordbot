// ═══════════════════════════════════════════════
//  CordBridge — Main Entry / Router
// ═══════════════════════════════════════════════

import './style.css';
import * as dashboard from './pages/dashboard.js';
import * as botEditor from './pages/botEditor.js';
import * as providersPage from './pages/providers.js';

const app = document.getElementById('app');
let currentPage = null;

// ── Navbar ──
function renderNavbar(activeRoute) {
  return `
    <nav class="navbar">
      <div class="navbar-brand" onclick="location.hash='#/'">
        <span class="logo-icon">⚡</span>
        CordBridge
      </div>
      <div class="navbar-links">
        <a href="#/" class="${activeRoute === 'dashboard' ? 'active' : ''}">Dashboard</a>
        <a href="#/providers" class="${activeRoute === 'providers' ? 'active' : ''}">Providers</a>
      </div>
    </nav>
  `;
}

// ── Router ──
async function route() {
  // Clean up previous page
  if (currentPage?.destroy) currentPage.destroy();

  const hash = window.location.hash || '#/';

  // Determine route
  let activeRoute = 'dashboard';
  if (hash.startsWith('#/providers')) activeRoute = 'providers';
  else if (hash.startsWith('#/bots/')) activeRoute = 'botEditor';

  // Render navbar + page container
  app.innerHTML = renderNavbar(activeRoute) + '<div id="page-content"></div>';
  const content = document.getElementById('page-content');

  if (activeRoute === 'providers') {
    currentPage = providersPage;
    await providersPage.render(content);
  } else if (activeRoute === 'botEditor') {
    const botId = hash.split('/').pop(); // 'new' or numeric id
    currentPage = botEditor;
    await botEditor.render(content, botId);
  } else {
    currentPage = dashboard;
    dashboard.render(content);
  }
}

// ── Init ──
window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => {
  if (!window.location.hash) window.location.hash = '#/';
  route();
});
