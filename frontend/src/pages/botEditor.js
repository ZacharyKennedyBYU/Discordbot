// ═══════════════════════════════════════════════
//  CordBridge — Bot Editor Page
// ═══════════════════════════════════════════════

import { bots, providers, upload, lorebooks } from '../api.js';
import { toast } from '../toast.js';

export function destroy() {}

export async function render(container, botId) {
  const isNew = botId === 'new';
  let bot = null;
  let providerList = [];
  let allLorebooks = [];
  let attachedLorebooks = [];

  try {
    providerList = await providers.list();
    allLorebooks = await lorebooks.list();
    if (!isNew) {
      bot = await bots.get(parseInt(botId));
      attachedLorebooks = await bots.getLorebooks(parseInt(botId));
    }
  } catch (err) {
    container.innerHTML = `<div class="page"><p style="color:var(--danger)">Error loading data: ${err.message}</p></div>`;
    return;
  }

  const title = isNew ? 'Create New Bot' : `Edit — ${escapeHtml(bot.name)}`;

  function parseAllowedGuilds(jsonStr) {
    if (!jsonStr) return "";
    try {
      const arr = JSON.parse(jsonStr);
      if (Array.isArray(arr)) return arr.join(', ');
    } catch (_) {}
    return "";
  }

  function parseStringArray(jsonStr) {
    if (!jsonStr) return "";
    try {
      const arr = JSON.parse(jsonStr);
      if (Array.isArray(arr)) return arr.join(', ');
    } catch (_) {}
    return "";
  }

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
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" for="bot-type">Bot Type</label>
            <select class="form-select" id="bot-type">
              <option value="real" ${bot?.bot_type !== 'false' ? 'selected' : ''}>Real AI Bot</option>
              <option value="false" ${bot?.bot_type === 'false' ? 'selected' : ''}>False Bot (Random Phrases)</option>
            </select>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" for="bot-allowed-guilds">Allowed Server IDs (Comma separated, leave empty for all servers)</label>
            <input class="form-input" id="bot-allowed-guilds" type="text" placeholder="1234567890, 0987654321" value="${escapeAttr(parseStringArray(bot?.allowed_guilds))}" />
          </div>
        </div>

        <!-- AI Provider -->
        <div class="card" id="ai-config-card" style="margin-bottom: 1.5rem;">
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
              <input class="form-input" id="bot-model" type="text" list="bot-model-list" placeholder="deepseek/deepseek-v3.2" value="${escapeAttr(bot?.model || 'deepseek/deepseek-v3.2')}" autocomplete="off" />
              <datalist id="bot-model-list"></datalist>
            </div>
            <div class="form-group" id="use-chat-vision-group" style="display: none; margin-top: -0.5rem; margin-bottom: 1rem;">
              <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); cursor: pointer;">
                <input type="checkbox" id="use-chat-vision" ${bot?.use_chat_vision ? 'checked' : ''} style="width: 16px; height: 16px; margin: 0; cursor: pointer;" />
                Use this chat model natively for reading images 👓
              </label>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-vision-provider">Vision Provider (Optional)</label>
              <select class="form-select" id="bot-vision-provider">
                <option value="">— Same as Chat Provider —</option>
                ${providerList.map(p => `
                  <option value="${p.id}" ${bot?.vision_provider_id === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-vision-model">Vision Model ID (Optional)</label>
              <input class="form-input" id="bot-vision-model" type="text" list="bot-vision-model-list" placeholder="openai/gpt-4o-mini" value="${escapeAttr(bot?.vision_model || '')}" autocomplete="off" />
              <datalist id="bot-vision-model-list"></datalist>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Used to read images attached to messages or replied-to messages.</p>
            </div>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" for="bot-providers-order">OpenRouter Providers (Optional, Comma separated)</label>
            <input class="form-input" id="bot-providers-order" type="text" placeholder="Anthropic, Google, Together" value="${escapeAttr(parseStringArray(bot?.providers_order))}" />
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Prefers these OpenRouter providers in order while still allowing fallback when one fails.</p>
          </div>
        </div>

        <!-- Prompts -->
        <div class="card" id="prompts-card" style="margin-bottom: 1.5rem;">
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
            <label class="form-label" for="bot-examples">Example Messages</label>
            <textarea class="form-textarea" id="bot-examples" rows="4" placeholder="Example messages showing how this character talks. Used as tone/style reference only...">${escapeHtml(bot?.example_messages)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-prefill">Prefill (Assistant Start)</label>
            <textarea class="form-textarea" id="bot-prefill" rows="2" placeholder="Optional starting text...">${escapeHtml(bot?.prefill)}</textarea>
          </div>
        </div>

        <!-- Lorebooks -->
        <div class="card" id="lorebooks-card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">📚 Lorebooks</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">Attach world info lorebooks. Each entry can be ☀️ always on, 🌙 on when mentioned, or ✖ off.</p>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;" id="lb-attach-row">
            <select class="form-select" id="lb-attach-select" style="flex: 1;">
              <option value="">— Select a lorebook to attach —</option>
            </select>
            <button type="button" class="btn btn-primary" id="lb-attach-btn">Attach</button>
          </div>
          <div id="attached-lorebooks"></div>
        </div>

        <!-- Parameters -->
        <div class="card" id="params-card" style="margin-bottom: 1.5rem;">
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

        <!-- False Bot Phrases -->
        <div class="card" id="false-phrases-card" style="margin-bottom: 1.5rem; display: none;">
          <h3 style="margin-bottom: 1rem;">False Bot Phrases</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">These phrases will be randomly selected when the bot is mentioned or replied to.</p>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
            <input class="form-input" id="new-phrase-input" type="text" placeholder="Add a new text phrase..." style="flex: 1;" autocomplete="off" />
            <button type="button" class="btn btn-primary" id="add-phrase-btn">Add Text</button>
          </div>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
            <input class="form-input" id="new-audio-input" type="file" accept="audio/*" style="flex: 1;" />
            <button type="button" class="btn btn-ghost" style="border: 1px solid var(--border);" id="add-audio-btn">Upload MP3</button>
          </div>
          <ul id="phrases-list" style="list-style: none; padding: 0; margin: 0; border: 1px solid var(--border); border-radius: var(--radius); max-height: 250px; overflow-y: auto;">
          </ul>
        </div>

        <!-- Admin & Auto-start -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Admin & Settings</h3>
          
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
            <div>
              <p style="font-weight: bold; margin: 0;">Auto-Start</p>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">Automatically start this bot when CordBridge launches.</p>
            </div>
            <label class="toggle">
              <input type="checkbox" id="bot-autostart" ${bot?.auto_start ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <p style="font-weight: bold; margin: 0;">Log Retention (Days)</p>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">Detailed debugging logs are kept this many days. Set to 0 to keep forever.</p>
            </div>
            <input class="form-input" id="bot-log-retention" type="number" min="0" value="${bot?.log_retention_days ?? 7}" style="max-width: 80px;" />
          </div>
        </div>

        <!-- Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; gap: 0.75rem;">
            ${!isNew ? `<button type="button" class="btn btn-ghost" id="view-memory-btn">Memory</button>` : ''}
            ${!isNew ? `<button type="button" class="btn btn-ghost" id="view-logs-btn">📋 View Logs</button>` : ''}
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

  // ── False Bot Logic ──
  const botTypeSelect = document.getElementById('bot-type');
  const aiConfigCard = document.getElementById('ai-config-card');
  const promptsCard = document.getElementById('prompts-card');
  const paramsCard = document.getElementById('params-card');
  const falsePhrasesCard = document.getElementById('false-phrases-card');
  const lorebooksCard = document.getElementById('lorebooks-card');
  
  let falsePhrases = [];
  try {
    if (bot && bot.false_phrases) {
      falsePhrases = JSON.parse(bot.false_phrases || '[]');
    }
  } catch(e) {}

  function updateTypeVisibility() {
    const isFalse = botTypeSelect.value === 'false';
    if (aiConfigCard) aiConfigCard.style.display = isFalse ? 'none' : 'block';
    if (promptsCard) promptsCard.style.display = isFalse ? 'none' : 'block';
    if (paramsCard) paramsCard.style.display = isFalse ? 'none' : 'block';
    if (lorebooksCard) lorebooksCard.style.display = isFalse ? 'none' : 'block';
    if (falsePhrasesCard) falsePhrasesCard.style.display = isFalse ? 'block' : 'none';
  }
  
  botTypeSelect.addEventListener('change', updateTypeVisibility);
  updateTypeVisibility();

  // ── Lorebook Logic ──
  const lbAttachSelect = document.getElementById('lb-attach-select');
  const lbAttachBtn = document.getElementById('lb-attach-btn');
  const attachedLbContainer = document.getElementById('attached-lorebooks');

  // Track overrides per lorebook_id
  let lorebookOverrides = {};
  for (const alb of attachedLorebooks) {
    try {
      lorebookOverrides[alb.lorebook_id] = typeof alb.overrides === 'string' ? JSON.parse(alb.overrides || '{}') : (alb.overrides || {});
    } catch(e) {
      lorebookOverrides[alb.lorebook_id] = {};
    }
  }

  function populateLbSelect() {
    lbAttachSelect.innerHTML = '<option value="">— Select a lorebook to attach —</option>';
    const attachedIds = attachedLorebooks.map(a => a.lorebook_id);
    const available = allLorebooks.filter(lb => !attachedIds.includes(lb.id));
    available.forEach(lb => {
      const opt = document.createElement('option');
      opt.value = lb.id;
      opt.textContent = `${lb.name} (${lb.entry_count || 0} entries)`;
      lbAttachSelect.appendChild(opt);
    });
  }
  populateLbSelect();

  function getStateIcon(state) {
    if (state === 'sun') return '☀️';
    if (state === 'off') return '✖';
    return '🌙';
  }

  function nextState(current) {
    if (current === 'moon') return 'sun';
    if (current === 'sun') return 'off';
    return 'moon';
  }

  function renderAttachedLorebooks() {
    if (attachedLorebooks.length === 0) {
      attachedLbContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No lorebooks attached.</p>';
      return;
    }

    attachedLbContainer.innerHTML = attachedLorebooks.map(alb => {
      let entries = [];
      try {
        const parsed = typeof alb.data === 'string' ? JSON.parse(alb.data) : alb.data;
        if (parsed.entries) entries = Object.entries(parsed.entries);
      } catch(e) {}

      const overrides = lorebookOverrides[alb.lorebook_id] || {};

      return `
        <div class="lb-attached-item" data-lbid="${alb.lorebook_id}">
          <div class="lb-attached-header">
            <div style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;" class="lb-toggle-expand">
              <span class="lb-expand-arrow">▶</span>
              <strong>${escapeHtml(alb.name)}</strong>
              <span style="color: var(--text-secondary); font-size: 0.85rem;">${entries.length} entries</span>
            </div>
            <button type="button" class="btn btn-ghost" data-detach-lb="${alb.lorebook_id}" style="padding: 0.25rem 0.5rem; color: var(--danger); font-size: 0.8rem;">Detach</button>
          </div>
          <div class="lb-entries-list" style="display: none;">
            ${entries.map(([uid, entry]) => {
              const state = overrides[uid] || 'moon';
              const name = entry.comment || entry.name || `Entry ${uid}`;
              const keys = (Array.isArray(entry.key) ? entry.key : (entry.keys || [])).join(', ');
              return `
                <div class="lb-entry-row">
                  <button type="button" class="lb-state-btn" data-lbid="${alb.lorebook_id}" data-uid="${uid}" data-state="${state}" title="Click to cycle: 🌙 mentioned → ☀️ always → ✖ off">
                    ${getStateIcon(state)}
                  </button>
                  <div class="lb-entry-info">
                    <span class="lb-entry-name">${escapeHtml(name)}</span>
                    <span class="lb-entry-keys">${escapeHtml(keys)}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Wire up expand/collapse
    attachedLbContainer.querySelectorAll('.lb-toggle-expand').forEach(el => {
      el.addEventListener('click', () => {
        const item = el.closest('.lb-attached-item');
        const list = item.querySelector('.lb-entries-list');
        const arrow = item.querySelector('.lb-expand-arrow');
        const isVisible = list.style.display !== 'none';
        list.style.display = isVisible ? 'none' : 'block';
        arrow.textContent = isVisible ? '▶' : '▼';
      });
    });

    // Wire up state toggle buttons
    attachedLbContainer.querySelectorAll('.lb-state-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lbid = btn.dataset.lbid;
        const uid = btn.dataset.uid;
        const current = btn.dataset.state;
        const next = nextState(current);
        btn.dataset.state = next;
        btn.textContent = getStateIcon(next);
        if (!lorebookOverrides[lbid]) lorebookOverrides[lbid] = {};
        lorebookOverrides[lbid][uid] = next;
      });
    });

    // Wire up detach buttons
    attachedLbContainer.querySelectorAll('[data-detach-lb]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const lbid = parseInt(btn.dataset.detachLb);
        const lb = attachedLorebooks.find(a => a.lorebook_id === lbid);
        if (!confirm(`Detach lorebook "${lb?.name}" from this bot?`)) return;
        try {
          if (!isNew) await bots.detachLorebook(parseInt(botId), lbid);
          attachedLorebooks = attachedLorebooks.filter(a => a.lorebook_id !== lbid);
          delete lorebookOverrides[lbid];
          renderAttachedLorebooks();
          populateLbSelect();
          toast('Lorebook detached', 'success');
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
  }
  renderAttachedLorebooks();

  lbAttachBtn.addEventListener('click', async () => {
    const lbId = parseInt(lbAttachSelect.value);
    if (!lbId) return toast('Select a lorebook first', 'error');
    try {
      if (!isNew) {
        await bots.attachLorebook(parseInt(botId), lbId);
      }
      // Fetch full lorebook data for display
      const fullLb = await lorebooks.get(lbId);
      const lbMeta = allLorebooks.find(l => l.id === lbId);
      attachedLorebooks.push({
        lorebook_id: lbId,
        name: lbMeta?.name || fullLb.name,
        data: fullLb.data,
        overrides: '{}'
      });
      lorebookOverrides[lbId] = {};
      renderAttachedLorebooks();
      populateLbSelect();
      toast('Lorebook attached', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  // Render phrases list
  const phrasesListEl = document.getElementById('phrases-list');
  const newPhraseInput = document.getElementById('new-phrase-input');
  const addPhraseBtn = document.getElementById('add-phrase-btn');
  const newAudioInput = document.getElementById('new-audio-input');
  const addAudioBtn = document.getElementById('add-audio-btn');

  function renderPhrases() {
    phrasesListEl.innerHTML = '';
    if (falsePhrases.length === 0) {
      phrasesListEl.innerHTML = '<li style="padding: 0.75rem; text-align: center; color: var(--text-secondary);">No phrases added yet.</li>';
      return;
    }
    falsePhrases.forEach((phrase, index) => {
      const li = document.createElement('li');
      li.style.cssText = 'padding: 0.75rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;';
      const textSpan = document.createElement('span');
      textSpan.style.wordBreak = 'break-word';

      if (typeof phrase === 'string') {
        textSpan.textContent = phrase;
      } else if (phrase.type === 'audio') {
        textSpan.innerHTML = `🎵 <strong>Audio:</strong> ${escapeHtml(phrase.originalName || 'response.mp3')}`;
      }

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-ghost';
      delBtn.style.padding = '0.25rem 0.5rem';
      delBtn.style.color = 'var(--danger)';
      delBtn.textContent = '✖';
      delBtn.onclick = () => {
        falsePhrases.splice(index, 1);
        renderPhrases();
      };
      li.appendChild(textSpan);
      li.appendChild(delBtn);
      phrasesListEl.appendChild(li);
    });
  }
  renderPhrases();

  addPhraseBtn.addEventListener('click', () => {
    const val = newPhraseInput.value.trim();
    if (val) {
      falsePhrases.push(val);
      newPhraseInput.value = '';
      renderPhrases();
    }
  });
  newPhraseInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPhraseBtn.click();
    }
  });

  addAudioBtn.addEventListener('click', async () => {
    const file = newAudioInput.files[0];
    if (!file) return toast('Please select a file first', 'error');

    try {
      addAudioBtn.disabled = true;
      addAudioBtn.textContent = 'Uploading...';
      const res = await upload(file);
      falsePhrases.push({
        type: 'audio',
        path: res.path,
        originalName: res.originalname
      });
      newAudioInput.value = '';
      renderPhrases();
      toast('Audio uploaded successfully', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      addAudioBtn.disabled = false;
      addAudioBtn.textContent = 'Upload MP3';
    }
  });

  // ── Dynamic Model Lists ──
  const providerSelect = document.getElementById('bot-provider');
  const visionProviderSelect = document.getElementById('bot-vision-provider');
  const botModelInput = document.getElementById('bot-model');
  const useChatVisionGroup = document.getElementById('use-chat-vision-group');
  const useChatVisionCheckbox = document.getElementById('use-chat-vision');

  let currentChatModels = [];

  function checkChatVisionSupport(modelId) {
    if (!currentChatModels || currentChatModels.length === 0) return false;
    const found = currentChatModels.find(m => m.id === modelId);
    if (!found || !found.architecture) return false;
    
    const instructs = found.architecture.instruct_type || '';
    const modalities = found.architecture.modality || '';
    const inputModes = Array.isArray(found.architecture.input_modalities) ? found.architecture.input_modalities.join(',') : '';

    return modalities.includes('image') || inputModes.includes('image');
  }

  function updateVisionCheckboxVisibility() {
    const val = botModelInput.value.trim();
    if (checkChatVisionSupport(val)) {
      useChatVisionGroup.style.display = 'block';
    } else {
      useChatVisionGroup.style.display = 'none';
      if (useChatVisionCheckbox) useChatVisionCheckbox.checked = false;
    }
  }

  botModelInput.addEventListener('input', updateVisionCheckboxVisibility);
  botModelInput.addEventListener('change', updateVisionCheckboxVisibility);

  async function loadModels(providerId, datalistId) {
    const datalist = document.getElementById(datalistId);
    datalist.innerHTML = '';
    if (!providerId) return;
    try {
      const resp = await providers.getModels(providerId);
      // Provider APIs usually return { data: [ { id, name }, ... ] }
      if (resp && resp.data && Array.isArray(resp.data)) {
        if (datalistId === 'bot-model-list') {
          currentChatModels = resp.data;
        }

        resp.data.forEach(model => {
          const opt = document.createElement('option');
          opt.value = model.id;
          
          let dispName = (model.name && model.name !== model.id) ? model.name : '';
          
          // Native Vision checking to append 👓
          const isVision = datalistId === 'bot-model-list' && (
            (model.architecture && model.architecture.modality && model.architecture.modality.includes('image')) ||
            (model.architecture && Array.isArray(model.architecture.input_modalities) && model.architecture.input_modalities.includes('image'))
          );
          
          if (isVision) dispName += ' 👓';

          if (dispName) opt.textContent = dispName;
          datalist.appendChild(opt);
        });

        if (datalistId === 'bot-model-list') {
          updateVisionCheckboxVisibility();
        }
      }
    } catch (err) {
      console.error('Failed to load models:', err);
    }
  }

  providerSelect.addEventListener('change', () => {
    loadModels(providerSelect.value, 'bot-model-list');
    if (!visionProviderSelect.value) {
      // If vision provider is "Same as Chat Provider", update its list too
      loadModels(providerSelect.value, 'bot-vision-model-list');
    }
  });

  visionProviderSelect.addEventListener('change', () => {
    loadModels(visionProviderSelect.value || providerSelect.value, 'bot-vision-model-list');
  });

  // Initial load
  if (providerSelect.value) {
    loadModels(providerSelect.value, 'bot-model-list');
  }
  if (visionProviderSelect.value || providerSelect.value) {
    loadModels(visionProviderSelect.value || providerSelect.value, 'bot-vision-model-list');
  }

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

  // ── Modals & Dialogs ──
  if (!isNew) {
    const dialogsContainer = document.createElement('div');
    container.appendChild(dialogsContainer);
    dialogsContainer.innerHTML = `
      <dialog id="memory-dialog" class="inspector-dialog">
        <div class="inspector-shell">
          <div class="inspector-header">
            <div>
              <h3>Memory</h3>
              <p class="inspector-subtitle">Durable summary and recent saved messages for this bot.</p>
            </div>
            <button type="button" class="btn btn-ghost" onclick="document.getElementById('memory-dialog').close()">Close</button>
          </div>
          <div class="inspector-toolbar">
            <select id="memory-server-select" class="form-select">
              <option value="">Select a server</option>
            </select>
            <button type="button" class="btn btn-primary" id="refresh-memory-btn">Refresh</button>
          </div>
          <div class="memory-layout">
            <section class="memory-editor">
              <div class="memory-editor-header">
                <div>
                  <h4>Durable Summary</h4>
                  <span id="memory-stats" class="log-muted">No memory loaded.</span>
                </div>
                <button type="button" class="btn btn-success" id="save-memory-btn">Save Summary</button>
              </div>
              <textarea class="form-textarea memory-textarea" id="memory-summary-text" placeholder="No durable summary yet. Add one here or let conversation compression create it."></textarea>
            </section>
            <section class="memory-recent">
              <h4>Recent Saved Messages</h4>
              <div id="memory-messages-list" class="memory-messages-list">Select a server to inspect memory.</div>
            </section>
          </div>
        </div>
      </dialog>

      <dialog id="clear-history-dialog" class="card" style="padding: 1.5rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); max-width: 400px; width: 90%; margin: auto; color: var(--text);">
        <h3 style="margin-top: 0; margin-bottom: 0.5rem;">Clear Conversation History</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">Select a server to clear memory from.</p>
        <select id="clear-history-select" class="form-select" style="margin-bottom: 1.5rem;"></select>
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button type="button" class="btn btn-ghost" onclick="document.getElementById('clear-history-dialog').close()">Cancel</button>
          <button type="button" class="btn btn-danger" id="confirm-clear-history-btn">Clear</button>
        </div>
      </dialog>

      <dialog id="view-logs-dialog" class="inspector-dialog">
        <div class="inspector-shell">
          <div class="inspector-header">
            <div>
              <h3>Debug Logs</h3>
              <p class="inspector-subtitle">Grouped request timeline, retries, token counts, and response metadata.</p>
            </div>
            <button type="button" class="btn btn-ghost" onclick="document.getElementById('view-logs-dialog').close()">✖</button>
          </div>
          <div class="inspector-toolbar">
            <select id="view-logs-select" class="form-select">
              <option value="">— Select a Server —</option>
            </select>
            <button type="button" class="btn btn-primary" id="refresh-logs-btn">Refresh</button>
          </div>
          <div id="logs-container" class="logs-container">
            Select a server to view logs.
          </div>
        </div>
      </dialog>
    `;

    // ── Clear History Logic ──
    const memoryDialog = document.getElementById('memory-dialog');
    const memoryServerSelect = document.getElementById('memory-server-select');
    const memorySummaryText = document.getElementById('memory-summary-text');
    const memoryStats = document.getElementById('memory-stats');
    const memoryMessagesList = document.getElementById('memory-messages-list');
    const clearHistoryDialog = document.getElementById('clear-history-dialog');
    const clearHistorySelect = document.getElementById('clear-history-select');

    const loadMemoryServers = async () => {
      const servers = await bots.getHistory(bot.id);
      const choices = servers && servers.length > 0 ? servers : [{ guild_id: 'DM', message_count: 0 }];
      memoryServerSelect.innerHTML = `<option value="">Select a server</option>` +
        choices.map(s => `<option value="${escapeAttr(s.guild_id || 'DM')}">${serverLabel(s.guild_id)} (${s.message_count || 0} messages)</option>`).join('');
      if (!memoryServerSelect.value && choices.length > 0) memoryServerSelect.value = choices[0].guild_id || 'DM';
    };

    const loadMemory = async () => {
      const guildId = memoryServerSelect.value;
      if (!guildId) {
        memoryStats.textContent = 'Select a server.';
        memoryMessagesList.innerHTML = 'Select a server to inspect memory.';
        return;
      }
      memoryStats.textContent = 'Loading...';
      memoryMessagesList.innerHTML = 'Loading messages...';
      try {
        const memory = await bots.getMemory(bot.id, guildId);
        memorySummaryText.value = memory.summary || '';
        memoryStats.textContent = `${memory.stats?.conversation_count || 0} saved messages, ${memory.stats?.summary_count || 0} summary block${memory.stats?.summary_count === 1 ? '' : 's'}`;
        memoryMessagesList.innerHTML = renderMemoryMessages(memory.recent_messages || []);
      } catch (err) {
        memoryStats.textContent = 'Failed to load memory.';
        memoryMessagesList.innerHTML = `<span class="log-error">Error loading memory: ${escapeHtml(err.message)}</span>`;
      }
    };

    document.getElementById('view-memory-btn').addEventListener('click', async () => {
      try {
        await loadMemoryServers();
        await loadMemory();
        memoryDialog.showModal();
      } catch (err) {
        toast(err.message, 'error');
      }
    });

    memoryServerSelect.addEventListener('change', loadMemory);
    document.getElementById('refresh-memory-btn').addEventListener('click', loadMemory);
    document.getElementById('save-memory-btn').addEventListener('click', async () => {
      const guildId = memoryServerSelect.value;
      if (!guildId) return toast('Select a server first', 'error');
      try {
        await bots.saveMemory(bot.id, guildId, memorySummaryText.value);
        toast('Memory summary saved', 'success');
        await loadMemory();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    
    document.getElementById('clear-history-btn').addEventListener('click', async () => {
      try {
        const servers = await bots.getHistory(bot.id);
        if (!servers || servers.length === 0) {
          toast('No conversation history to clear', 'info');
          return;
        }

        clearHistorySelect.innerHTML = `<option value="all">🧹 Everything (All Servers & DMs)</option>` + 
          servers.map(s => {
            const label = s.guild_id === 'DM' || !s.guild_id ? 'Direct Messages' : `Server ${s.guild_id}`;
            return `<option value="${s.guild_id}">${label} (${s.message_count} messages)</option>`;
          }).join('');

        clearHistoryDialog.showModal();
      } catch (err) {
        toast(err.message, 'error');
      }
    });

    document.getElementById('confirm-clear-history-btn').addEventListener('click', async () => {
      const choice = clearHistorySelect.value;
      try {
        let result;
        if (choice === 'all') {
          if (!confirm(`Clear ALL conversation history for "${bot.name}" across all servers?`)) return;
          result = await bots.clearHistory(bot.id);
        } else {
          result = await bots.clearHistory(bot.id, choice);
        }
        toast(`History cleared (${result.messagesRemoved} messages removed)`, 'success');
        clearHistoryDialog.close();
      } catch (err) {
        toast(err.message, 'error');
      }
    });

    // ── View Logs Logic ──
    const viewLogsDialog = document.getElementById('view-logs-dialog');
    const viewLogsSelect = document.getElementById('view-logs-select');
    const logsContainer = document.getElementById('logs-container');

    const loadLogServers = async () => {
      try {
        const servers = await bots.getLogServers(bot.id);
        viewLogsSelect.innerHTML = `<option value="">— Select a Server —</option>` + 
          servers.map(s => `<option value="${escapeAttr(s.guild_id || 'DM')}">${serverLabel(s.guild_id)}</option>`).join('');
      } catch (err) {
        toast('Failed to load log servers: ' + err.message, 'error');
      }
    };

    const loadLogs = async () => {
      const guildId = viewLogsSelect.value;
      if (!guildId) {
        logsContainer.innerHTML = 'Please select a server.';
        return;
      }
      logsContainer.innerHTML = 'Loading logs...';
      try {
        const logs = await bots.getLogs(bot.id, guildId);
        if (!logs || logs.length === 0) {
          logsContainer.innerHTML = 'No logs found.';
          return;
        }
        logsContainer.innerHTML = renderLogGroups(logs);
      } catch (err) {
        logsContainer.innerHTML = `<span class="log-error">Error loading logs: ${escapeHtml(err.message)}</span>`;
      }
    };

    document.getElementById('view-logs-btn').addEventListener('click', async () => {
      await loadLogServers();
      logsContainer.innerHTML = 'Select a server to view logs...';
      viewLogsDialog.showModal();
    });

    viewLogsSelect.addEventListener('change', loadLogs);
    document.getElementById('refresh-logs-btn').addEventListener('click', loadLogs);
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

    const readNumber = (id, fallback, parser = Number.parseFloat) => {
      const value = parser(document.getElementById(id).value, 10);
      return Number.isFinite(value) ? value : fallback;
    };

    const body = {
      name: document.getElementById('bot-name').value.trim(),
      model: document.getElementById('bot-model').value.trim(),
      vision_model: document.getElementById('bot-vision-model').value.trim(),
      use_chat_vision: document.getElementById('use-chat-vision')?.checked || false,
      provider_id: parseInt(document.getElementById('bot-provider').value) || null,
      vision_provider_id: parseInt(document.getElementById('bot-vision-provider').value) || null,
      bot_type: document.getElementById('bot-type').value,
      false_phrases: JSON.stringify(falsePhrases),
      system_prompt: document.getElementById('bot-system').value,
      character_prompt: document.getElementById('bot-character').value,
      first_message: document.getElementById('bot-first-msg').value,
      example_messages: document.getElementById('bot-examples').value,
      prefill: document.getElementById('bot-prefill').value,
      temperature: readNumber('bot-temp', 0.9),
      top_p: readNumber('bot-topp', 0.9),
      max_tokens: readNumber('bot-max-tokens', 300, Number.parseInt),
      max_prompt_tokens: readNumber('bot-max-prompt', 10000, Number.parseInt),
      presence_penalty: readNumber('bot-pp', 0),
      frequency_penalty: readNumber('bot-fp', 0),
      auto_start: document.getElementById('bot-autostart').checked,
      log_retention_days: readNumber('bot-log-retention', 7, Number.parseInt),
      allowed_guilds: JSON.stringify(document.getElementById('bot-allowed-guilds').value.split(',').map(s => s.trim()).filter(s => s)),
      providers_order: JSON.stringify(document.getElementById('bot-providers-order').value.split(',').map(s => s.trim()).filter(s => s)),
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
        const created = await bots.create(body);
        // Attach lorebooks to the newly created bot
        for (const alb of attachedLorebooks) {
          try {
            await bots.attachLorebook(created.id, alb.lorebook_id);
            const ovr = lorebookOverrides[alb.lorebook_id];
            if (ovr && Object.keys(ovr).length > 0) {
              await bots.updateLorebook(created.id, alb.lorebook_id, ovr);
            }
          } catch(e) { console.error('Failed to attach lorebook:', e); }
        }
        toast('Bot created!', 'success');
      } else {
        await bots.update(bot.id, body);
        // Save lorebook overrides
        for (const alb of attachedLorebooks) {
          const ovr = lorebookOverrides[alb.lorebook_id];
          if (ovr) {
            try {
              await bots.updateLorebook(bot.id, alb.lorebook_id, ovr);
            } catch(e) { console.error('Failed to save lorebook overrides:', e); }
          }
        }
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

function serverLabel(guildId) {
  return guildId === 'DM' || !guildId ? 'Direct Messages' : `Server ${guildId}`;
}

function formatDate(value) {
  if (!value) return 'Unknown time';
  return new Date(`${value}Z`).toLocaleString();
}

function formatNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString() : 'n/a';
}

function contentObject(log) {
  return log && typeof log.content === 'object' && log.content !== null ? log.content : {};
}

function renderMemoryMessages(messages) {
  if (!messages || messages.length === 0) {
    return '<div class="inspector-empty">No saved conversation messages for this scope.</div>';
  }

  return messages.map(message => `
    <div class="memory-message ${escapeAttr(message.role)}">
      <div class="memory-message-meta">
        <span class="role-pill ${escapeAttr(message.role)}">${escapeHtml(message.role)}</span>
        <span>${formatDate(message.created_at)}</span>
      </div>
      <div class="memory-message-content">${escapeHtml(message.content)}</div>
    </div>
  `).join('');
}

function renderLogGroups(logs) {
  const groups = groupLogs(logs);
  if (groups.length === 0) return '<div class="inspector-empty">No logs found.</div>';
  return groups.map(renderLogGroup).join('');
}

function groupLogs(logs) {
  const sorted = [...logs].sort((a, b) => a.id - b.id);
  const byKey = new Map();
  let legacyIndex = 0;

  for (const log of sorted) {
    const content = contentObject(log);
    let key = content.requestId;
    if (!key) {
      if (log.type === 'context_built' || log.type === 'api_request') legacyIndex += 1;
      key = `legacy-${legacyIndex || log.id}`;
    }

    if (!byKey.has(key)) {
      byKey.set(key, { key, logs: [], firstId: log.id, lastId: log.id });
    }
    const group = byKey.get(key);
    group.logs.push(log);
    group.firstId = Math.min(group.firstId, log.id);
    group.lastId = Math.max(group.lastId, log.id);
  }

  return [...byKey.values()].sort((a, b) => b.lastId - a.lastId);
}

function renderLogGroup(group) {
  const logs = group.logs;
  const request = logs.find(log => log.type === 'api_request');
  const response = logs.find(log => log.type === 'api_response');
  const context = logs.find(log => log.type === 'context_built');
  const retries = logs.filter(log => log.type === 'api_retry');
  const requestContent = contentObject(request);
  const responseContent = contentObject(response);
  const contextContent = contentObject(context);
  const usage = responseContent.usage || {};
  const statusClass = response ? 'success' : (retries.length > 0 ? 'warning' : 'neutral');
  const statusText = response ? 'Completed' : (retries.length > 0 ? 'Retried' : 'Log Event');
  const title = requestContent.model || contextContent.channelId || logs[0].type;

  return `
    <article class="log-group">
      <div class="log-group-header">
        <div>
          <div class="log-group-title">${escapeHtml(title)}</div>
          <div class="log-muted">${formatDate(logs[logs.length - 1].created_at)}</div>
        </div>
        <span class="log-status ${statusClass}">${statusText}</span>
      </div>
      <div class="log-metrics">
        ${metricHtml('Prompt', requestContent.estimatedPromptTokens || contextContent.totalTokens)}
        ${metricHtml('Messages', requestContent.messageCount || contextContent.messageCount)}
        ${metricHtml('Output', usage.completion_tokens)}
        ${metricHtml('Response', responseContent.responseLength ? `${formatNumber(responseContent.responseLength)} chars` : null)}
        ${metricHtml('Retries', retries.length)}
        ${metricHtml('Images', requestContent.hasImages ? 'yes' : 'no')}
      </div>
      <div class="log-timeline">
        ${logs.map(renderLogEvent).join('')}
      </div>
    </article>
  `;
}

function metricHtml(label, value) {
  const shown = value === undefined || value === null || value === '' ? 'n/a' : value;
  return `<div class="log-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(shown))}</strong></div>`;
}

function renderLogEvent(log) {
  const content = contentObject(log);
  const summary = summarizeLogEvent(log.type, content);
  const raw = JSON.stringify(content, null, 2);
  return `
    <details class="log-event">
      <summary>
        <span class="log-event-type ${escapeAttr(log.type)}">${escapeHtml(log.type)}</span>
        <span>${escapeHtml(summary)}</span>
        <time>${formatDate(log.created_at)}</time>
      </summary>
      <pre>${escapeHtml(raw)}</pre>
    </details>
  `;
}

function summarizeLogEvent(type, content) {
  if (type === 'context_built') {
    return `${formatNumber(content.totalTokens)} estimated tokens across ${formatNumber(content.messageCount)} messages`;
  }
  if (type === 'api_request') {
    return `${content.model || 'model'} request, ${formatNumber(content.estimatedPromptTokens)} prompt tokens`;
  }
  if (type === 'api_retry') {
    return `${content.failedAttempt || 'attempt'} failed; retrying ${content.nextAttempt || 'next attempt'}`;
  }
  if (type === 'api_response') {
    const usage = content.usage || {};
    return `${content.finishReason || 'finished'}, ${formatNumber(content.responseLength)} chars, ${formatNumber(usage.total_tokens)} total tokens`;
  }
  return typeof content === 'string' ? content : 'Log entry';
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
