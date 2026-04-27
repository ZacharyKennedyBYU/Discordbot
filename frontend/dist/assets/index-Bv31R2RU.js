(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))t(a);new MutationObserver(a=>{for(const m of a)if(m.type==="childList")for(const i of m.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&t(i)}).observe(document,{childList:!0,subtree:!0});function s(a){const m={};return a.integrity&&(m.integrity=a.integrity),a.referrerPolicy&&(m.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?m.credentials="include":a.crossOrigin==="anonymous"?m.credentials="omit":m.credentials="same-origin",m}function t(a){if(a.ep)return;a.ep=!0;const m=s(a);fetch(a.href,m)}})();const we="/api";async function y(e,o={}){const s=await fetch(`${we}${e}`,{headers:{"Content-Type":"application/json",...o.headers},...o}),t=await s.text();let a={};if(t)try{a=JSON.parse(t)}catch{a={error:t}}if(!s.ok)throw new Error(a.error||`Request failed (${s.status})`);return a}const Ae=async e=>{const o=new FormData;o.append("file",e);const s=await fetch(`${we}/upload`,{method:"POST",body:o}),t=await s.text();let a={};if(t)try{a=JSON.parse(t)}catch{a={error:t}}if(!s.ok)throw new Error(a.error||`Upload failed (${s.status})`);return a},O={list:()=>y("/providers"),get:e=>y(`/providers/${e}`),create:e=>y("/providers",{method:"POST",body:JSON.stringify(e)}),update:(e,o)=>y(`/providers/${e}`,{method:"PUT",body:JSON.stringify(o)}),delete:e=>y(`/providers/${e}`,{method:"DELETE"}),getModels:e=>y(`/providers/${e}/models`)},h={list:()=>y("/bots"),get:e=>y(`/bots/${e}`),create:e=>y("/bots",{method:"POST",body:JSON.stringify(e)}),update:(e,o)=>y(`/bots/${e}`,{method:"PUT",body:JSON.stringify(o)}),delete:e=>y(`/bots/${e}`,{method:"DELETE"}),start:e=>y(`/bots/${e}/start`,{method:"POST"}),stop:e=>y(`/bots/${e}/stop`,{method:"POST"}),getHistory:e=>y(`/bots/${e}/history`),clearHistory:(e,o)=>y(`/bots/${e}/history${o?`?guild_id=${encodeURIComponent(o)}`:""}`,{method:"DELETE"}),getMemory:(e,o)=>y(`/bots/${e}/memory${o?`?guild_id=${encodeURIComponent(o)}`:""}`),saveMemory:(e,o,s)=>y(`/bots/${e}/memory`,{method:"PUT",body:JSON.stringify({guild_id:o||"DM",summary:s})}),getLorebooks:e=>y(`/bots/${e}/lorebooks`),attachLorebook:(e,o)=>y(`/bots/${e}/lorebooks`,{method:"POST",body:JSON.stringify({lorebook_id:o})}),updateLorebook:(e,o,s)=>y(`/bots/${e}/lorebooks/${o}`,{method:"PUT",body:JSON.stringify({overrides:s})}),detachLorebook:(e,o)=>y(`/bots/${e}/lorebooks/${o}`,{method:"DELETE"}),getLogServers:e=>y(`/bots/${e}/log_servers`),getLogs:(e,o)=>y(`/bots/${e}/logs${o?`?guild_id=${encodeURIComponent(o)}`:""}`)},R={list:()=>y("/lorebooks"),get:e=>y(`/lorebooks/${e}`),create:e=>y("/lorebooks",{method:"POST",body:JSON.stringify(e)}),delete:e=>y(`/lorebooks/${e}`,{method:"DELETE"})},he={success:"✓",error:"✕",info:"ℹ"};function p(e,o="info",s=3500){const t=document.getElementById("toast-container"),a=document.createElement("div");a.className=`toast ${o}`,a.innerHTML=`
    <span class="toast-icon">${he[o]||he.info}</span>
    <span>${e}</span>
  `,t.appendChild(a),setTimeout(()=>{a.classList.add("fade-out"),a.addEventListener("animationend",()=>a.remove())},s)}let W=null;function Le(e){e.innerHTML=`
    <div class="page">
      <div class="page-header">
        <h1>🤖 Dashboard</h1>
        <button class="btn btn-primary" id="add-bot-btn">＋ New Bot</button>
      </div>
      <div id="bot-list" class="card-grid"></div>
    </div>
  `,document.getElementById("add-bot-btn").addEventListener("click",()=>{window.location.hash="#/bots/new"}),ae(),W=setInterval(ae,5e3)}function Ne(){W&&(clearInterval(W),W=null)}async function ae(){const e=document.getElementById("bot-list");if(e)try{const o=await h.list();if(o.length===0){e.innerHTML=`
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🤖</div>
          <p>No bots yet. Create your first bot to get started!</p>
          <button class="btn btn-primary" onclick="location.hash='#/bots/new'">＋ Create Bot</button>
        </div>
      `;return}e.innerHTML=o.map(s=>`
      <div class="card bot-card" data-bot-id="${s.id}">
        <div class="bot-card-header">
          <span class="bot-card-name">${se(s.name)}</span>
          <span class="status-badge ${s.online?"online":"offline"}">
            <span class="status-dot"></span>
            ${s.online?"Online":"Offline"}
          </span>
        </div>
        <div class="bot-card-meta">
          <div class="meta-row">
            <span class="meta-label">Model</span>
            <span>${se(s.model||"—")}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Provider</span>
            <span>${se(s.provider_name||"None")}</span>
          </div>
        </div>
        <div class="bot-card-actions">
          <button class="btn btn-sm ${s.online?"btn-danger":"btn-success"}" data-toggle-id="${s.id}">
            ${s.online?"⏹ Stop":"▶ Start"}
          </button>
          <button class="btn btn-sm btn-ghost" data-edit-id="${s.id}">✎ Edit</button>
        </div>
      </div>
    `).join(""),e.querySelectorAll("[data-toggle-id]").forEach(s=>{s.addEventListener("click",async t=>{t.stopPropagation();const a=parseInt(s.dataset.toggleId),m=o.find(i=>i.id===a);s.disabled=!0,s.textContent="…";try{m.online?(await h.stop(a),p(`"${m.name}" stopped`,"info")):(await h.start(a),p(`"${m.name}" started`,"success"))}catch(i){p(i.message,"error")}ae()})}),e.querySelectorAll("[data-edit-id]").forEach(s=>{s.addEventListener("click",t=>{t.stopPropagation(),window.location.hash=`#/bots/${s.dataset.editId}`})}),e.querySelectorAll(".bot-card").forEach(s=>{s.addEventListener("click",()=>{window.location.hash=`#/bots/${s.dataset.botId}`})})}catch(o){e.innerHTML=`<p style="color: var(--danger);">Failed to load bots: ${o.message}</p>`}}function se(e){if(!e)return"";const o=document.createElement("div");return o.textContent=e,o.innerHTML}const Oe=Object.freeze(Object.defineProperty({__proto__:null,destroy:Ne,render:Le},Symbol.toStringTag,{value:"Module"}));function He(){}async function xe(e,o){const s=o==="new";let t=null,a=[],m=[],i=[];try{a=await O.list(),m=await R.list(),s||(t=await h.get(parseInt(o)),i=await h.getLorebooks(parseInt(o)))}catch(r){e.innerHTML=`<div class="page"><p style="color:var(--danger)">Error loading data: ${r.message}</p></div>`;return}const g=s?"Create New Bot":`Edit — ${f(t.name)}`;function $(r){if(!r)return"";try{const n=JSON.parse(r);if(Array.isArray(n))return n.join(", ")}catch{}return""}e.innerHTML=`
    <div class="page" style="max-width: 760px;">
      <div class="page-header">
        <h1>${s?"🆕":"✎"} ${g}</h1>
        <button class="btn btn-ghost" id="back-btn">← Back</button>
      </div>

      <form id="bot-form" autocomplete="off">
        <!-- Identity -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Identity</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="bot-name">Bot Name *</label>
              <input class="form-input" id="bot-name" type="text" placeholder="My Cool Bot" value="${I(t==null?void 0:t.name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-token">Discord Token *</label>
              <input class="form-input" id="bot-token" type="password" placeholder="${s?"Paste your bot token":"••••••••  (leave blank to keep current)"}" />
            </div>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" for="bot-type">Bot Type</label>
            <select class="form-select" id="bot-type">
              <option value="real" ${(t==null?void 0:t.bot_type)!=="false"?"selected":""}>Real AI Bot</option>
              <option value="false" ${(t==null?void 0:t.bot_type)==="false"?"selected":""}>False Bot (Random Phrases)</option>
            </select>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" for="bot-allowed-guilds">Allowed Server IDs (Comma separated, leave empty for all servers)</label>
            <input class="form-input" id="bot-allowed-guilds" type="text" placeholder="1234567890, 0987654321" value="${I($(t==null?void 0:t.allowed_guilds))}" />
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
                ${a.map(r=>`
                  <option value="${r.id}" ${(t==null?void 0:t.provider_id)===r.id?"selected":""}>${f(r.name)}</option>
                `).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-model">Model ID</label>
              <input class="form-input" id="bot-model" type="text" list="bot-model-list" placeholder="deepseek/deepseek-v3.2" value="${I((t==null?void 0:t.model)||"deepseek/deepseek-v3.2")}" autocomplete="off" />
              <datalist id="bot-model-list"></datalist>
            </div>
            <div class="form-group" id="use-chat-vision-group" style="display: none; margin-top: -0.5rem; margin-bottom: 1rem;">
              <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); cursor: pointer;">
                <input type="checkbox" id="use-chat-vision" ${t!=null&&t.use_chat_vision?"checked":""} style="width: 16px; height: 16px; margin: 0; cursor: pointer;" />
                Use this chat model natively for reading images 👓
              </label>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-vision-provider">Vision Provider (Optional)</label>
              <select class="form-select" id="bot-vision-provider">
                <option value="">— Same as Chat Provider —</option>
                ${a.map(r=>`
                  <option value="${r.id}" ${(t==null?void 0:t.vision_provider_id)===r.id?"selected":""}>${f(r.name)}</option>
                `).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-vision-model">Vision Model ID (Optional)</label>
              <input class="form-input" id="bot-vision-model" type="text" list="bot-vision-model-list" placeholder="openai/gpt-4o-mini" value="${I((t==null?void 0:t.vision_model)||"")}" autocomplete="off" />
              <datalist id="bot-vision-model-list"></datalist>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Used to read images attached to messages or replied-to messages.</p>
            </div>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" for="bot-providers-order">OpenRouter Providers (Optional, Comma separated)</label>
            <input class="form-input" id="bot-providers-order" type="text" placeholder="Anthropic, Google, Together" value="${I($(t==null?void 0:t.providers_order))}" />
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Prefers these OpenRouter providers in order while still allowing fallback when one fails.</p>
          </div>
        </div>

        <!-- Prompts -->
        <div class="card" id="prompts-card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Prompts</h3>
          <div class="form-group">
            <label class="form-label" for="bot-system">System Prompt</label>
            <textarea class="form-textarea" id="bot-system" rows="4" placeholder="Core instructions for the AI...">${f(t==null?void 0:t.system_prompt)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-character">Character Prompt</label>
            <textarea class="form-textarea" id="bot-character" rows="4" placeholder="Personality, style, behavior...">${f(t==null?void 0:t.character_prompt)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-first-msg">First Message (Identity Anchor)</label>
            <textarea class="form-textarea" id="bot-first-msg" rows="3" placeholder="An opening message the bot 'said' — always included in context to anchor its voice, even after clearing history...">${f(t==null?void 0:t.first_message)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-examples">Example Messages</label>
            <textarea class="form-textarea" id="bot-examples" rows="4" placeholder="Example messages showing how this character talks. Used as tone/style reference only...">${f(t==null?void 0:t.example_messages)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-prefill">Prefill (Assistant Start)</label>
            <textarea class="form-textarea" id="bot-prefill" rows="2" placeholder="Optional starting text...">${f(t==null?void 0:t.prefill)}</textarea>
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
                <span class="slider-value" id="temp-val">${(t==null?void 0:t.temperature)??.9}</span>
              </div>
              <input type="range" id="bot-temp" min="0" max="2" step="0.05" value="${(t==null?void 0:t.temperature)??.9}" />
            </div>
            <div class="form-group slider-group">
              <div class="slider-header">
                <label class="form-label">Top P</label>
                <span class="slider-value" id="topp-val">${(t==null?void 0:t.top_p)??.9}</span>
              </div>
              <input type="range" id="bot-topp" min="0" max="1" step="0.05" value="${(t==null?void 0:t.top_p)??.9}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="bot-max-tokens">Max Output Tokens</label>
              <input class="form-input" id="bot-max-tokens" type="number" min="1" max="32000" value="${(t==null?void 0:t.max_tokens)??300}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-max-prompt">Max Prompt Tokens</label>
              <input class="form-input" id="bot-max-prompt" type="number" min="1" max="128000" value="${(t==null?void 0:t.max_prompt_tokens)??1e4}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group slider-group">
              <div class="slider-header">
                <label class="form-label">Presence Penalty</label>
                <span class="slider-value" id="pp-val">${(t==null?void 0:t.presence_penalty)??0}</span>
              </div>
              <input type="range" id="bot-pp" min="-2" max="2" step="0.1" value="${(t==null?void 0:t.presence_penalty)??0}" />
            </div>
            <div class="form-group slider-group">
              <div class="slider-header">
                <label class="form-label">Frequency Penalty</label>
                <span class="slider-value" id="fp-val">${(t==null?void 0:t.frequency_penalty)??0}</span>
              </div>
              <input type="range" id="bot-fp" min="-2" max="2" step="0.1" value="${(t==null?void 0:t.frequency_penalty)??0}" />
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
              <input type="checkbox" id="bot-autostart" ${t!=null&&t.auto_start?"checked":""} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <p style="font-weight: bold; margin: 0;">Log Retention (Days)</p>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">Detailed debugging logs are kept this many days. Set to 0 to keep forever.</p>
            </div>
            <input class="form-input" id="bot-log-retention" type="number" min="0" value="${(t==null?void 0:t.log_retention_days)??7}" style="max-width: 80px;" />
          </div>
        </div>

        <!-- Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; gap: 0.75rem;">
            ${s?"":'<button type="button" class="btn btn-ghost" id="view-memory-btn">Memory</button>'}
            ${s?"":'<button type="button" class="btn btn-ghost" id="view-logs-btn">📋 View Logs</button>'}
            ${s?"":'<button type="button" class="btn btn-ghost" id="clear-history-btn">🧹 Clear History</button>'}
            ${s?"":'<button type="button" class="btn btn-danger" id="delete-btn">🗑 Delete Bot</button>'}
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <button type="button" class="btn btn-ghost" id="cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary" id="save-btn">💾 ${s?"Create Bot":"Save Changes"}</button>
          </div>
        </div>
      </form>
    </div>
  `;const E=document.getElementById("bot-type"),B=document.getElementById("ai-config-card"),T=document.getElementById("prompts-card"),V=document.getElementById("params-card"),x=document.getElementById("false-phrases-card"),de=document.getElementById("lorebooks-card");let P=[];try{t&&t.false_phrases&&(P=JSON.parse(t.false_phrases||"[]"))}catch{}function ce(){const r=E.value==="false";B&&(B.style.display=r?"none":"block"),T&&(T.style.display=r?"none":"block"),V&&(V.style.display=r?"none":"block"),de&&(de.style.display=r?"none":"block"),x&&(x.style.display=r?"block":"none")}E.addEventListener("change",ce),ce();const Z=document.getElementById("lb-attach-select"),Se=document.getElementById("lb-attach-btn"),q=document.getElementById("attached-lorebooks");let _={};for(const r of i)try{_[r.lorebook_id]=typeof r.overrides=="string"?JSON.parse(r.overrides||"{}"):r.overrides||{}}catch{_[r.lorebook_id]={}}function Q(){Z.innerHTML='<option value="">— Select a lorebook to attach —</option>';const r=i.map(l=>l.lorebook_id);m.filter(l=>!r.includes(l.id)).forEach(l=>{const d=document.createElement("option");d.value=l.id,d.textContent=`${l.name} (${l.entry_count||0} entries)`,Z.appendChild(d)})}Q();function me(r){return r==="sun"?"☀️":r==="off"?"✖":"🌙"}function Me(r){return r==="moon"?"sun":r==="sun"?"off":"moon"}function X(){if(i.length===0){q.innerHTML='<p style="color: var(--text-secondary); text-align: center;">No lorebooks attached.</p>';return}q.innerHTML=i.map(r=>{let n=[];try{const d=typeof r.data=="string"?JSON.parse(r.data):r.data;d.entries&&(n=Object.entries(d.entries))}catch{}const l=_[r.lorebook_id]||{};return`
        <div class="lb-attached-item" data-lbid="${r.lorebook_id}">
          <div class="lb-attached-header">
            <div style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;" class="lb-toggle-expand">
              <span class="lb-expand-arrow">▶</span>
              <strong>${f(r.name)}</strong>
              <span style="color: var(--text-secondary); font-size: 0.85rem;">${n.length} entries</span>
            </div>
            <button type="button" class="btn btn-ghost" data-detach-lb="${r.lorebook_id}" style="padding: 0.25rem 0.5rem; color: var(--danger); font-size: 0.8rem;">Detach</button>
          </div>
          <div class="lb-entries-list" style="display: none;">
            ${n.map(([d,c])=>{const k=l[d]||"moon",b=c.comment||c.name||`Entry ${d}`,w=(Array.isArray(c.key)?c.key:c.keys||[]).join(", ");return`
                <div class="lb-entry-row">
                  <button type="button" class="lb-state-btn" data-lbid="${r.lorebook_id}" data-uid="${d}" data-state="${k}" title="Click to cycle: 🌙 mentioned → ☀️ always → ✖ off">
                    ${me(k)}
                  </button>
                  <div class="lb-entry-info">
                    <span class="lb-entry-name">${f(b)}</span>
                    <span class="lb-entry-keys">${f(w)}</span>
                  </div>
                </div>
              `}).join("")}
          </div>
        </div>
      `}).join(""),q.querySelectorAll(".lb-toggle-expand").forEach(r=>{r.addEventListener("click",()=>{const n=r.closest(".lb-attached-item"),l=n.querySelector(".lb-entries-list"),d=n.querySelector(".lb-expand-arrow"),c=l.style.display!=="none";l.style.display=c?"none":"block",d.textContent=c?"▶":"▼"})}),q.querySelectorAll(".lb-state-btn").forEach(r=>{r.addEventListener("click",()=>{const n=r.dataset.lbid,l=r.dataset.uid,d=r.dataset.state,c=Me(d);r.dataset.state=c,r.textContent=me(c),_[n]||(_[n]={}),_[n][l]=c})}),q.querySelectorAll("[data-detach-lb]").forEach(r=>{r.addEventListener("click",async()=>{const n=parseInt(r.dataset.detachLb),l=i.find(d=>d.lorebook_id===n);if(confirm(`Detach lorebook "${l==null?void 0:l.name}" from this bot?`))try{s||await h.detachLorebook(parseInt(o),n),i=i.filter(d=>d.lorebook_id!==n),delete _[n],X(),Q(),p("Lorebook detached","success")}catch(d){p(d.message,"error")}})})}X(),Se.addEventListener("click",async()=>{const r=parseInt(Z.value);if(!r)return p("Select a lorebook first","error");try{s||await h.attachLorebook(parseInt(o),r);const n=await R.get(r),l=m.find(d=>d.id===r);i.push({lorebook_id:r,name:(l==null?void 0:l.name)||n.name,data:n.data,overrides:"{}"}),_[r]={},X(),Q(),p("Lorebook attached","success")}catch(n){p(n.message,"error")}});const Y=document.getElementById("phrases-list"),ee=document.getElementById("new-phrase-input"),pe=document.getElementById("add-phrase-btn"),ue=document.getElementById("new-audio-input"),U=document.getElementById("add-audio-btn");function G(){if(Y.innerHTML="",P.length===0){Y.innerHTML='<li style="padding: 0.75rem; text-align: center; color: var(--text-secondary);">No phrases added yet.</li>';return}P.forEach((r,n)=>{const l=document.createElement("li");l.style.cssText="padding: 0.75rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;";const d=document.createElement("span");d.style.wordBreak="break-word",typeof r=="string"?d.textContent=r:r.type==="audio"&&(d.innerHTML=`🎵 <strong>Audio:</strong> ${f(r.originalName||"response.mp3")}`);const c=document.createElement("button");c.type="button",c.className="btn btn-ghost",c.style.padding="0.25rem 0.5rem",c.style.color="var(--danger)",c.textContent="✖",c.onclick=()=>{P.splice(n,1),G()},l.appendChild(d),l.appendChild(c),Y.appendChild(l)})}G(),pe.addEventListener("click",()=>{const r=ee.value.trim();r&&(P.push(r),ee.value="",G())}),ee.addEventListener("keydown",r=>{r.key==="Enter"&&(r.preventDefault(),pe.click())}),U.addEventListener("click",async()=>{const r=ue.files[0];if(!r)return p("Please select a file first","error");try{U.disabled=!0,U.textContent="Uploading...";const n=await Ae(r);P.push({type:"audio",path:n.path,originalName:n.originalname}),ue.value="",G(),p("Audio uploaded successfully","success")}catch(n){p(n.message,"error")}finally{U.disabled=!1,U.textContent="Upload MP3"}});const S=document.getElementById("bot-provider"),J=document.getElementById("bot-vision-provider"),te=document.getElementById("bot-model"),ve=document.getElementById("use-chat-vision-group"),ye=document.getElementById("use-chat-vision");let K=[];function Ce(r){if(!K||K.length===0)return!1;const n=K.find(c=>c.id===r);if(!n||!n.architecture)return!1;n.architecture.instruct_type;const l=n.architecture.modality||"",d=Array.isArray(n.architecture.input_modalities)?n.architecture.input_modalities.join(","):"";return l.includes("image")||d.includes("image")}function oe(){const r=te.value.trim();Ce(r)?ve.style.display="block":(ve.style.display="none",ye&&(ye.checked=!1))}te.addEventListener("input",oe),te.addEventListener("change",oe);async function F(r,n){const l=document.getElementById(n);if(l.innerHTML="",!!r)try{const d=await O.getModels(r);d&&d.data&&Array.isArray(d.data)&&(n==="bot-model-list"&&(K=d.data),d.data.forEach(c=>{const k=document.createElement("option");k.value=c.id;let b=c.name&&c.name!==c.id?c.name:"";n==="bot-model-list"&&(c.architecture&&c.architecture.modality&&c.architecture.modality.includes("image")||c.architecture&&Array.isArray(c.architecture.input_modalities)&&c.architecture.input_modalities.includes("image"))&&(b+=" 👓"),b&&(k.textContent=b),l.appendChild(k)}),n==="bot-model-list"&&oe())}catch(d){console.error("Failed to load models:",d)}}if(S.addEventListener("change",()=>{F(S.value,"bot-model-list"),J.value||F(S.value,"bot-vision-model-list")}),J.addEventListener("change",()=>{F(J.value||S.value,"bot-vision-model-list")}),S.value&&F(S.value,"bot-model-list"),(J.value||S.value)&&F(J.value||S.value,"bot-vision-model-list"),[{input:"bot-temp",display:"temp-val"},{input:"bot-topp",display:"topp-val"},{input:"bot-pp",display:"pp-val"},{input:"bot-fp",display:"fp-val"}].forEach(({input:r,display:n})=>{const l=document.getElementById(r),d=document.getElementById(n);l.addEventListener("input",()=>{d.textContent=l.value})}),document.getElementById("back-btn").addEventListener("click",()=>{window.location.hash="#/"}),document.getElementById("cancel-btn").addEventListener("click",()=>{window.location.hash="#/"}),!s){const r=document.createElement("div");e.appendChild(r),r.innerHTML=`
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
    `;const n=document.getElementById("memory-dialog"),l=document.getElementById("memory-server-select"),d=document.getElementById("memory-summary-text"),c=document.getElementById("memory-stats"),k=document.getElementById("memory-messages-list"),b=document.getElementById("clear-history-dialog"),w=document.getElementById("clear-history-select"),L=async()=>{const v=await h.getHistory(t.id),u=v&&v.length>0?v:[{guild_id:"DM",message_count:0}];l.innerHTML='<option value="">Select a server</option>'+u.map(M=>`<option value="${I(M.guild_id||"DM")}">${$e(M.guild_id)} (${M.message_count||0} messages)</option>`).join(""),!l.value&&u.length>0&&(l.value=u[0].guild_id||"DM")},A=async()=>{var u,M,fe;const v=l.value;if(!v){c.textContent="Select a server.",k.innerHTML="Select a server to inspect memory.";return}c.textContent="Loading...",k.innerHTML="Loading messages...";try{const N=await h.getMemory(t.id,v);d.value=N.summary||"",c.textContent=`${((u=N.stats)==null?void 0:u.conversation_count)||0} saved messages, ${((M=N.stats)==null?void 0:M.summary_count)||0} summary block${((fe=N.stats)==null?void 0:fe.summary_count)===1?"":"s"}`,k.innerHTML=De(N.recent_messages||[])}catch(N){c.textContent="Failed to load memory.",k.innerHTML=`<span class="log-error">Error loading memory: ${f(N.message)}</span>`}};document.getElementById("view-memory-btn").addEventListener("click",async()=>{try{await L(),await A(),n.showModal()}catch(v){p(v.message,"error")}}),l.addEventListener("change",A),document.getElementById("refresh-memory-btn").addEventListener("click",A),document.getElementById("save-memory-btn").addEventListener("click",async()=>{const v=l.value;if(!v)return p("Select a server first","error");try{await h.saveMemory(t.id,v,d.value),p("Memory summary saved","success"),await A()}catch(u){p(u.message,"error")}}),document.getElementById("clear-history-btn").addEventListener("click",async()=>{try{const v=await h.getHistory(t.id);if(!v||v.length===0){p("No conversation history to clear","info");return}w.innerHTML='<option value="all">🧹 Everything (All Servers & DMs)</option>'+v.map(u=>{const M=u.guild_id==="DM"||!u.guild_id?"Direct Messages":`Server ${u.guild_id}`;return`<option value="${u.guild_id}">${M} (${u.message_count} messages)</option>`}).join(""),b.showModal()}catch(v){p(v.message,"error")}}),document.getElementById("confirm-clear-history-btn").addEventListener("click",async()=>{const v=w.value;try{let u;if(v==="all"){if(!confirm(`Clear ALL conversation history for "${t.name}" across all servers?`))return;u=await h.clearHistory(t.id)}else u=await h.clearHistory(t.id,v);p(`History cleared (${u.messagesRemoved} messages removed)`,"success"),b.close()}catch(u){p(u.message,"error")}});const Te=document.getElementById("view-logs-dialog"),re=document.getElementById("view-logs-select"),H=document.getElementById("logs-container"),Pe=async()=>{try{const v=await h.getLogServers(t.id);re.innerHTML='<option value="">— Select a Server —</option>'+v.map(u=>`<option value="${I(u.guild_id||"DM")}">${$e(u.guild_id)}</option>`).join("")}catch(v){p("Failed to load log servers: "+v.message,"error")}},ge=async()=>{const v=re.value;if(!v){H.innerHTML="Please select a server.";return}H.innerHTML="Loading logs...";try{const u=await h.getLogs(t.id,v);if(!u||u.length===0){H.innerHTML="No logs found.";return}H.innerHTML=je(u)}catch(u){H.innerHTML=`<span class="log-error">Error loading logs: ${f(u.message)}</span>`}};document.getElementById("view-logs-btn").addEventListener("click",async()=>{await Pe(),H.innerHTML="Select a server to view logs...",Te.showModal()}),re.addEventListener("change",ge),document.getElementById("refresh-logs-btn").addEventListener("click",ge)}const be=document.getElementById("delete-btn");be&&be.addEventListener("click",async()=>{if(confirm(`Are you sure you want to delete "${t.name}"? This cannot be undone.`))try{await h.delete(t.id),p(`"${t.name}" deleted`,"info"),window.location.hash="#/"}catch(r){p(r.message,"error")}}),document.getElementById("bot-form").addEventListener("submit",async r=>{var k;r.preventDefault();const n=document.getElementById("save-btn");n.disabled=!0,n.textContent="Saving…";const l=(b,w,L=Number.parseFloat)=>{const A=L(document.getElementById(b).value,10);return Number.isFinite(A)?A:w},d={name:document.getElementById("bot-name").value.trim(),model:document.getElementById("bot-model").value.trim(),vision_model:document.getElementById("bot-vision-model").value.trim(),use_chat_vision:((k=document.getElementById("use-chat-vision"))==null?void 0:k.checked)||!1,provider_id:parseInt(document.getElementById("bot-provider").value)||null,vision_provider_id:parseInt(document.getElementById("bot-vision-provider").value)||null,bot_type:document.getElementById("bot-type").value,false_phrases:JSON.stringify(P),system_prompt:document.getElementById("bot-system").value,character_prompt:document.getElementById("bot-character").value,first_message:document.getElementById("bot-first-msg").value,example_messages:document.getElementById("bot-examples").value,prefill:document.getElementById("bot-prefill").value,temperature:l("bot-temp",.9),top_p:l("bot-topp",.9),max_tokens:l("bot-max-tokens",300,Number.parseInt),max_prompt_tokens:l("bot-max-prompt",1e4,Number.parseInt),presence_penalty:l("bot-pp",0),frequency_penalty:l("bot-fp",0),auto_start:document.getElementById("bot-autostart").checked,log_retention_days:l("bot-log-retention",7,Number.parseInt),allowed_guilds:JSON.stringify(document.getElementById("bot-allowed-guilds").value.split(",").map(b=>b.trim()).filter(b=>b)),providers_order:JSON.stringify(document.getElementById("bot-providers-order").value.split(",").map(b=>b.trim()).filter(b=>b))},c=document.getElementById("bot-token").value.trim();if(c&&(d.discord_token=c),!d.name){p("Bot name is required","error"),n.disabled=!1,n.textContent=s?"Create Bot":"Save Changes";return}if(s&&!c){p("Discord token is required for new bots","error"),n.disabled=!1,n.textContent="Create Bot";return}try{if(s){const b=await h.create(d);for(const w of i)try{await h.attachLorebook(b.id,w.lorebook_id);const L=_[w.lorebook_id];L&&Object.keys(L).length>0&&await h.updateLorebook(b.id,w.lorebook_id,L)}catch(L){console.error("Failed to attach lorebook:",L)}p("Bot created!","success")}else{await h.update(t.id,d);for(const b of i){const w=_[b.lorebook_id];if(w)try{await h.updateLorebook(t.id,b.lorebook_id,w)}catch(L){console.error("Failed to save lorebook overrides:",L)}}p("Bot updated!","success")}window.location.hash="#/"}catch(b){p(b.message,"error"),n.disabled=!1,n.textContent=s?"Create Bot":"Save Changes"}})}function $e(e){return e==="DM"||!e?"Direct Messages":`Server ${e}`}function ie(e){return e?new Date(`${e}Z`).toLocaleString():"Unknown time"}function j(e){return Number.isFinite(Number(e))?Number(e).toLocaleString():"n/a"}function z(e){return e&&typeof e.content=="object"&&e.content!==null?e.content:{}}function De(e){return!e||e.length===0?'<div class="inspector-empty">No saved conversation messages for this scope.</div>':e.map(o=>`
    <div class="memory-message ${I(o.role)}">
      <div class="memory-message-meta">
        <span class="role-pill ${I(o.role)}">${f(o.role)}</span>
        <span>${ie(o.created_at)}</span>
      </div>
      <div class="memory-message-content">${f(o.content)}</div>
    </div>
  `).join("")}function je(e){const o=qe(e);return o.length===0?'<div class="inspector-empty">No logs found.</div>':o.map(Ue).join("")}function qe(e){const o=[...e].sort((a,m)=>a.id-m.id),s=new Map;let t=0;for(const a of o){let i=z(a).requestId;i||((a.type==="context_built"||a.type==="api_request")&&(t+=1),i=`legacy-${t||a.id}`),s.has(i)||s.set(i,{key:i,logs:[],firstId:a.id,lastId:a.id});const g=s.get(i);g.logs.push(a),g.firstId=Math.min(g.firstId,a.id),g.lastId=Math.max(g.lastId,a.id)}return[...s.values()].sort((a,m)=>m.lastId-a.lastId)}function Ue(e){const o=e.logs,s=o.find(x=>x.type==="api_request"),t=o.find(x=>x.type==="api_response"),a=o.find(x=>x.type==="context_built"),m=o.filter(x=>x.type==="api_retry"),i=z(s),g=z(t),$=z(a),E=g.usage||{},B=t?"success":m.length>0?"warning":"neutral",T=t?"Completed":m.length>0?"Retried":"Log Event",V=i.model||$.channelId||o[0].type;return`
    <article class="log-group">
      <div class="log-group-header">
        <div>
          <div class="log-group-title">${f(V)}</div>
          <div class="log-muted">${ie(o[o.length-1].created_at)}</div>
        </div>
        <span class="log-status ${B}">${T}</span>
      </div>
      <div class="log-metrics">
        ${D("Prompt",i.estimatedPromptTokens||$.totalTokens)}
        ${D("Messages",i.messageCount||$.messageCount)}
        ${D("Output",E.completion_tokens)}
        ${D("Response",g.responseLength?`${j(g.responseLength)} chars`:null)}
        ${D("Retries",m.length)}
        ${D("Images",i.hasImages?"yes":"no")}
      </div>
      <div class="log-timeline">
        ${o.map(Je).join("")}
      </div>
    </article>
  `}function D(e,o){const s=o==null||o===""?"n/a":o;return`<div class="log-metric"><span>${f(e)}</span><strong>${f(String(s))}</strong></div>`}function Je(e){const o=z(e),s=Fe(e.type,o),t=JSON.stringify(o,null,2);return`
    <details class="log-event">
      <summary>
        <span class="log-event-type ${I(e.type)}">${f(e.type)}</span>
        <span>${f(s)}</span>
        <time>${ie(e.created_at)}</time>
      </summary>
      <pre>${f(t)}</pre>
    </details>
  `}function Fe(e,o){if(e==="context_built")return`${j(o.totalTokens)} estimated tokens across ${j(o.messageCount)} messages`;if(e==="api_request")return`${o.model||"model"} request, ${j(o.estimatedPromptTokens)} prompt tokens`;if(e==="api_retry")return`${o.failedAttempt||"attempt"} failed; retrying ${o.nextAttempt||"next attempt"}`;if(e==="api_response"){const s=o.usage||{};return`${o.finishReason||"finished"}, ${j(o.responseLength)} chars, ${j(s.total_tokens)} total tokens`}return typeof o=="string"?o:"Log entry"}function f(e){if(!e)return"";const o=document.createElement("div");return o.textContent=e,o.innerHTML}function I(e){return e?e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}const Re=Object.freeze(Object.defineProperty({__proto__:null,destroy:He,render:xe},Symbol.toStringTag,{value:"Module"}));function ze(){}async function _e(e){e.innerHTML=`
    <div class="page">
      <div class="page-header">
        <h1>🔑 API Providers</h1>
        <button class="btn btn-primary" id="add-provider-btn">＋ New Provider</button>
      </div>
      <div id="provider-list" class="card-grid"></div>
    </div>
  `,document.getElementById("add-provider-btn").addEventListener("click",()=>ne()),le()}async function le(){var o;const e=document.getElementById("provider-list");if(e)try{const s=await O.list();if(s.length===0){e.innerHTML=`
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🔑</div>
          <p>No API providers yet. Add one to connect your bots to an AI service.</p>
          <button class="btn btn-primary" id="empty-add-btn">＋ Add Provider</button>
        </div>
      `,(o=document.getElementById("empty-add-btn"))==null||o.addEventListener("click",()=>ne());return}e.innerHTML=s.map(t=>`
      <div class="card">
        <div class="provider-card-header">
          <span class="provider-card-name">${Ee(t.name)}</span>
          <div class="provider-card-actions">
            <button class="btn-icon" data-edit-provider="${t.id}" title="Edit">✎</button>
            <button class="btn-icon danger" data-delete-provider="${t.id}" title="Delete">🗑</button>
          </div>
        </div>
        <div class="provider-card-url">${Ee(t.base_url)}</div>
      </div>
    `).join(""),e.querySelectorAll("[data-edit-provider]").forEach(t=>{t.addEventListener("click",()=>ne(parseInt(t.dataset.editProvider)))}),e.querySelectorAll("[data-delete-provider]").forEach(t=>{t.addEventListener("click",async()=>{const a=parseInt(t.dataset.deleteProvider),m=s.find(i=>i.id===a);if(confirm(`Delete provider "${m==null?void 0:m.name}"? Bots using it will lose their API connection.`))try{await O.delete(a),p("Provider deleted","info"),le()}catch(i){p(i.message,"error")}})})}catch(s){e.innerHTML=`<p style="color: var(--danger);">Failed to load providers: ${s.message}</p>`}}async function ne(e=null){var m;const o=e!==null;let s=null;if(o)try{s=await O.get(e)}catch(i){p(i.message,"error");return}(m=document.querySelector(".modal-overlay"))==null||m.remove();const t=document.createElement("div");t.className="modal-overlay",t.innerHTML=`
    <div class="modal">
      <div class="modal-header">
        <h2>${o?"Edit Provider":"New Provider"}</h2>
        <button class="btn-icon" id="modal-close">✕</button>
      </div>
      <form id="provider-form" autocomplete="off">
        <div class="form-group">
          <label class="form-label" for="prov-name">Name *</label>
          <input class="form-input" id="prov-name" type="text" placeholder="e.g. OpenRouter, My Local LLM" value="${ke(s==null?void 0:s.name)}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="prov-url">Base URL</label>
          <input class="form-input" id="prov-url" type="url" placeholder="https://openrouter.ai/api/v1" value="${ke((s==null?void 0:s.base_url)||"https://openrouter.ai/api/v1")}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="prov-key">API Key ${o?"(leave blank to keep current)":"*"}</label>
          <input class="form-input" id="prov-key" type="password" placeholder="${o?"••••••••":"sk-..."}" ${o?"":"required"} />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" id="modal-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">${o?"Save":"Create"}</button>
        </div>
      </form>
    </div>
  `,document.body.appendChild(t);const a=()=>t.remove();document.getElementById("modal-close").addEventListener("click",a),document.getElementById("modal-cancel").addEventListener("click",a),t.addEventListener("click",i=>{i.target===t&&a()}),document.getElementById("provider-form").addEventListener("submit",async i=>{i.preventDefault();const g={name:document.getElementById("prov-name").value.trim(),base_url:document.getElementById("prov-url").value.trim()||"https://openrouter.ai/api/v1"},$=document.getElementById("prov-key").value.trim();if($&&(g.api_key=$),!g.name){p("Name is required","error");return}if(!o&&!$){p("API key is required","error");return}try{o?(await O.update(e,g),p("Provider updated!","success")):(await O.create(g),p("Provider created!","success")),a(),le()}catch(E){p(E.message,"error")}})}function Ee(e){if(!e)return"";const o=document.createElement("div");return o.textContent=e,o.innerHTML}function ke(e){return e?e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}const Ve=Object.freeze(Object.defineProperty({__proto__:null,destroy:ze,render:_e},Symbol.toStringTag,{value:"Module"}));function Ge(){}async function Ie(e){let o=[];try{o=await R.list()}catch(i){e.innerHTML=`<div class="page"><p style="color:var(--danger)">Error loading lorebooks: ${i.message}</p></div>`;return}e.innerHTML=`
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
  `;const s=document.getElementById("lb-list"),t=document.getElementById("lb-file"),a=document.getElementById("upload-lb-btn");function m(){if(o.length===0){s.innerHTML='<p style="color: var(--text-secondary); text-align: center;">No lorebooks uploaded yet.</p>';return}s.innerHTML=o.map(i=>`
      <div class="lb-row" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 0.5rem;">
        <div>
          <strong>${Ke(i.name)}</strong>
          <span style="color: var(--text-secondary); font-size: 0.85rem; margin-left: 0.75rem;">${i.entry_count||0} entries</span>
        </div>
        <button type="button" class="btn btn-danger btn-sm" data-delete-lb="${i.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">🗑 Delete</button>
      </div>
    `).join(""),s.querySelectorAll("[data-delete-lb]").forEach(i=>{i.addEventListener("click",async()=>{const g=parseInt(i.dataset.deleteLb),$=o.find(E=>E.id===g);if(confirm(`Delete lorebook "${$==null?void 0:$.name}"? This will also remove it from all bots.`))try{await R.delete(g),o=o.filter(E=>E.id!==g),m(),p("Lorebook deleted","success")}catch(E){p(E.message,"error")}})})}m(),a.addEventListener("click",async()=>{const i=t.files[0];if(!i)return p("Please select a JSON file first","error");try{a.disabled=!0,a.textContent="Uploading…";const g=await i.text(),$=JSON.parse(g);if(!$.entries)throw new Error('File must contain an "entries" object');const E=$.name||i.name.replace(/\.json$/i,""),B=await R.create({name:E,data:g}),T=Object.keys($.entries).length;o.push({id:B.id,name:B.name,entry_count:T}),m(),t.value="",p(`Lorebook "${B.name}" uploaded (${T} entries)`,"success")}catch(g){p(g.message,"error")}finally{a.disabled=!1,a.textContent="📤 Upload"}})}function Ke(e){if(!e)return"";const o=document.createElement("div");return o.textContent=e,o.innerHTML}const We=Object.freeze(Object.defineProperty({__proto__:null,destroy:Ge,render:Ie},Symbol.toStringTag,{value:"Module"})),Ze=document.getElementById("app");let C=null;function Qe(e){return`
    <nav class="navbar">
      <div class="navbar-brand" onclick="location.hash='#/'">
        <span class="logo-icon">⚡</span>
        CordBridge
      </div>
      <div class="navbar-links">
        <a href="#/" class="${e==="dashboard"?"active":""}">Dashboard</a>
        <a href="#/providers" class="${e==="providers"?"active":""}">Providers</a>
        <a href="#/lorebooks" class="${e==="lorebooks"?"active":""}">Lorebooks</a>
      </div>
    </nav>
  `}async function Be(){C!=null&&C.destroy&&C.destroy();const e=window.location.hash||"#/";let o="dashboard";e.startsWith("#/providers")?o="providers":e.startsWith("#/lorebooks")?o="lorebooks":e.startsWith("#/bots/")&&(o="botEditor"),Ze.innerHTML=Qe(o)+'<div id="page-content"></div>';const s=document.getElementById("page-content");if(o==="providers")C=Ve,await _e(s);else if(o==="lorebooks")C=We,await Ie(s);else if(o==="botEditor"){const t=e.split("/").pop();C=Re,await xe(s,t)}else C=Oe,Le(s)}window.addEventListener("hashchange",Be);window.addEventListener("DOMContentLoaded",()=>{window.location.hash||(window.location.hash="#/"),Be()});
