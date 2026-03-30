// ═══════════════════════════════════════════════
//  CordBridge — Lorebooks Page
// ═══════════════════════════════════════════════

import { lorebooks } from '../api.js';
import { toast } from '../toast.js';

export function destroy() {}

export async function render(container) {
  let lorebookList = [];

  try {
    lorebookList = await lorebooks.list();
  } catch (err) {
    container.innerHTML = `<div class="page"><p style="color:var(--danger)">Error loading lorebooks: ${err.message}</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="page" style="max-width: 760px;">
      <div class="page-header">
        <h1>📚 Lorebooks</h1>
      </div>

      <div class="card" style="margin-bottom: 1.5rem;">
        <h3 style="margin-bottom: 1rem;">Upload Lorebook</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
          Upload a SillyTavern-format world_info JSON file. The file must contain an <code>entries</code> object.
        </p>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <input class="form-input" id="lb-file" type="file" accept=".json" style="flex: 1;" />
          <button type="button" class="btn btn-primary" id="upload-lb-btn">📤 Upload</button>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-bottom: 1rem;">Uploaded Lorebooks</h3>
        <div id="lb-list"></div>
      </div>
    </div>
  `;

  const lbListEl = document.getElementById('lb-list');
  const fileInput = document.getElementById('lb-file');
  const uploadBtn = document.getElementById('upload-lb-btn');

  function renderList() {
    if (lorebookList.length === 0) {
      lbListEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No lorebooks uploaded yet.</p>';
      return;
    }

    lbListEl.innerHTML = lorebookList.map(lb => `
      <div class="lb-row" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 0.5rem;">
        <div>
          <strong>${escapeHtml(lb.name)}</strong>
          <span style="color: var(--text-secondary); font-size: 0.85rem; margin-left: 0.75rem;">${lb.entry_count || 0} entries</span>
        </div>
        <button type="button" class="btn btn-danger btn-sm" data-delete-lb="${lb.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">🗑 Delete</button>
      </div>
    `).join('');

    // Attach delete handlers
    lbListEl.querySelectorAll('[data-delete-lb]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.deleteLb);
        const lb = lorebookList.find(l => l.id === id);
        if (!confirm(`Delete lorebook "${lb?.name}"? This will also remove it from all bots.`)) return;
        try {
          await lorebooks.delete(id);
          lorebookList = lorebookList.filter(l => l.id !== id);
          renderList();
          toast('Lorebook deleted', 'success');
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
  }
  renderList();

  uploadBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) return toast('Please select a JSON file first', 'error');

    try {
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Uploading…';

      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.entries) {
        throw new Error('File must contain an "entries" object');
      }

      // Use the lorebook name from JSON, or fall back to filename
      const name = parsed.name || file.name.replace(/\.json$/i, '');

      const result = await lorebooks.create({ name, data: text });
      const entryCount = Object.keys(parsed.entries).length;
      lorebookList.push({ id: result.id, name: result.name, entry_count: entryCount });
      renderList();
      fileInput.value = '';
      toast(`Lorebook "${result.name}" uploaded (${entryCount} entries)`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = '📤 Upload';
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
