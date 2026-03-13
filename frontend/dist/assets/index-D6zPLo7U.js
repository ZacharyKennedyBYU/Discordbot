(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))e(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&e(l)}).observe(document,{childList:!0,subtree:!0});function a(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function e(o){if(o.ep)return;o.ep=!0;const s=a(o);fetch(o.href,s)}})();const O="/api";async function d(t,r={}){const a=await fetch(`${O}${t}`,{headers:{"Content-Type":"application/json",...r.headers},...r}),e=await a.json();if(!a.ok)throw new Error(e.error||`Request failed (${a.status})`);return e}const h={list:()=>d("/providers"),get:t=>d(`/providers/${t}`),create:t=>d("/providers",{method:"POST",body:JSON.stringify(t)}),update:(t,r)=>d(`/providers/${t}`,{method:"PUT",body:JSON.stringify(r)}),delete:t=>d(`/providers/${t}`,{method:"DELETE"})},u={list:()=>d("/bots"),get:t=>d(`/bots/${t}`),create:t=>d("/bots",{method:"POST",body:JSON.stringify(t)}),update:(t,r)=>d(`/bots/${t}`,{method:"PUT",body:JSON.stringify(r)}),delete:t=>d(`/bots/${t}`,{method:"DELETE"}),start:t=>d(`/bots/${t}/start`,{method:"POST"}),stop:t=>d(`/bots/${t}/stop`,{method:"POST"}),getHistory:t=>d(`/bots/${t}/history`),clearHistory:(t,r)=>d(`/bots/${t}/history${r?`?guild_id=${r}`:""}`,{method:"DELETE"})},k={success:"✓",error:"✕",info:"ℹ"};function i(t,r="info",a=3500){const e=document.getElementById("toast-container"),o=document.createElement("div");o.className=`toast ${r}`,o.innerHTML=`
    <span class="toast-icon">${k[r]||k.info}</span>
    <span>${t}</span>
  `,e.appendChild(o),setTimeout(()=>{o.classList.add("fade-out"),o.addEventListener("animationend",()=>o.remove())},a)}let w=null;function S(t){t.innerHTML=`
    <div class="page">
      <div class="page-header">
        <h1>🤖 Dashboard</h1>
        <button class="btn btn-primary" id="add-bot-btn">＋ New Bot</button>
      </div>
      <div id="bot-list" class="card-grid"></div>
    </div>
  `,document.getElementById("add-bot-btn").addEventListener("click",()=>{window.location.hash="#/bots/new"}),x(),w=setInterval(x,5e3)}function H(){w&&(clearInterval(w),w=null)}async function x(){const t=document.getElementById("bot-list");if(t)try{const r=await u.list();if(r.length===0){t.innerHTML=`
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🤖</div>
          <p>No bots yet. Create your first bot to get started!</p>
          <button class="btn btn-primary" onclick="location.hash='#/bots/new'">＋ Create Bot</button>
        </div>
      `;return}t.innerHTML=r.map(a=>`
      <div class="card bot-card" data-bot-id="${a.id}">
        <div class="bot-card-header">
          <span class="bot-card-name">${I(a.name)}</span>
          <span class="status-badge ${a.online?"online":"offline"}">
            <span class="status-dot"></span>
            ${a.online?"Online":"Offline"}
          </span>
        </div>
        <div class="bot-card-meta">
          <div class="meta-row">
            <span class="meta-label">Model</span>
            <span>${I(a.model||"—")}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Provider</span>
            <span>${I(a.provider_name||"None")}</span>
          </div>
        </div>
        <div class="bot-card-actions">
          <button class="btn btn-sm ${a.online?"btn-danger":"btn-success"}" data-toggle-id="${a.id}">
            ${a.online?"⏹ Stop":"▶ Start"}
          </button>
          <button class="btn btn-sm btn-ghost" data-edit-id="${a.id}">✎ Edit</button>
        </div>
      </div>
    `).join(""),t.querySelectorAll("[data-toggle-id]").forEach(a=>{a.addEventListener("click",async e=>{e.stopPropagation();const o=parseInt(a.dataset.toggleId),s=r.find(l=>l.id===o);a.disabled=!0,a.textContent="…";try{s.online?(await u.stop(o),i(`"${s.name}" stopped`,"info")):(await u.start(o),i(`"${s.name}" started`,"success"))}catch(l){i(l.message,"error")}x()})}),t.querySelectorAll("[data-edit-id]").forEach(a=>{a.addEventListener("click",e=>{e.stopPropagation(),window.location.hash=`#/bots/${a.dataset.editId}`})}),t.querySelectorAll(".bot-card").forEach(a=>{a.addEventListener("click",()=>{window.location.hash=`#/bots/${a.dataset.botId}`})})}catch(r){t.innerHTML=`<p style="color: var(--danger);">Failed to load bots: ${r.message}</p>`}}function I(t){if(!t)return"";const r=document.createElement("div");return r.textContent=t,r.innerHTML}const N=Object.freeze(Object.defineProperty({__proto__:null,destroy:H,render:S},Symbol.toStringTag,{value:"Module"}));function q(){}async function T(t,r){const a=r==="new";let e=null,o=[];try{o=await h.list(),a||(e=await u.get(parseInt(r)))}catch(n){t.innerHTML=`<div class="page"><p style="color:var(--danger)">Error loading data: ${n.message}</p></div>`;return}const s=a?"Create New Bot":`Edit — ${v(e.name)}`;t.innerHTML=`
    <div class="page" style="max-width: 760px;">
      <div class="page-header">
        <h1>${a?"🆕":"✎"} ${s}</h1>
        <button class="btn btn-ghost" id="back-btn">← Back</button>
      </div>

      <form id="bot-form" autocomplete="off">
        <!-- Identity -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Identity</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="bot-name">Bot Name *</label>
              <input class="form-input" id="bot-name" type="text" placeholder="My Cool Bot" value="${B(e==null?void 0:e.name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-token">Discord Token *</label>
              <input class="form-input" id="bot-token" type="password" placeholder="${a?"Paste your bot token":"••••••••  (leave blank to keep current)"}" />
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
                ${o.map(n=>`
                  <option value="${n.id}" ${(e==null?void 0:e.provider_id)===n.id?"selected":""}>${v(n.name)}</option>
                `).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-model">Model ID</label>
              <input class="form-input" id="bot-model" type="text" placeholder="deepseek/deepseek-v3.2" value="${B((e==null?void 0:e.model)||"deepseek/deepseek-v3.2")}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-vision-provider">Vision Provider (Optional)</label>
              <select class="form-select" id="bot-vision-provider">
                <option value="">— Same as Chat Provider —</option>
                ${o.map(n=>`
                  <option value="${n.id}" ${(e==null?void 0:e.vision_provider_id)===n.id?"selected":""}>${v(n.name)}</option>
                `).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-vision-model">Vision Model ID (Optional)</label>
              <input class="form-input" id="bot-vision-model" type="text" placeholder="openai/gpt-4o-mini" value="${B((e==null?void 0:e.vision_model)||"")}" />
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Used to read images attached to messages or replied-to messages.</p>
            </div>
          </div>
        </div>

        <!-- Prompts -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Prompts</h3>
          <div class="form-group">
            <label class="form-label" for="bot-system">System Prompt</label>
            <textarea class="form-textarea" id="bot-system" rows="4" placeholder="Core instructions for the AI...">${v(e==null?void 0:e.system_prompt)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-character">Character Prompt</label>
            <textarea class="form-textarea" id="bot-character" rows="4" placeholder="Personality, style, behavior...">${v(e==null?void 0:e.character_prompt)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-first-msg">First Message (Identity Anchor)</label>
            <textarea class="form-textarea" id="bot-first-msg" rows="3" placeholder="An opening message the bot 'said' — always included in context to anchor its voice, even after clearing history...">${v(e==null?void 0:e.first_message)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-examples">Example Messages</label>
            <textarea class="form-textarea" id="bot-examples" rows="4" placeholder="Example messages showing how this character talks. Used as tone/style reference only...">${v(e==null?void 0:e.example_messages)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-prefill">Prefill (Assistant Start)</label>
            <textarea class="form-textarea" id="bot-prefill" rows="2" placeholder="Optional starting text...">${v(e==null?void 0:e.prefill)}</textarea>
          </div>
        </div>

        <!-- Parameters -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Model Parameters</h3>
          <div class="form-row">
            <div class="form-group slider-group">
              <div class="slider-header">
                <label class="form-label">Temperature</label>
                <span class="slider-value" id="temp-val">${(e==null?void 0:e.temperature)??.9}</span>
              </div>
              <input type="range" id="bot-temp" min="0" max="2" step="0.05" value="${(e==null?void 0:e.temperature)??.9}" />
            </div>
            <div class="form-group slider-group">
              <div class="slider-header">
                <label class="form-label">Top P</label>
                <span class="slider-value" id="topp-val">${(e==null?void 0:e.top_p)??.9}</span>
              </div>
              <input type="range" id="bot-topp" min="0" max="1" step="0.05" value="${(e==null?void 0:e.top_p)??.9}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="bot-max-tokens">Max Output Tokens</label>
              <input class="form-input" id="bot-max-tokens" type="number" min="1" max="32000" value="${(e==null?void 0:e.max_tokens)??300}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-max-prompt">Max Prompt Tokens</label>
              <input class="form-input" id="bot-max-prompt" type="number" min="1" max="128000" value="${(e==null?void 0:e.max_prompt_tokens)??1e4}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group slider-group">
              <div class="slider-header">
                <label class="form-label">Presence Penalty</label>
                <span class="slider-value" id="pp-val">${(e==null?void 0:e.presence_penalty)??0}</span>
              </div>
              <input type="range" id="bot-pp" min="-2" max="2" step="0.1" value="${(e==null?void 0:e.presence_penalty)??0}" />
            </div>
            <div class="form-group slider-group">
              <div class="slider-header">
                <label class="form-label">Frequency Penalty</label>
                <span class="slider-value" id="fp-val">${(e==null?void 0:e.frequency_penalty)??0}</span>
              </div>
              <input type="range" id="bot-fp" min="-2" max="2" step="0.1" value="${(e==null?void 0:e.frequency_penalty)??0}" />
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
              <input type="checkbox" id="bot-autostart" ${e!=null&&e.auto_start?"checked":""} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; gap: 0.75rem;">
            ${a?"":'<button type="button" class="btn btn-ghost" id="clear-history-btn">🧹 Clear History</button>'}
            ${a?"":'<button type="button" class="btn btn-danger" id="delete-btn">🗑 Delete Bot</button>'}
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <button type="button" class="btn btn-ghost" id="cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary" id="save-btn">💾 ${a?"Create Bot":"Save Changes"}</button>
          </div>
        </div>
      </form>
    </div>
  `,[{input:"bot-temp",display:"temp-val"},{input:"bot-topp",display:"topp-val"},{input:"bot-pp",display:"pp-val"},{input:"bot-fp",display:"fp-val"}].forEach(({input:n,display:c})=>{const m=document.getElementById(n),p=document.getElementById(c);m.addEventListener("input",()=>{p.textContent=m.value})}),document.getElementById("back-btn").addEventListener("click",()=>{window.location.hash="#/"}),document.getElementById("cancel-btn").addEventListener("click",()=>{window.location.hash="#/"});const f=document.getElementById("clear-history-btn");f&&f.addEventListener("click",async()=>{try{const n=await u.getHistory(e.id);if(!n||n.length===0){i("No conversation history to clear","info");return}const c=n.map(b=>`  • ${b.guild_id==="DM"||!b.guild_id?"Direct Messages":`Server ${b.guild_id}`} (${b.message_count} messages)`).join(`
`),m=prompt(`Conversation history for "${e.name}":

${c}

Enter a server ID to clear just that server,
or type "all" to clear everything:`);if(m===null)return;const p=m.trim();if(!p)return;let E;if(p.toLowerCase()==="all"){if(!confirm(`Clear ALL conversation history for "${e.name}" across all servers?`))return;E=await u.clearHistory(e.id)}else{const b=n.find($=>$.guild_id===p||p.toLowerCase()==="dm"&&(!$.guild_id||$.guild_id==="DM"));if(!b){i("Server ID not found in history","error");return}E=await u.clearHistory(e.id,b.guild_id)}i(`History cleared (${E.messagesRemoved} messages removed)`,"success")}catch(n){i(n.message,"error")}});const g=document.getElementById("delete-btn");g&&g.addEventListener("click",async()=>{if(confirm(`Are you sure you want to delete "${e.name}"? This cannot be undone.`))try{await u.delete(e.id),i(`"${e.name}" deleted`,"info"),window.location.hash="#/"}catch(n){i(n.message,"error")}}),document.getElementById("bot-form").addEventListener("submit",async n=>{n.preventDefault();const c=document.getElementById("save-btn");c.disabled=!0,c.textContent="Saving…";const m={name:document.getElementById("bot-name").value.trim(),model:document.getElementById("bot-model").value.trim(),vision_model:document.getElementById("bot-vision-model").value.trim(),provider_id:parseInt(document.getElementById("bot-provider").value)||null,vision_provider_id:parseInt(document.getElementById("bot-vision-provider").value)||null,system_prompt:document.getElementById("bot-system").value,character_prompt:document.getElementById("bot-character").value,first_message:document.getElementById("bot-first-msg").value,example_messages:document.getElementById("bot-examples").value,prefill:document.getElementById("bot-prefill").value,temperature:parseFloat(document.getElementById("bot-temp").value),top_p:parseFloat(document.getElementById("bot-topp").value),max_tokens:parseInt(document.getElementById("bot-max-tokens").value),max_prompt_tokens:parseInt(document.getElementById("bot-max-prompt").value),presence_penalty:parseFloat(document.getElementById("bot-pp").value),frequency_penalty:parseFloat(document.getElementById("bot-fp").value),auto_start:document.getElementById("bot-autostart").checked},p=document.getElementById("bot-token").value.trim();if(p&&(m.discord_token=p),!m.name){i("Bot name is required","error"),c.disabled=!1,c.textContent=a?"Create Bot":"Save Changes";return}if(a&&!p){i("Discord token is required for new bots","error"),c.disabled=!1,c.textContent="Create Bot";return}try{a?(await u.create(m),i("Bot created!","success")):(await u.update(e.id,m),i("Bot updated!","success")),window.location.hash="#/"}catch(E){i(E.message,"error"),c.disabled=!1,c.textContent=a?"Create Bot":"Save Changes"}})}function v(t){if(!t)return"";const r=document.createElement("div");return r.textContent=t,r.innerHTML}function B(t){return t?t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}const D=Object.freeze(Object.defineProperty({__proto__:null,destroy:q,render:T},Symbol.toStringTag,{value:"Module"}));function j(){}async function M(t){t.innerHTML=`
    <div class="page">
      <div class="page-header">
        <h1>🔑 API Providers</h1>
        <button class="btn btn-primary" id="add-provider-btn">＋ New Provider</button>
      </div>
      <div id="provider-list" class="card-grid"></div>
    </div>
  `,document.getElementById("add-provider-btn").addEventListener("click",()=>_()),L()}async function L(){var r;const t=document.getElementById("provider-list");if(t)try{const a=await h.list();if(a.length===0){t.innerHTML=`
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🔑</div>
          <p>No API providers yet. Add one to connect your bots to an AI service.</p>
          <button class="btn btn-primary" id="empty-add-btn">＋ Add Provider</button>
        </div>
      `,(r=document.getElementById("empty-add-btn"))==null||r.addEventListener("click",()=>_());return}t.innerHTML=a.map(e=>`
      <div class="card">
        <div class="provider-card-header">
          <span class="provider-card-name">${P(e.name)}</span>
          <div class="provider-card-actions">
            <button class="btn-icon" data-edit-provider="${e.id}" title="Edit">✎</button>
            <button class="btn-icon danger" data-delete-provider="${e.id}" title="Delete">🗑</button>
          </div>
        </div>
        <div class="provider-card-url">${P(e.base_url)}</div>
      </div>
    `).join(""),t.querySelectorAll("[data-edit-provider]").forEach(e=>{e.addEventListener("click",()=>_(parseInt(e.dataset.editProvider)))}),t.querySelectorAll("[data-delete-provider]").forEach(e=>{e.addEventListener("click",async()=>{const o=parseInt(e.dataset.deleteProvider),s=a.find(l=>l.id===o);if(confirm(`Delete provider "${s==null?void 0:s.name}"? Bots using it will lose their API connection.`))try{await h.delete(o),i("Provider deleted","info"),L()}catch(l){i(l.message,"error")}})})}catch(a){t.innerHTML=`<p style="color: var(--danger);">Failed to load providers: ${a.message}</p>`}}async function _(t=null){var s;const r=t!==null;let a=null;if(r)try{a=await h.get(t)}catch(l){i(l.message,"error");return}(s=document.querySelector(".modal-overlay"))==null||s.remove();const e=document.createElement("div");e.className="modal-overlay",e.innerHTML=`
    <div class="modal">
      <div class="modal-header">
        <h2>${r?"Edit Provider":"New Provider"}</h2>
        <button class="btn-icon" id="modal-close">✕</button>
      </div>
      <form id="provider-form" autocomplete="off">
        <div class="form-group">
          <label class="form-label" for="prov-name">Name *</label>
          <input class="form-input" id="prov-name" type="text" placeholder="e.g. OpenRouter, My Local LLM" value="${C(a==null?void 0:a.name)}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="prov-url">Base URL</label>
          <input class="form-input" id="prov-url" type="url" placeholder="https://openrouter.ai/api/v1" value="${C((a==null?void 0:a.base_url)||"https://openrouter.ai/api/v1")}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="prov-key">API Key ${r?"(leave blank to keep current)":"*"}</label>
          <input class="form-input" id="prov-key" type="password" placeholder="${r?"••••••••":"sk-..."}" ${r?"":"required"} />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" id="modal-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">${r?"Save":"Create"}</button>
        </div>
      </form>
    </div>
  `,document.body.appendChild(e);const o=()=>e.remove();document.getElementById("modal-close").addEventListener("click",o),document.getElementById("modal-cancel").addEventListener("click",o),e.addEventListener("click",l=>{l.target===e&&o()}),document.getElementById("provider-form").addEventListener("submit",async l=>{l.preventDefault();const f={name:document.getElementById("prov-name").value.trim(),base_url:document.getElementById("prov-url").value.trim()||"https://openrouter.ai/api/v1"},g=document.getElementById("prov-key").value.trim();if(g&&(f.api_key=g),!f.name){i("Name is required","error");return}if(!r&&!g){i("API key is required","error");return}try{r?(await h.update(t,f),i("Provider updated!","success")):(await h.create(f),i("Provider created!","success")),o(),L()}catch(n){i(n.message,"error")}})}function P(t){if(!t)return"";const r=document.createElement("div");return r.textContent=t,r.innerHTML}function C(t){return t?t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}const F=Object.freeze(Object.defineProperty({__proto__:null,destroy:j,render:M},Symbol.toStringTag,{value:"Module"})),z=document.getElementById("app");let y=null;function U(t){return`
    <nav class="navbar">
      <div class="navbar-brand" onclick="location.hash='#/'">
        <span class="logo-icon">⚡</span>
        CordBridge
      </div>
      <div class="navbar-links">
        <a href="#/" class="${t==="dashboard"?"active":""}">Dashboard</a>
        <a href="#/providers" class="${t==="providers"?"active":""}">Providers</a>
      </div>
    </nav>
  `}async function A(){y!=null&&y.destroy&&y.destroy();const t=window.location.hash||"#/";let r="dashboard";t.startsWith("#/providers")?r="providers":t.startsWith("#/bots/")&&(r="botEditor"),z.innerHTML=U(r)+'<div id="page-content"></div>';const a=document.getElementById("page-content");if(r==="providers")y=F,await M(a);else if(r==="botEditor"){const e=t.split("/").pop();y=D,await T(a,e)}else y=N,S(a)}window.addEventListener("hashchange",A);window.addEventListener("DOMContentLoaded",()=>{window.location.hash||(window.location.hash="#/"),A()});
