// ═══════════════════════════════════════════════
//  CordBridge — Bot Editor Page
// ═══════════════════════════════════════════════

import { bots, providers } from '../api.js';
import { toast } from '../toast.js';

export function destroy() {}

export async function render(container, botId) {
  const isNew = botId === 'new';
  let bot = null;
  let providerList = [];

  try {
    providerList = await providers.list();
    if (!isNew) {
      bot = await bots.get(parseInt(botId));
    }
  } catch (err) {
    container.innerHTML = `<div class="page"><p style="color:var(--danger)">Error loading data: ${err.message}</p></div>`;
    return;
  }

  const title = isNew ? 'Create New Bot' : `Edit — ${escapeHtml(bot.name)}`;

  container.innerHTML = `
    <div class="page" style="max-width: 760px;">
      <div class="page-header">
        <h1>${isNew ? '🆕' : '✎'} ${title}</h1>
        <button class="btn btn-ghost" id="back-btn">← Back</button>
      </div>

      <form id="bot-form" autocomplete="off">
        <!-- Identity -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Identity</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="bot-name">Bot Name *</label>
              <input class="form-input" id="bot-name" type="text" placeholder="My Cool Bot" value="${escapeAttr(bot?.name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-token">Discord Token *</label>
              <input class="form-input" id="bot-token" type="password" placeholder="${isNew ? 'Paste your bot token' : '••••••••  (leave blank to keep current)'}" />
            </div>
          </div>
        </div>

        <!-- AI Provider -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">AI Configuration</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="bot-provider">Provider Profile</label>
              <select class="form-select" id="bot-provider">
                <option value="">— None —</option>
                ${providerList.map(p => `
                  <option value="${p.id}" ${bot?.provider_id === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-model">Model ID</label>
              <input class="form-input" id="bot-model" type="text" placeholder="deepseek/deepseek-v3.2" value="${escapeAttr(bot?.model || 'deepseek/deepseek-v3.2')}" />
            </div>
          </div>
        </div>

        <!-- Prompts -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Prompts</h3>
          <div class="form-group">
            <label class="form-label" for="bot-system">System Prompt</label>
            <textarea class="form-textarea" id="bot-system" rows="4" placeholder="Core instructions for the AI...">${escapeHtml(bot?.system_prompt)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-character">Character Prompt</label>
            <textarea class="form-textarea" id="bot-character" rows="4" placeholder="Personality, style, behavior...">${escapeHtml(bot?.character_prompt)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-first-msg">First Message (Identity Anchor)</label>
            <textarea class="form-textarea" id="bot-first-msg" rows="3" placeholder="An opening message the bot 'said' — always included in context to anchor its voice, even after clearing history...">${escapeHtml(bot?.first_message)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-prefill">Prefill (Assistant Start)</label>
            <textarea class="form-textarea" id="bot-prefill" rows="2" placeholder="Optional starting text...">${escapeHtml(bot?.prefill)}</textarea>
          </div>
        </div>

        <!-- Parameters -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Model Parameters</h3>
          <div class="form-row">
            <div class="form-group slider-group">
              <div class="slider-header">
                <label class="form-label">Temperature</label>
                <span class="slider-value" id="temp-val">${bot?.temperature ?? 0.9}</span>
              </div>
              <input type="range" id="bot-temp" min="0" max="2" step="0.05" value="${bot?.temperature ?? 0.9}" />
            </div>
            <div class="form-group slider-group">
              <div class="slider-header">
                <label class="form-label">Top P</label>
                <span class="slider-value" id="topp-val">${bot?.top_p ?? 0.9}</span>
              </div>
              <input type="range" id="bot-topp" min="0" max="1" step="0.05" value="${bot?.top_p ?? 0.9}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="bot-max-tokens">Max Output Tokens</label>
              <input class="form-input" id="bot-max-tokens" type="number" min="1" max="32000" value="${bot?.max_tokens ?? 300}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-max-prompt">Max Prompt Tokens</label>
              <input class="form-input" id="bot-max-prompt" type="number" min="1" max="128000" value="${bot?.max_prompt_tokens ?? 10000}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group slider-group">
              <div class="slider-header">
                <label class="form-label">Presence Penalty</label>
                <span class="slider-value" id="pp-val">${bot?.presence_penalty ?? 0.0}</span>
              </div>
              <input type="range" id="bot-pp" min="-2" max="2" step="0.1" value="${bot?.presence_penalty ?? 0.0}" />
            </div>
            <div class="form-group slider-group">
              <div class="slider-header">
                <label class="form-label">Frequency Penalty</label>
                <span class="slider-value" id="fp-val">${bot?.frequency_penalty ?? 0.0}</span>
              </div>
              <input type="range" id="bot-fp" min="-2" max="2" step="0.1" value="${bot?.frequency_penalty ?? 0.0}" />
            </div>
          </div>
        </div>

        <!-- Auto-start -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h3>Auto-Start</h3>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">Automatically start this bot when CordBridge launches.</p>
            </div>
            <label class="toggle">
              <input type="checkbox" id="bot-autostart" ${bot?.auto_start ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; gap: 0.75rem;">
            ${!isNew ? `<button type="button" class="btn btn-ghost" id="clear-history-btn">🧹 Clear History</button>` : ''}
            ${!isNew ? `<button type="button" class="btn btn-danger" id="delete-btn">🗑 Delete Bot</button>` : ''}
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <button type="button" class="btn btn-ghost" id="cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary" id="save-btn">💾 ${isNew ? 'Create Bot' : 'Save Changes'}</button>
          </div>
        </div>
      </form>
    </div>
  `;

  // ── Slider live values ──
  const sliders = [
    { input: 'bot-temp', display: 'temp-val' },
    { input: 'bot-topp', display: 'topp-val' },
    { input: 'bot-pp', display: 'pp-val' },
    { input: 'bot-fp', display: 'fp-val' },
  ];
  sliders.forEach(({ input, display }) => {
    const el = document.getElementById(input);
    const valEl = document.getElementById(display);
    el.addEventListener('input', () => { valEl.textContent = el.value; });
  });

  // ── Navigation ──
  document.getElementById('back-btn').addEventListener('click', () => { window.location.hash = '#/'; });
  document.getElementById('cancel-btn').addEventListener('click', () => { window.location.hash = '#/'; });

  // ── Clear History ──
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', async () => {
      if (!confirm(`Clear all conversation history for "${bot.name}"? The bot will lose its memory of past conversations.`)) return;
      try {
        const result = await bots.clearHistory(bot.id);
        toast(`History cleared (${result.messagesRemoved} messages removed)`, 'success');
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  // ── Delete ──
  const deleteBtn = document.getElementById('delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!confirm(`Are you sure you want to delete "${bot.name}"? This cannot be undone.`)) return;
      try {
        await bots.delete(bot.id);
        toast(`"${bot.name}" deleted`, 'info');
        window.location.hash = '#/';
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  // ── Submit ──
  document.getElementById('bot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    const body = {
      name: document.getElementById('bot-name').value.trim(),
      model: document.getElementById('bot-model').value.trim(),
      provider_id: parseInt(document.getElementById('bot-provider').value) || null,
      system_prompt: document.getElementById('bot-system').value,
      character_prompt: document.getElementById('bot-character').value,
      first_message: document.getElementById('bot-first-msg').value,
      prefill: document.getElementById('bot-prefill').value,
      temperature: parseFloat(document.getElementById('bot-temp').value),
      top_p: parseFloat(document.getElementById('bot-topp').value),
      max_tokens: parseInt(document.getElementById('bot-max-tokens').value),
      max_prompt_tokens: parseInt(document.getElementById('bot-max-prompt').value),
      presence_penalty: parseFloat(document.getElementById('bot-pp').value),
      frequency_penalty: parseFloat(document.getElementById('bot-fp').value),
      auto_start: document.getElementById('bot-autostart').checked,
    };

    const token = document.getElementById('bot-token').value.trim();
    if (token) body.discord_token = token;

    if (!body.name) {
      toast('Bot name is required', 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = isNew ? 'Create Bot' : 'Save Changes';
      return;
    }

    if (isNew && !token) {
      toast('Discord token is required for new bots', 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Create Bot';
      return;
    }

    try {
      if (isNew) {
        await bots.create(body);
        toast('Bot created!', 'success');
      } else {
        await bots.update(bot.id, body);
        toast('Bot updated!', 'success');
      }
      window.location.hash = '#/';
    } catch (err) {
      toast(err.message, 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = isNew ? 'Create Bot' : 'Save Changes';
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
