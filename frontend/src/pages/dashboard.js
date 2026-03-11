// ═══════════════════════════════════════════════
//  CordBridge — Dashboard Page
// ═══════════════════════════════════════════════

import { bots } from '../api.js';
import { toast } from '../toast.js';

let refreshTimer = null;

export function render(container) {
  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1>🤖 Dashboard</h1>
        <button class="btn btn-primary" id="add-bot-btn">＋ New Bot</button>
      </div>
      <div id="bot-list" class="card-grid"></div>
    </div>
  `;

  document.getElementById('add-bot-btn').addEventListener('click', () => {
    window.location.hash = '#/bots/new';
  });

  loadBots();
  // Auto-refresh every 5s
  refreshTimer = setInterval(loadBots, 5000);
}

export function destroy() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

async function loadBots() {
  const listEl = document.getElementById('bot-list');
  if (!listEl) return;

  try {
    const botList = await bots.list();

    if (botList.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🤖</div>
          <p>No bots yet. Create your first bot to get started!</p>
          <button class="btn btn-primary" onclick="location.hash='#/bots/new'">＋ Create Bot</button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = botList.map(bot => `
      <div class="card bot-card" data-bot-id="${bot.id}">
        <div class="bot-card-header">
          <span class="bot-card-name">${escapeHtml(bot.name)}</span>
          <span class="status-badge ${bot.online ? 'online' : 'offline'}">
            <span class="status-dot"></span>
            ${bot.online ? 'Online' : 'Offline'}
          </span>
        </div>
        <div class="bot-card-meta">
          <div class="meta-row">
            <span class="meta-label">Model</span>
            <span>${escapeHtml(bot.model || '—')}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Provider</span>
            <span>${escapeHtml(bot.provider_name || 'None')}</span>
          </div>
        </div>
        <div class="bot-card-actions">
          <button class="btn btn-sm ${bot.online ? 'btn-danger' : 'btn-success'}" data-toggle-id="${bot.id}">
            ${bot.online ? '⏹ Stop' : '▶ Start'}
          </button>
          <button class="btn btn-sm btn-ghost" data-edit-id="${bot.id}">✎ Edit</button>
        </div>
      </div>
    `).join('');

    // Attach event listeners
    listEl.querySelectorAll('[data-toggle-id]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.toggleId);
        const bot = botList.find(b => b.id === id);
        btn.disabled = true;
        btn.textContent = '…';
        try {
          if (bot.online) {
            await bots.stop(id);
            toast(`"${bot.name}" stopped`, 'info');
          } else {
            await bots.start(id);
            toast(`"${bot.name}" started`, 'success');
          }
        } catch (err) {
          toast(err.message, 'error');
        }
        loadBots();
      });
    });

    listEl.querySelectorAll('[data-edit-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.hash = `#/bots/${btn.dataset.editId}`;
      });
    });

    listEl.querySelectorAll('.bot-card').forEach(card => {
      card.addEventListener('click', () => {
        window.location.hash = `#/bots/${card.dataset.botId}`;
      });
    });

  } catch (err) {
    listEl.innerHTML = `<p style="color: var(--danger);">Failed to load bots: ${err.message}</p>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
