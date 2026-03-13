(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))e(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const d of n.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&e(d)}).observe(document,{childList:!0,subtree:!0});function a(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function e(s){if(s.ep)return;s.ep=!0;const n=a(s);fetch(s.href,n)}})();const W="/api";async function u(t,r={}){const a=await fetch(`${W}${t}`,{headers:{"Content-Type":"application/json",...r.headers},...r}),e=await a.json();if(!a.ok)throw new Error(e.error||`Request failed (${a.status})`);return e}const E={list:()=>u("/providers"),get:t=>u(`/providers/${t}`),create:t=>u("/providers",{method:"POST",body:JSON.stringify(t)}),update:(t,r)=>u(`/providers/${t}`,{method:"PUT",body:JSON.stringify(r)}),delete:t=>u(`/providers/${t}`,{method:"DELETE"}),getModels:t=>u(`/providers/${t}/models`)},f={list:()=>u("/bots"),get:t=>u(`/bots/${t}`),create:t=>u("/bots",{method:"POST",body:JSON.stringify(t)}),update:(t,r)=>u(`/bots/${t}`,{method:"PUT",body:JSON.stringify(r)}),delete:t=>u(`/bots/${t}`,{method:"DELETE"}),start:t=>u(`/bots/${t}/start`,{method:"POST"}),stop:t=>u(`/bots/${t}/stop`,{method:"POST"}),getHistory:t=>u(`/bots/${t}/history`),clearHistory:(t,r)=>u(`/bots/${t}/history${r?`?guild_id=${r}`:""}`,{method:"DELETE"})},F={success:"✓",error:"✕",info:"ℹ"};function l(t,r="info",a=3500){const e=document.getElementById("toast-container"),s=document.createElement("div");s.className=`toast ${r}`,s.innerHTML=`
    <span class="toast-icon">${F[r]||F.info}</span>
    <span>${t}</span>
  `,e.appendChild(s),setTimeout(()=>{s.classList.add("fade-out"),s.addEventListener("animationend",()=>s.remove())},a)}let _=null;function R(t){t.innerHTML=`
    <div class="page">
      <div class="page-header">
        <h1>🤖 Dashboard</h1>
        <button class="btn btn-primary" id="add-bot-btn">＋ New Bot</button>
      </div>
      <div id="bot-list" class="card-grid"></div>
    </div>
  `,document.getElementById("add-bot-btn").addEventListener("click",()=>{window.location.hash="#/bots/new"}),M(),_=setInterval(M,5e3)}function G(){_&&(clearInterval(_),_=null)}async function M(){const t=document.getElementById("bot-list");if(t)try{const r=await f.list();if(r.length===0){t.innerHTML=`
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🤖</div>
          <p>No bots yet. Create your first bot to get started!</p>
          <button class="btn btn-primary" onclick="location.hash='#/bots/new'">＋ Create Bot</button>
        </div>
      `;return}t.innerHTML=r.map(a=>`
      <div class="card bot-card" data-bot-id="${a.id}">
        <div class="bot-card-header">
          <span class="bot-card-name">${T(a.name)}</span>
          <span class="status-badge ${a.online?"online":"offline"}">
            <span class="status-dot"></span>
            ${a.online?"Online":"Offline"}
          </span>
        </div>
        <div class="bot-card-meta">
          <div class="meta-row">
            <span class="meta-label">Model</span>
            <span>${T(a.model||"—")}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Provider</span>
            <span>${T(a.provider_name||"None")}</span>
          </div>
        </div>
        <div class="bot-card-actions">
          <button class="btn btn-sm ${a.online?"btn-danger":"btn-success"}" data-toggle-id="${a.id}">
            ${a.online?"⏹ Stop":"▶ Start"}
          </button>
          <button class="btn btn-sm btn-ghost" data-edit-id="${a.id}">✎ Edit</button>
        </div>
      </div>
    `).join(""),t.querySelectorAll("[data-toggle-id]").forEach(a=>{a.addEventListener("click",async e=>{e.stopPropagation();const s=parseInt(a.dataset.toggleId),n=r.find(d=>d.id===s);a.disabled=!0,a.textContent="…";try{n.online?(await f.stop(s),l(`"${n.name}" stopped`,"info")):(await f.start(s),l(`"${n.name}" started`,"success"))}catch(d){l(d.message,"error")}M()})}),t.querySelectorAll("[data-edit-id]").forEach(a=>{a.addEventListener("click",e=>{e.stopPropagation(),window.location.hash=`#/bots/${a.dataset.editId}`})}),t.querySelectorAll(".bot-card").forEach(a=>{a.addEventListener("click",()=>{window.location.hash=`#/bots/${a.dataset.botId}`})})}catch(r){t.innerHTML=`<p style="color: var(--danger);">Failed to load bots: ${r.message}</p>`}}function T(t){if(!t)return"";const r=document.createElement("div");return r.textContent=t,r.innerHTML}const Q=Object.freeze(Object.defineProperty({__proto__:null,destroy:G,render:R},Symbol.toStringTag,{value:"Module"}));function X(){}async function U(t,r){const a=r==="new";let e=null,s=[];try{s=await E.list(),a||(e=await f.get(parseInt(r)))}catch(o){t.innerHTML=`<div class="page"><p style="color:var(--danger)">Error loading data: ${o.message}</p></div>`;return}const n=a?"Create New Bot":`Edit — ${y(e.name)}`;t.innerHTML=`
    <div class="page" style="max-width: 760px;">
      <div class="page-header">
        <h1>${a?"🆕":"✎"} ${n}</h1>
        <button class="btn btn-ghost" id="back-btn">← Back</button>
      </div>

      <form id="bot-form" autocomplete="off">
        <!-- Identity -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Identity</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="bot-name">Bot Name *</label>
              <input class="form-input" id="bot-name" type="text" placeholder="My Cool Bot" value="${S(e==null?void 0:e.name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-token">Discord Token *</label>
              <input class="form-input" id="bot-token" type="password" placeholder="${a?"Paste your bot token":"••••••••  (leave blank to keep current)"}" />
            </div>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" for="bot-type">Bot Type</label>
            <select class="form-select" id="bot-type">
              <option value="real" ${(e==null?void 0:e.bot_type)!=="false"?"selected":""}>Real AI Bot</option>
              <option value="false" ${(e==null?void 0:e.bot_type)==="false"?"selected":""}>False Bot (Random Phrases)</option>
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
                ${s.map(o=>`
                  <option value="${o.id}" ${(e==null?void 0:e.provider_id)===o.id?"selected":""}>${y(o.name)}</option>
                `).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-model">Model ID</label>
              <input class="form-input" id="bot-model" type="text" list="bot-model-list" placeholder="deepseek/deepseek-v3.2" value="${S((e==null?void 0:e.model)||"deepseek/deepseek-v3.2")}" autocomplete="off" />
              <datalist id="bot-model-list"></datalist>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-vision-provider">Vision Provider (Optional)</label>
              <select class="form-select" id="bot-vision-provider">
                <option value="">— Same as Chat Provider —</option>
                ${s.map(o=>`
                  <option value="${o.id}" ${(e==null?void 0:e.vision_provider_id)===o.id?"selected":""}>${y(o.name)}</option>
                `).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-vision-model">Vision Model ID (Optional)</label>
              <input class="form-input" id="bot-vision-model" type="text" list="bot-vision-model-list" placeholder="openai/gpt-4o-mini" value="${S((e==null?void 0:e.vision_model)||"")}" autocomplete="off" />
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
            <textarea class="form-textarea" id="bot-system" rows="4" placeholder="Core instructions for the AI...">${y(e==null?void 0:e.system_prompt)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-character">Character Prompt</label>
            <textarea class="form-textarea" id="bot-character" rows="4" placeholder="Personality, style, behavior...">${y(e==null?void 0:e.character_prompt)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-first-msg">First Message (Identity Anchor)</label>
            <textarea class="form-textarea" id="bot-first-msg" rows="3" placeholder="An opening message the bot 'said' — always included in context to anchor its voice, even after clearing history...">${y(e==null?void 0:e.first_message)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-examples">Example Messages</label>
            <textarea class="form-textarea" id="bot-examples" rows="4" placeholder="Example messages showing how this character talks. Used as tone/style reference only...">${y(e==null?void 0:e.example_messages)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-prefill">Prefill (Assistant Start)</label>
            <textarea class="form-textarea" id="bot-prefill" rows="2" placeholder="Optional starting text...">${y(e==null?void 0:e.prefill)}</textarea>
          </div>
        </div>

        <!-- Parameters -->
        <div class="card" id="params-card" style="margin-bottom: 1.5rem;">
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

        <!-- False Bot Phrases -->
        <div class="card" id="false-phrases-card" style="margin-bottom: 1.5rem; display: none;">
          <h3 style="margin-bottom: 1rem;">False Bot Phrases</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">These phrases will be randomly selected when the bot is mentioned or replied to.</p>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
            <input class="form-input" id="new-phrase-input" type="text" placeholder="Add a new phrase..." style="flex: 1;" autocomplete="off" />
            <button type="button" class="btn btn-primary" id="add-phrase-btn">Add</button>
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
  `;const d=document.getElementById("bot-type"),g=document.getElementById("ai-config-card"),$=document.getElementById("prompts-card"),x=document.getElementById("params-card"),H=document.getElementById("false-phrases-card");let w=[];try{e&&e.false_phrases&&(w=JSON.parse(e.false_phrases||"[]"))}catch{}function N(){const o=d.value==="false";g&&(g.style.display=o?"none":"block"),$&&($.style.display=o?"none":"block"),x&&(x.style.display=o?"none":"block"),H&&(H.style.display=o?"block":"none")}d.addEventListener("change",N),N();const k=document.getElementById("phrases-list"),P=document.getElementById("new-phrase-input"),q=document.getElementById("add-phrase-btn");function C(){if(k.innerHTML="",w.length===0){k.innerHTML='<li style="padding: 0.75rem; text-align: center; color: var(--text-secondary);">No phrases added yet.</li>';return}w.forEach((o,m)=>{const p=document.createElement("li");p.style.cssText="padding: 0.75rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;";const i=document.createElement("span");i.textContent=o,i.style.wordBreak="break-word";const c=document.createElement("button");c.type="button",c.className="btn btn-ghost",c.style.padding="0.25rem 0.5rem",c.style.color="var(--danger)",c.textContent="✖",c.onclick=()=>{w.splice(m,1),C()},p.appendChild(i),p.appendChild(c),k.appendChild(p)})}C(),q.addEventListener("click",()=>{const o=P.value.trim();o&&(w.push(o),P.value="",C())}),P.addEventListener("keydown",o=>{o.key==="Enter"&&(o.preventDefault(),q.click())});const b=document.getElementById("bot-provider"),B=document.getElementById("bot-vision-provider");async function I(o,m){const p=document.getElementById(m);if(p.innerHTML="",!!o)try{const i=await E.getModels(o);i&&i.data&&Array.isArray(i.data)&&i.data.forEach(c=>{const v=document.createElement("option");v.value=c.id,c.name&&c.name!==c.id&&(v.textContent=c.name),p.appendChild(v)})}catch(i){console.error("Failed to load models:",i)}}b.addEventListener("change",()=>{I(b.value,"bot-model-list"),B.value||I(b.value,"bot-vision-model-list")}),B.addEventListener("change",()=>{I(B.value||b.value,"bot-vision-model-list")}),b.value&&I(b.value,"bot-model-list"),(B.value||b.value)&&I(B.value||b.value,"bot-vision-model-list"),[{input:"bot-temp",display:"temp-val"},{input:"bot-topp",display:"topp-val"},{input:"bot-pp",display:"pp-val"},{input:"bot-fp",display:"fp-val"}].forEach(({input:o,display:m})=>{const p=document.getElementById(o),i=document.getElementById(m);p.addEventListener("input",()=>{i.textContent=p.value})}),document.getElementById("back-btn").addEventListener("click",()=>{window.location.hash="#/"}),document.getElementById("cancel-btn").addEventListener("click",()=>{window.location.hash="#/"});const D=document.getElementById("clear-history-btn");D&&D.addEventListener("click",async()=>{try{const o=await f.getHistory(e.id);if(!o||o.length===0){l("No conversation history to clear","info");return}const m=o.map(v=>`  • ${v.guild_id==="DM"||!v.guild_id?"Direct Messages":`Server ${v.guild_id}`} (${v.message_count} messages)`).join(`
`),p=prompt(`Conversation history for "${e.name}":

${m}

Enter a server ID to clear just that server,
or type "all" to clear everything:`);if(p===null)return;const i=p.trim();if(!i)return;let c;if(i.toLowerCase()==="all"){if(!confirm(`Clear ALL conversation history for "${e.name}" across all servers?`))return;c=await f.clearHistory(e.id)}else{const v=o.find(L=>L.guild_id===i||i.toLowerCase()==="dm"&&(!L.guild_id||L.guild_id==="DM"));if(!v){l("Server ID not found in history","error");return}c=await f.clearHistory(e.id,v.guild_id)}l(`History cleared (${c.messagesRemoved} messages removed)`,"success")}catch(o){l(o.message,"error")}});const j=document.getElementById("delete-btn");j&&j.addEventListener("click",async()=>{if(confirm(`Are you sure you want to delete "${e.name}"? This cannot be undone.`))try{await f.delete(e.id),l(`"${e.name}" deleted`,"info"),window.location.hash="#/"}catch(o){l(o.message,"error")}}),document.getElementById("bot-form").addEventListener("submit",async o=>{o.preventDefault();const m=document.getElementById("save-btn");m.disabled=!0,m.textContent="Saving…";const p={name:document.getElementById("bot-name").value.trim(),model:document.getElementById("bot-model").value.trim(),vision_model:document.getElementById("bot-vision-model").value.trim(),provider_id:parseInt(document.getElementById("bot-provider").value)||null,vision_provider_id:parseInt(document.getElementById("bot-vision-provider").value)||null,bot_type:document.getElementById("bot-type").value,false_phrases:JSON.stringify(w),system_prompt:document.getElementById("bot-system").value,character_prompt:document.getElementById("bot-character").value,first_message:document.getElementById("bot-first-msg").value,example_messages:document.getElementById("bot-examples").value,prefill:document.getElementById("bot-prefill").value,temperature:parseFloat(document.getElementById("bot-temp").value),top_p:parseFloat(document.getElementById("bot-topp").value),max_tokens:parseInt(document.getElementById("bot-max-tokens").value),max_prompt_tokens:parseInt(document.getElementById("bot-max-prompt").value),presence_penalty:parseFloat(document.getElementById("bot-pp").value),frequency_penalty:parseFloat(document.getElementById("bot-fp").value),auto_start:document.getElementById("bot-autostart").checked},i=document.getElementById("bot-token").value.trim();if(i&&(p.discord_token=i),!p.name){l("Bot name is required","error"),m.disabled=!1,m.textContent=a?"Create Bot":"Save Changes";return}if(a&&!i){l("Discord token is required for new bots","error"),m.disabled=!1,m.textContent="Create Bot";return}try{a?(await f.create(p),l("Bot created!","success")):(await f.update(e.id,p),l("Bot updated!","success")),window.location.hash="#/"}catch(c){l(c.message,"error"),m.disabled=!1,m.textContent=a?"Create Bot":"Save Changes"}})}function y(t){if(!t)return"";const r=document.createElement("div");return r.textContent=t,r.innerHTML}function S(t){return t?t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}const Y=Object.freeze(Object.defineProperty({__proto__:null,destroy:X,render:U},Symbol.toStringTag,{value:"Module"}));function Z(){}async function V(t){t.innerHTML=`
    <div class="page">
      <div class="page-header">
        <h1>🔑 API Providers</h1>
        <button class="btn btn-primary" id="add-provider-btn">＋ New Provider</button>
      </div>
      <div id="provider-list" class="card-grid"></div>
    </div>
  `,document.getElementById("add-provider-btn").addEventListener("click",()=>A()),O()}async function O(){var r;const t=document.getElementById("provider-list");if(t)try{const a=await E.list();if(a.length===0){t.innerHTML=`
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🔑</div>
          <p>No API providers yet. Add one to connect your bots to an AI service.</p>
          <button class="btn btn-primary" id="empty-add-btn">＋ Add Provider</button>
        </div>
      `,(r=document.getElementById("empty-add-btn"))==null||r.addEventListener("click",()=>A());return}t.innerHTML=a.map(e=>`
      <div class="card">
        <div class="provider-card-header">
          <span class="provider-card-name">${z(e.name)}</span>
          <div class="provider-card-actions">
            <button class="btn-icon" data-edit-provider="${e.id}" title="Edit">✎</button>
            <button class="btn-icon danger" data-delete-provider="${e.id}" title="Delete">🗑</button>
          </div>
        </div>
        <div class="provider-card-url">${z(e.base_url)}</div>
      </div>
    `).join(""),t.querySelectorAll("[data-edit-provider]").forEach(e=>{e.addEventListener("click",()=>A(parseInt(e.dataset.editProvider)))}),t.querySelectorAll("[data-delete-provider]").forEach(e=>{e.addEventListener("click",async()=>{const s=parseInt(e.dataset.deleteProvider),n=a.find(d=>d.id===s);if(confirm(`Delete provider "${n==null?void 0:n.name}"? Bots using it will lose their API connection.`))try{await E.delete(s),l("Provider deleted","info"),O()}catch(d){l(d.message,"error")}})})}catch(a){t.innerHTML=`<p style="color: var(--danger);">Failed to load providers: ${a.message}</p>`}}async function A(t=null){var n;const r=t!==null;let a=null;if(r)try{a=await E.get(t)}catch(d){l(d.message,"error");return}(n=document.querySelector(".modal-overlay"))==null||n.remove();const e=document.createElement("div");e.className="modal-overlay",e.innerHTML=`
    <div class="modal">
      <div class="modal-header">
        <h2>${r?"Edit Provider":"New Provider"}</h2>
        <button class="btn-icon" id="modal-close">✕</button>
      </div>
      <form id="provider-form" autocomplete="off">
        <div class="form-group">
          <label class="form-label" for="prov-name">Name *</label>
          <input class="form-input" id="prov-name" type="text" placeholder="e.g. OpenRouter, My Local LLM" value="${J(a==null?void 0:a.name)}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="prov-url">Base URL</label>
          <input class="form-input" id="prov-url" type="url" placeholder="https://openrouter.ai/api/v1" value="${J((a==null?void 0:a.base_url)||"https://openrouter.ai/api/v1")}" />
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
  `,document.body.appendChild(e);const s=()=>e.remove();document.getElementById("modal-close").addEventListener("click",s),document.getElementById("modal-cancel").addEventListener("click",s),e.addEventListener("click",d=>{d.target===e&&s()}),document.getElementById("provider-form").addEventListener("submit",async d=>{d.preventDefault();const g={name:document.getElementById("prov-name").value.trim(),base_url:document.getElementById("prov-url").value.trim()||"https://openrouter.ai/api/v1"},$=document.getElementById("prov-key").value.trim();if($&&(g.api_key=$),!g.name){l("Name is required","error");return}if(!r&&!$){l("API key is required","error");return}try{r?(await E.update(t,g),l("Provider updated!","success")):(await E.create(g),l("Provider created!","success")),s(),O()}catch(x){l(x.message,"error")}})}function z(t){if(!t)return"";const r=document.createElement("div");return r.textContent=t,r.innerHTML}function J(t){return t?t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}const ee=Object.freeze(Object.defineProperty({__proto__:null,destroy:Z,render:V},Symbol.toStringTag,{value:"Module"})),te=document.getElementById("app");let h=null;function ae(t){return`
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
  `}async function K(){h!=null&&h.destroy&&h.destroy();const t=window.location.hash||"#/";let r="dashboard";t.startsWith("#/providers")?r="providers":t.startsWith("#/bots/")&&(r="botEditor"),te.innerHTML=ae(r)+'<div id="page-content"></div>';const a=document.getElementById("page-content");if(r==="providers")h=ee,await V(a);else if(r==="botEditor"){const e=t.split("/").pop();h=Y,await U(a,e)}else h=Q,R(a)}window.addEventListener("hashchange",K);window.addEventListener("DOMContentLoaded",()=>{window.location.hash||(window.location.hash="#/"),K()});
