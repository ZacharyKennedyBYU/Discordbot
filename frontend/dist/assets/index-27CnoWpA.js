(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))e(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&e(s)}).observe(document,{childList:!0,subtree:!0});function a(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerPolicy&&(i.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?i.credentials="include":r.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function e(r){if(r.ep)return;r.ep=!0;const i=a(r);fetch(r.href,i)}})();const q="/api";async function c(t,o={}){const a=await fetch(`${q}${t}`,{headers:{"Content-Type":"application/json",...o.headers},...o}),e=await a.json();if(!a.ok)throw new Error(e.error||`Request failed (${a.status})`);return e}const E={list:()=>c("/providers"),get:t=>c(`/providers/${t}`),create:t=>c("/providers",{method:"POST",body:JSON.stringify(t)}),update:(t,o)=>c(`/providers/${t}`,{method:"PUT",body:JSON.stringify(o)}),delete:t=>c(`/providers/${t}`,{method:"DELETE"}),getModels:t=>c(`/providers/${t}/models`)},b={list:()=>c("/bots"),get:t=>c(`/bots/${t}`),create:t=>c("/bots",{method:"POST",body:JSON.stringify(t)}),update:(t,o)=>c(`/bots/${t}`,{method:"PUT",body:JSON.stringify(o)}),delete:t=>c(`/bots/${t}`,{method:"DELETE"}),start:t=>c(`/bots/${t}/start`,{method:"POST"}),stop:t=>c(`/bots/${t}/stop`,{method:"POST"}),getHistory:t=>c(`/bots/${t}/history`),clearHistory:(t,o)=>c(`/bots/${t}/history${o?`?guild_id=${o}`:""}`,{method:"DELETE"})},M={success:"✓",error:"✕",info:"ℹ"};function l(t,o="info",a=3500){const e=document.getElementById("toast-container"),r=document.createElement("div");r.className=`toast ${o}`,r.innerHTML=`
    <span class="toast-icon">${M[o]||M.info}</span>
    <span>${t}</span>
  `,e.appendChild(r),setTimeout(()=>{r.classList.add("fade-out"),r.addEventListener("animationend",()=>r.remove())},a)}let w=null;function A(t){t.innerHTML=`
    <div class="page">
      <div class="page-header">
        <h1>🤖 Dashboard</h1>
        <button class="btn btn-primary" id="add-bot-btn">＋ New Bot</button>
      </div>
      <div id="bot-list" class="card-grid"></div>
    </div>
  `,document.getElementById("add-bot-btn").addEventListener("click",()=>{window.location.hash="#/bots/new"}),x(),w=setInterval(x,5e3)}function D(){w&&(clearInterval(w),w=null)}async function x(){const t=document.getElementById("bot-list");if(t)try{const o=await b.list();if(o.length===0){t.innerHTML=`
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🤖</div>
          <p>No bots yet. Create your first bot to get started!</p>
          <button class="btn btn-primary" onclick="location.hash='#/bots/new'">＋ Create Bot</button>
        </div>
      `;return}t.innerHTML=o.map(a=>`
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
    `).join(""),t.querySelectorAll("[data-toggle-id]").forEach(a=>{a.addEventListener("click",async e=>{e.stopPropagation();const r=parseInt(a.dataset.toggleId),i=o.find(s=>s.id===r);a.disabled=!0,a.textContent="…";try{i.online?(await b.stop(r),l(`"${i.name}" stopped`,"info")):(await b.start(r),l(`"${i.name}" started`,"success"))}catch(s){l(s.message,"error")}x()})}),t.querySelectorAll("[data-edit-id]").forEach(a=>{a.addEventListener("click",e=>{e.stopPropagation(),window.location.hash=`#/bots/${a.dataset.editId}`})}),t.querySelectorAll(".bot-card").forEach(a=>{a.addEventListener("click",()=>{window.location.hash=`#/bots/${a.dataset.botId}`})})}catch(o){t.innerHTML=`<p style="color: var(--danger);">Failed to load bots: ${o.message}</p>`}}function I(t){if(!t)return"";const o=document.createElement("div");return o.textContent=t,o.innerHTML}const j=Object.freeze(Object.defineProperty({__proto__:null,destroy:D,render:A},Symbol.toStringTag,{value:"Module"}));function F(){}async function O(t,o){const a=o==="new";let e=null,r=[];try{r=await E.list(),a||(e=await b.get(parseInt(o)))}catch(n){t.innerHTML=`<div class="page"><p style="color:var(--danger)">Error loading data: ${n.message}</p></div>`;return}const i=a?"Create New Bot":`Edit — ${g(e.name)}`;t.innerHTML=`
    <div class="page" style="max-width: 760px;">
      <div class="page-header">
        <h1>${a?"🆕":"✎"} ${i}</h1>
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
                ${r.map(n=>`
                  <option value="${n.id}" ${(e==null?void 0:e.provider_id)===n.id?"selected":""}>${g(n.name)}</option>
                `).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-model">Model ID</label>
              <input class="form-input" id="bot-model" type="text" list="bot-model-list" placeholder="deepseek/deepseek-v3.2" value="${B((e==null?void 0:e.model)||"deepseek/deepseek-v3.2")}" autocomplete="off" />
              <datalist id="bot-model-list"></datalist>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-vision-provider">Vision Provider (Optional)</label>
              <select class="form-select" id="bot-vision-provider">
                <option value="">— Same as Chat Provider —</option>
                ${r.map(n=>`
                  <option value="${n.id}" ${(e==null?void 0:e.vision_provider_id)===n.id?"selected":""}>${g(n.name)}</option>
                `).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-vision-model">Vision Model ID (Optional)</label>
              <input class="form-input" id="bot-vision-model" type="text" list="bot-vision-model-list" placeholder="openai/gpt-4o-mini" value="${B((e==null?void 0:e.vision_model)||"")}" autocomplete="off" />
              <datalist id="bot-vision-model-list"></datalist>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Used to read images attached to messages or replied-to messages.</p>
            </div>
          </div>
        </div>

        <!-- Prompts -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Prompts</h3>
          <div class="form-group">
            <label class="form-label" for="bot-system">System Prompt</label>
            <textarea class="form-textarea" id="bot-system" rows="4" placeholder="Core instructions for the AI...">${g(e==null?void 0:e.system_prompt)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-character">Character Prompt</label>
            <textarea class="form-textarea" id="bot-character" rows="4" placeholder="Personality, style, behavior...">${g(e==null?void 0:e.character_prompt)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-first-msg">First Message (Identity Anchor)</label>
            <textarea class="form-textarea" id="bot-first-msg" rows="3" placeholder="An opening message the bot 'said' — always included in context to anchor its voice, even after clearing history...">${g(e==null?void 0:e.first_message)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-examples">Example Messages</label>
            <textarea class="form-textarea" id="bot-examples" rows="4" placeholder="Example messages showing how this character talks. Used as tone/style reference only...">${g(e==null?void 0:e.example_messages)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-prefill">Prefill (Assistant Start)</label>
            <textarea class="form-textarea" id="bot-prefill" rows="2" placeholder="Optional starting text...">${g(e==null?void 0:e.prefill)}</textarea>
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
  `;const s=document.getElementById("bot-provider"),f=document.getElementById("bot-vision-provider");async function y(n,m){const p=document.getElementById(m);if(p.innerHTML="",!!n)try{const d=await E.getModels(n);d&&d.data&&Array.isArray(d.data)&&d.data.forEach(u=>{const v=document.createElement("option");v.value=u.id,u.name&&u.name!==u.id&&(v.textContent=u.name),p.appendChild(v)})}catch(d){console.error("Failed to load models:",d)}}s.addEventListener("change",()=>{y(s.value,"bot-model-list"),f.value||y(s.value,"bot-vision-model-list")}),f.addEventListener("change",()=>{y(f.value||s.value,"bot-vision-model-list")}),s.value&&y(s.value,"bot-model-list"),(f.value||s.value)&&y(f.value||s.value,"bot-vision-model-list"),[{input:"bot-temp",display:"temp-val"},{input:"bot-topp",display:"topp-val"},{input:"bot-pp",display:"pp-val"},{input:"bot-fp",display:"fp-val"}].forEach(({input:n,display:m})=>{const p=document.getElementById(n),d=document.getElementById(m);p.addEventListener("input",()=>{d.textContent=p.value})}),document.getElementById("back-btn").addEventListener("click",()=>{window.location.hash="#/"}),document.getElementById("cancel-btn").addEventListener("click",()=>{window.location.hash="#/"});const P=document.getElementById("clear-history-btn");P&&P.addEventListener("click",async()=>{try{const n=await b.getHistory(e.id);if(!n||n.length===0){l("No conversation history to clear","info");return}const m=n.map(v=>`  • ${v.guild_id==="DM"||!v.guild_id?"Direct Messages":`Server ${v.guild_id}`} (${v.message_count} messages)`).join(`
`),p=prompt(`Conversation history for "${e.name}":

${m}

Enter a server ID to clear just that server,
or type "all" to clear everything:`);if(p===null)return;const d=p.trim();if(!d)return;let u;if(d.toLowerCase()==="all"){if(!confirm(`Clear ALL conversation history for "${e.name}" across all servers?`))return;u=await b.clearHistory(e.id)}else{const v=n.find($=>$.guild_id===d||d.toLowerCase()==="dm"&&(!$.guild_id||$.guild_id==="DM"));if(!v){l("Server ID not found in history","error");return}u=await b.clearHistory(e.id,v.guild_id)}l(`History cleared (${u.messagesRemoved} messages removed)`,"success")}catch(n){l(n.message,"error")}});const C=document.getElementById("delete-btn");C&&C.addEventListener("click",async()=>{if(confirm(`Are you sure you want to delete "${e.name}"? This cannot be undone.`))try{await b.delete(e.id),l(`"${e.name}" deleted`,"info"),window.location.hash="#/"}catch(n){l(n.message,"error")}}),document.getElementById("bot-form").addEventListener("submit",async n=>{n.preventDefault();const m=document.getElementById("save-btn");m.disabled=!0,m.textContent="Saving…";const p={name:document.getElementById("bot-name").value.trim(),model:document.getElementById("bot-model").value.trim(),vision_model:document.getElementById("bot-vision-model").value.trim(),provider_id:parseInt(document.getElementById("bot-provider").value)||null,vision_provider_id:parseInt(document.getElementById("bot-vision-provider").value)||null,system_prompt:document.getElementById("bot-system").value,character_prompt:document.getElementById("bot-character").value,first_message:document.getElementById("bot-first-msg").value,example_messages:document.getElementById("bot-examples").value,prefill:document.getElementById("bot-prefill").value,temperature:parseFloat(document.getElementById("bot-temp").value),top_p:parseFloat(document.getElementById("bot-topp").value),max_tokens:parseInt(document.getElementById("bot-max-tokens").value),max_prompt_tokens:parseInt(document.getElementById("bot-max-prompt").value),presence_penalty:parseFloat(document.getElementById("bot-pp").value),frequency_penalty:parseFloat(document.getElementById("bot-fp").value),auto_start:document.getElementById("bot-autostart").checked},d=document.getElementById("bot-token").value.trim();if(d&&(p.discord_token=d),!p.name){l("Bot name is required","error"),m.disabled=!1,m.textContent=a?"Create Bot":"Save Changes";return}if(a&&!d){l("Discord token is required for new bots","error"),m.disabled=!1,m.textContent="Create Bot";return}try{a?(await b.create(p),l("Bot created!","success")):(await b.update(e.id,p),l("Bot updated!","success")),window.location.hash="#/"}catch(u){l(u.message,"error"),m.disabled=!1,m.textContent=a?"Create Bot":"Save Changes"}})}function g(t){if(!t)return"";const o=document.createElement("div");return o.textContent=t,o.innerHTML}function B(t){return t?t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}const z=Object.freeze(Object.defineProperty({__proto__:null,destroy:F,render:O},Symbol.toStringTag,{value:"Module"}));function U(){}async function H(t){t.innerHTML=`
    <div class="page">
      <div class="page-header">
        <h1>🔑 API Providers</h1>
        <button class="btn btn-primary" id="add-provider-btn">＋ New Provider</button>
      </div>
      <div id="provider-list" class="card-grid"></div>
    </div>
  `,document.getElementById("add-provider-btn").addEventListener("click",()=>L()),_()}async function _(){var o;const t=document.getElementById("provider-list");if(t)try{const a=await E.list();if(a.length===0){t.innerHTML=`
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🔑</div>
          <p>No API providers yet. Add one to connect your bots to an AI service.</p>
          <button class="btn btn-primary" id="empty-add-btn">＋ Add Provider</button>
        </div>
      `,(o=document.getElementById("empty-add-btn"))==null||o.addEventListener("click",()=>L());return}t.innerHTML=a.map(e=>`
      <div class="card">
        <div class="provider-card-header">
          <span class="provider-card-name">${S(e.name)}</span>
          <div class="provider-card-actions">
            <button class="btn-icon" data-edit-provider="${e.id}" title="Edit">✎</button>
            <button class="btn-icon danger" data-delete-provider="${e.id}" title="Delete">🗑</button>
          </div>
        </div>
        <div class="provider-card-url">${S(e.base_url)}</div>
      </div>
    `).join(""),t.querySelectorAll("[data-edit-provider]").forEach(e=>{e.addEventListener("click",()=>L(parseInt(e.dataset.editProvider)))}),t.querySelectorAll("[data-delete-provider]").forEach(e=>{e.addEventListener("click",async()=>{const r=parseInt(e.dataset.deleteProvider),i=a.find(s=>s.id===r);if(confirm(`Delete provider "${i==null?void 0:i.name}"? Bots using it will lose their API connection.`))try{await E.delete(r),l("Provider deleted","info"),_()}catch(s){l(s.message,"error")}})})}catch(a){t.innerHTML=`<p style="color: var(--danger);">Failed to load providers: ${a.message}</p>`}}async function L(t=null){var i;const o=t!==null;let a=null;if(o)try{a=await E.get(t)}catch(s){l(s.message,"error");return}(i=document.querySelector(".modal-overlay"))==null||i.remove();const e=document.createElement("div");e.className="modal-overlay",e.innerHTML=`
    <div class="modal">
      <div class="modal-header">
        <h2>${o?"Edit Provider":"New Provider"}</h2>
        <button class="btn-icon" id="modal-close">✕</button>
      </div>
      <form id="provider-form" autocomplete="off">
        <div class="form-group">
          <label class="form-label" for="prov-name">Name *</label>
          <input class="form-input" id="prov-name" type="text" placeholder="e.g. OpenRouter, My Local LLM" value="${T(a==null?void 0:a.name)}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="prov-url">Base URL</label>
          <input class="form-input" id="prov-url" type="url" placeholder="https://openrouter.ai/api/v1" value="${T((a==null?void 0:a.base_url)||"https://openrouter.ai/api/v1")}" />
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
  `,document.body.appendChild(e);const r=()=>e.remove();document.getElementById("modal-close").addEventListener("click",r),document.getElementById("modal-cancel").addEventListener("click",r),e.addEventListener("click",s=>{s.target===e&&r()}),document.getElementById("provider-form").addEventListener("submit",async s=>{s.preventDefault();const f={name:document.getElementById("prov-name").value.trim(),base_url:document.getElementById("prov-url").value.trim()||"https://openrouter.ai/api/v1"},y=document.getElementById("prov-key").value.trim();if(y&&(f.api_key=y),!f.name){l("Name is required","error");return}if(!o&&!y){l("API key is required","error");return}try{o?(await E.update(t,f),l("Provider updated!","success")):(await E.create(f),l("Provider created!","success")),r(),_()}catch(k){l(k.message,"error")}})}function S(t){if(!t)return"";const o=document.createElement("div");return o.textContent=t,o.innerHTML}function T(t){return t?t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}const J=Object.freeze(Object.defineProperty({__proto__:null,destroy:U,render:H},Symbol.toStringTag,{value:"Module"})),R=document.getElementById("app");let h=null;function K(t){return`
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
  `}async function N(){h!=null&&h.destroy&&h.destroy();const t=window.location.hash||"#/";let o="dashboard";t.startsWith("#/providers")?o="providers":t.startsWith("#/bots/")&&(o="botEditor"),R.innerHTML=K(o)+'<div id="page-content"></div>';const a=document.getElementById("page-content");if(o==="providers")h=J,await H(a);else if(o==="botEditor"){const e=t.split("/").pop();h=z,await O(a,e)}else h=j,A(a)}window.addEventListener("hashchange",N);window.addEventListener("DOMContentLoaded",()=>{window.location.hash||(window.location.hash="#/"),N()});
