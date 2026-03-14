// ═══════════════════════════════════════════════
//  CordBridge — Bot Editor Page
// ═══════════════════════════════════════════════

import { bots, providers, upload } from '../api.js';
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
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" for="bot-type">Bot Type</label>
            <select class="form-select" id="bot-type">
              <option value="real" ${bot?.bot_type !== 'false' ? 'selected' : ''}>Real AI Bot</option>
              <option value="false" ${bot?.bot_type === 'false' ? 'selected' : ''}>False Bot (Random Phrases)</option>
            </select>
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

  // ── False Bot Logic ──
  const botTypeSelect = document.getElementById('bot-type');
  const aiConfigCard = document.getElementById('ai-config-card');
  const promptsCard = document.getElementById('prompts-card');
  const paramsCard = document.getElementById('params-card');
  const falsePhrasesCard = document.getElementById('false-phrases-card');
  
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
    if (falsePhrasesCard) falsePhrasesCard.style.display = isFalse ? 'block' : 'none';
  }
  
  botTypeSelect.addEventListener('change', updateTypeVisibility);
  updateTypeVisibility();

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

  // ── Clear History ──
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', async () => {
      try {
        const servers = await bots.getHistory(bot.id);
        if (!servers || servers.length === 0) {
          toast('No conversation history to clear', 'info');
          return;
        }

        // Build options list
        const options = servers.map(s => {
          const label = s.guild_id === 'DM' || !s.guild_id ? 'Direct Messages' : `Server ${s.guild_id}`;
          return `  • ${label} (${s.message_count} messages)`;
        }).join('\n');

        const choice = prompt(
          `Conversation history for "${bot.name}":\n\n${options}\n\n` +
          `Enter a server ID to clear just that server,\nor type "all" to clear everything:`
        );

        if (choice === null) return; // cancelled

        const trimmed = choice.trim();
        if (!trimmed) return;

        let result;
        if (trimmed.toLowerCase() === 'all') {
          if (!confirm(`Clear ALL conversation history for "${bot.name}" across all servers?`)) return;
          result = await bots.clearHistory(bot.id);
        } else {
          // Match against guild IDs (or "DM")
          const matchedServer = servers.find(s =>
            s.guild_id === trimmed || (trimmed.toLowerCase() === 'dm' && (!s.guild_id || s.guild_id === 'DM'))
          );
          if (!matchedServer) {
            toast('Server ID not found in history', 'error');
            return;
          }
          result = await bots.clearHistory(bot.id, matchedServer.guild_id);
        }
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
