// ═══════════════════════════════════════════════
//  CordBridge — Providers Page
// ═══════════════════════════════════════════════

import { providers } from '../api.js';
import { toast } from '../toast.js';

export function destroy() {}

export async function render(container) {
  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1>🔑 API Providers</h1>
        <button class="btn btn-primary" id="add-provider-btn">＋ New Provider</button>
      </div>
      <div id="provider-list" class="card-grid"></div>
    </div>
  `;

  document.getElementById('add-provider-btn').addEventListener('click', () => openModal());
  loadProviders();
}

async function loadProviders() {
  const listEl = document.getElementById('provider-list');
  if (!listEl) return;

  try {
    const providerList = await providers.list();

    if (providerList.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🔑</div>
          <p>No API providers yet. Add one to connect your bots to an AI service.</p>
          <button class="btn btn-primary" id="empty-add-btn">＋ Add Provider</button>
        </div>
      `;
      document.getElementById('empty-add-btn')?.addEventListener('click', () => openModal());
      return;
    }

    listEl.innerHTML = providerList.map(p => `
      <div class="card">
        <div class="provider-card-header">
          <span class="provider-card-name">${escapeHtml(p.name)}</span>
          <div class="provider-card-actions">
            <button class="btn-icon" data-edit-provider="${p.id}" title="Edit">✎</button>
            <button class="btn-icon danger" data-delete-provider="${p.id}" title="Delete">🗑</button>
          </div>
        </div>
        <div class="provider-card-url">${escapeHtml(p.base_url)}</div>
      </div>
    `).join('');

    listEl.querySelectorAll('[data-edit-provider]').forEach(btn => {
      btn.addEventListener('click', () => openModal(parseInt(btn.dataset.editProvider)));
    });

    listEl.querySelectorAll('[data-delete-provider]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.deleteProvider);
        const prov = providerList.find(p => p.id === id);
        if (!confirm(`Delete provider "${prov?.name}"? Bots using it will lose their API connection.`)) return;
        try {
          await providers.delete(id);
          toast('Provider deleted', 'info');
          loadProviders();
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
  } catch (err) {
    listEl.innerHTML = `<p style="color: var(--danger);">Failed to load providers: ${err.message}</p>`;
  }
}

async function openModal(editId = null) {
  const isEdit = editId !== null;
  let existing = null;

  if (isEdit) {
    try {
      existing = await providers.get(editId);
    } catch (err) {
      toast(err.message, 'error');
      return;
    }
  }

  // Remove any existing modal
  document.querySelector('.modal-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${isEdit ? 'Edit Provider' : 'New Provider'}</h2>
        <button class="btn-icon" id="modal-close">✕</button>
      </div>
      <form id="provider-form" autocomplete="off">
        <div class="form-group">
          <label class="form-label" for="prov-name">Name *</label>
          <input class="form-input" id="prov-name" type="text" placeholder="e.g. OpenRouter, My Local LLM" value="${escapeAttr(existing?.name)}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="prov-url">Base URL</label>
          <input class="form-input" id="prov-url" type="url" placeholder="https://openrouter.ai/api/v1" value="${escapeAttr(existing?.base_url || 'https://openrouter.ai/api/v1')}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="prov-key">API Key ${isEdit ? '(leave blank to keep current)' : '*'}</label>
          <input class="form-input" id="prov-key" type="password" placeholder="${isEdit ? '••••••••' : 'sk-...'}" ${isEdit ? '' : 'required'} />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" id="modal-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close handlers
  const close = () => overlay.remove();
  document.getElementById('modal-close').addEventListener('click', close);
  document.getElementById('modal-cancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Submit
  document.getElementById('provider-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      name: document.getElementById('prov-name').value.trim(),
      base_url: document.getElementById('prov-url').value.trim() || 'https://openrouter.ai/api/v1',
    };
    const key = document.getElementById('prov-key').value.trim();
    if (key) body.api_key = key;

    if (!body.name) { toast('Name is required', 'error'); return; }
    if (!isEdit && !key) { toast('API key is required', 'error'); return; }

    try {
      if (isEdit) {
        await providers.update(editId, body);
        toast('Provider updated!', 'success');
      } else {
        await providers.create(body);
        toast('Provider created!', 'success');
      }
      close();
      loadProviders();
    } catch (err) {
      toast(err.message, 'error');
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
