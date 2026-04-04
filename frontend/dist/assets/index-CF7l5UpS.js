(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))e(i);new MutationObserver(i=>{for(const m of i)if(m.type==="childList")for(const d of m.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&e(d)}).observe(document,{childList:!0,subtree:!0});function r(i){const m={};return i.integrity&&(m.integrity=i.integrity),i.referrerPolicy&&(m.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?m.credentials="include":i.crossOrigin==="anonymous"?m.credentials="omit":m.credentials="same-origin",m}function e(i){if(i.ep)return;i.ep=!0;const m=r(i);fetch(i.href,m)}})();const de="/api";async function v(t,a={}){const r=await fetch(`${de}${t}`,{headers:{"Content-Type":"application/json",...a.headers},...a}),e=await r.json();if(!r.ok)throw new Error(e.error||`Request failed (${r.status})`);return e}const ge=async t=>{const a=new FormData;a.append("file",t);const r=await fetch(`${de}/upload`,{method:"POST",body:a}),e=await r.json();if(!r.ok)throw new Error(e.error||`Upload failed (${r.status})`);return e},_={list:()=>v("/providers"),get:t=>v(`/providers/${t}`),create:t=>v("/providers",{method:"POST",body:JSON.stringify(t)}),update:(t,a)=>v(`/providers/${t}`,{method:"PUT",body:JSON.stringify(a)}),delete:t=>v(`/providers/${t}`,{method:"DELETE"}),getModels:t=>v(`/providers/${t}/models`)},f={list:()=>v("/bots"),get:t=>v(`/bots/${t}`),create:t=>v("/bots",{method:"POST",body:JSON.stringify(t)}),update:(t,a)=>v(`/bots/${t}`,{method:"PUT",body:JSON.stringify(a)}),delete:t=>v(`/bots/${t}`,{method:"DELETE"}),start:t=>v(`/bots/${t}/start`,{method:"POST"}),stop:t=>v(`/bots/${t}/stop`,{method:"POST"}),getHistory:t=>v(`/bots/${t}/history`),clearHistory:(t,a)=>v(`/bots/${t}/history${a?`?guild_id=${a}`:""}`,{method:"DELETE"}),getLorebooks:t=>v(`/bots/${t}/lorebooks`),attachLorebook:(t,a)=>v(`/bots/${t}/lorebooks`,{method:"POST",body:JSON.stringify({lorebook_id:a})}),updateLorebook:(t,a,r)=>v(`/bots/${t}/lorebooks/${a}`,{method:"PUT",body:JSON.stringify({overrides:r})}),detachLorebook:(t,a)=>v(`/bots/${t}/lorebooks/${a}`,{method:"DELETE"})},M={list:()=>v("/lorebooks"),get:t=>v(`/lorebooks/${t}`),create:t=>v("/lorebooks",{method:"POST",body:JSON.stringify(t)}),delete:t=>v(`/lorebooks/${t}`,{method:"DELETE"})},ne={success:"✓",error:"✕",info:"ℹ"};function p(t,a="info",r=3500){const e=document.getElementById("toast-container"),i=document.createElement("div");i.className=`toast ${a}`,i.innerHTML=`
    <span class="toast-icon">${ne[a]||ne.info}</span>
    <span>${t}</span>
  `,e.appendChild(i),setTimeout(()=>{i.classList.add("fade-out"),i.addEventListener("animationend",()=>i.remove())},r)}let H=null;function ce(t){t.innerHTML=`
    <div class="page">
      <div class="page-header">
        <h1>🤖 Dashboard</h1>
        <button class="btn btn-primary" id="add-bot-btn">＋ New Bot</button>
      </div>
      <div id="bot-list" class="card-grid"></div>
    </div>
  `,document.getElementById("add-bot-btn").addEventListener("click",()=>{window.location.hash="#/bots/new"}),R(),H=setInterval(R,5e3)}function he(){H&&(clearInterval(H),H=null)}async function R(){const t=document.getElementById("bot-list");if(t)try{const a=await f.list();if(a.length===0){t.innerHTML=`
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🤖</div>
          <p>No bots yet. Create your first bot to get started!</p>
          <button class="btn btn-primary" onclick="location.hash='#/bots/new'">＋ Create Bot</button>
        </div>
      `;return}t.innerHTML=a.map(r=>`
      <div class="card bot-card" data-bot-id="${r.id}">
        <div class="bot-card-header">
          <span class="bot-card-name">${V(r.name)}</span>
          <span class="status-badge ${r.online?"online":"offline"}">
            <span class="status-dot"></span>
            ${r.online?"Online":"Offline"}
          </span>
        </div>
        <div class="bot-card-meta">
          <div class="meta-row">
            <span class="meta-label">Model</span>
            <span>${V(r.model||"—")}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Provider</span>
            <span>${V(r.provider_name||"None")}</span>
          </div>
        </div>
        <div class="bot-card-actions">
          <button class="btn btn-sm ${r.online?"btn-danger":"btn-success"}" data-toggle-id="${r.id}">
            ${r.online?"⏹ Stop":"▶ Start"}
          </button>
          <button class="btn btn-sm btn-ghost" data-edit-id="${r.id}">✎ Edit</button>
        </div>
      </div>
    `).join(""),t.querySelectorAll("[data-toggle-id]").forEach(r=>{r.addEventListener("click",async e=>{e.stopPropagation();const i=parseInt(r.dataset.toggleId),m=a.find(d=>d.id===i);r.disabled=!0,r.textContent="…";try{m.online?(await f.stop(i),p(`"${m.name}" stopped`,"info")):(await f.start(i),p(`"${m.name}" started`,"success"))}catch(d){p(d.message,"error")}R()})}),t.querySelectorAll("[data-edit-id]").forEach(r=>{r.addEventListener("click",e=>{e.stopPropagation(),window.location.hash=`#/bots/${r.dataset.editId}`})}),t.querySelectorAll(".bot-card").forEach(r=>{r.addEventListener("click",()=>{window.location.hash=`#/bots/${r.dataset.botId}`})})}catch(a){t.innerHTML=`<p style="color: var(--danger);">Failed to load bots: ${a.message}</p>`}}function V(t){if(!t)return"";const a=document.createElement("div");return a.textContent=t,a.innerHTML}const Ee=Object.freeze(Object.defineProperty({__proto__:null,destroy:he,render:ce},Symbol.toStringTag,{value:"Module"}));function ke(){}async function pe(t,a){const r=a==="new";let e=null,i=[],m=[],d=[];try{i=await _.list(),m=await M.list(),r||(e=await f.get(parseInt(a)),d=await f.getLorebooks(parseInt(a)))}catch(o){t.innerHTML=`<div class="page"><p style="color:var(--danger)">Error loading data: ${o.message}</p></div>`;return}const y=r?"Create New Bot":`Edit — ${E(e.name)}`;function g(o){if(!o)return"";try{const s=JSON.parse(o);if(Array.isArray(s))return s.join(", ")}catch{}return""}t.innerHTML=`
    <div class="page" style="max-width: 760px;">
      <div class="page-header">
        <h1>${r?"🆕":"✎"} ${y}</h1>
        <button class="btn btn-ghost" id="back-btn">← Back</button>
      </div>

      <form id="bot-form" autocomplete="off">
        <!-- Identity -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Identity</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="bot-name">Bot Name *</label>
              <input class="form-input" id="bot-name" type="text" placeholder="My Cool Bot" value="${A(e==null?void 0:e.name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-token">Discord Token *</label>
              <input class="form-input" id="bot-token" type="password" placeholder="${r?"Paste your bot token":"••••••••  (leave blank to keep current)"}" />
            </div>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" for="bot-type">Bot Type</label>
            <select class="form-select" id="bot-type">
              <option value="real" ${(e==null?void 0:e.bot_type)!=="false"?"selected":""}>Real AI Bot</option>
              <option value="false" ${(e==null?void 0:e.bot_type)==="false"?"selected":""}>False Bot (Random Phrases)</option>
            </select>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" for="bot-allowed-guilds">Allowed Server IDs (Comma separated, leave empty for all servers)</label>
            <input class="form-input" id="bot-allowed-guilds" type="text" placeholder="1234567890, 0987654321" value="${A(g(e==null?void 0:e.allowed_guilds))}" />
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
                ${i.map(o=>`
                  <option value="${o.id}" ${(e==null?void 0:e.provider_id)===o.id?"selected":""}>${E(o.name)}</option>
                `).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-model">Model ID</label>
              <input class="form-input" id="bot-model" type="text" list="bot-model-list" placeholder="deepseek/deepseek-v3.2" value="${A((e==null?void 0:e.model)||"deepseek/deepseek-v3.2")}" autocomplete="off" />
              <datalist id="bot-model-list"></datalist>
            </div>
            <div class="form-group" id="use-chat-vision-group" style="display: none; margin-top: -0.5rem; margin-bottom: 1rem;">
              <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); cursor: pointer;">
                <input type="checkbox" id="use-chat-vision" ${e!=null&&e.use_chat_vision?"checked":""} style="width: 16px; height: 16px; margin: 0; cursor: pointer;" />
                Use this chat model natively for reading images 👓
              </label>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-vision-provider">Vision Provider (Optional)</label>
              <select class="form-select" id="bot-vision-provider">
                <option value="">— Same as Chat Provider —</option>
                ${i.map(o=>`
                  <option value="${o.id}" ${(e==null?void 0:e.vision_provider_id)===o.id?"selected":""}>${E(o.name)}</option>
                `).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-vision-model">Vision Model ID (Optional)</label>
              <input class="form-input" id="bot-vision-model" type="text" list="bot-vision-model-list" placeholder="openai/gpt-4o-mini" value="${A((e==null?void 0:e.vision_model)||"")}" autocomplete="off" />
              <datalist id="bot-vision-model-list"></datalist>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Used to read images attached to messages or replied-to messages.</p>
            </div>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" for="bot-providers-order">OpenRouter Providers (Optional, Comma separated)</label>
            <input class="form-input" id="bot-providers-order" type="text" placeholder="Anthropic, Google, Together" value="${A(g(e==null?void 0:e.providers_order))}" />
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Forces OpenRouter to use specifically these providers in this order if available.</p>
          </div>
        </div>

        <!-- Prompts -->
        <div class="card" id="prompts-card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Prompts</h3>
          <div class="form-group">
            <label class="form-label" for="bot-system">System Prompt</label>
            <textarea class="form-textarea" id="bot-system" rows="4" placeholder="Core instructions for the AI...">${E(e==null?void 0:e.system_prompt)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-character">Character Prompt</label>
            <textarea class="form-textarea" id="bot-character" rows="4" placeholder="Personality, style, behavior...">${E(e==null?void 0:e.character_prompt)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-first-msg">First Message (Identity Anchor)</label>
            <textarea class="form-textarea" id="bot-first-msg" rows="3" placeholder="An opening message the bot 'said' — always included in context to anchor its voice, even after clearing history...">${E(e==null?void 0:e.first_message)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-examples">Example Messages</label>
            <textarea class="form-textarea" id="bot-examples" rows="4" placeholder="Example messages showing how this character talks. Used as tone/style reference only...">${E(e==null?void 0:e.example_messages)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bot-prefill">Prefill (Assistant Start)</label>
            <textarea class="form-textarea" id="bot-prefill" rows="2" placeholder="Optional starting text...">${E(e==null?void 0:e.prefill)}</textarea>
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
              <input type="checkbox" id="bot-autostart" ${e!=null&&e.auto_start?"checked":""} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; gap: 0.75rem;">
            ${r?"":'<button type="button" class="btn btn-ghost" id="clear-history-btn">🧹 Clear History</button>'}
            ${r?"":'<button type="button" class="btn btn-danger" id="delete-btn">🗑 Delete Bot</button>'}
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <button type="button" class="btn btn-ghost" id="cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary" id="save-btn">💾 ${r?"Create Bot":"Save Changes"}</button>
          </div>
        </div>
      </form>
    </div>
  `;const h=document.getElementById("bot-type"),I=document.getElementById("ai-config-card"),B=document.getElementById("prompts-card"),K=document.getElementById("params-card"),Q=document.getElementById("false-phrases-card"),X=document.getElementById("lorebooks-card");let L=[];try{e&&e.false_phrases&&(L=JSON.parse(e.false_phrases||"[]"))}catch{}function Y(){const o=h.value==="false";I&&(I.style.display=o?"none":"block"),B&&(B.style.display=o?"none":"block"),K&&(K.style.display=o?"none":"block"),X&&(X.style.display=o?"none":"block"),Q&&(Q.style.display=o?"block":"none")}h.addEventListener("change",Y),Y();const j=document.getElementById("lb-attach-select"),be=document.getElementById("lb-attach-btn"),S=document.getElementById("attached-lorebooks");let k={};for(const o of d)try{k[o.lorebook_id]=typeof o.overrides=="string"?JSON.parse(o.overrides||"{}"):o.overrides||{}}catch{k[o.lorebook_id]={}}function D(){j.innerHTML='<option value="">— Select a lorebook to attach —</option>';const o=d.map(l=>l.lorebook_id);m.filter(l=>!o.includes(l.id)).forEach(l=>{const n=document.createElement("option");n.value=l.id,n.textContent=`${l.name} (${l.entry_count||0} entries)`,j.appendChild(n)})}D();function Z(o){return o==="sun"?"☀️":o==="off"?"✖":"🌙"}function fe(o){return o==="moon"?"sun":o==="sun"?"off":"moon"}function q(){if(d.length===0){S.innerHTML='<p style="color: var(--text-secondary); text-align: center;">No lorebooks attached.</p>';return}S.innerHTML=d.map(o=>{let s=[];try{const n=typeof o.data=="string"?JSON.parse(o.data):o.data;n.entries&&(s=Object.entries(n.entries))}catch{}const l=k[o.lorebook_id]||{};return`
        <div class="lb-attached-item" data-lbid="${o.lorebook_id}">
          <div class="lb-attached-header">
            <div style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;" class="lb-toggle-expand">
              <span class="lb-expand-arrow">▶</span>
              <strong>${E(o.name)}</strong>
              <span style="color: var(--text-secondary); font-size: 0.85rem;">${s.length} entries</span>
            </div>
            <button type="button" class="btn btn-ghost" data-detach-lb="${o.lorebook_id}" style="padding: 0.25rem 0.5rem; color: var(--danger); font-size: 0.8rem;">Detach</button>
          </div>
          <div class="lb-entries-list" style="display: none;">
            ${s.map(([n,c])=>{const u=l[n]||"moon",b=c.comment||c.name||`Entry ${n}`,$=(Array.isArray(c.key)?c.key:c.keys||[]).join(", ");return`
                <div class="lb-entry-row">
                  <button type="button" class="lb-state-btn" data-lbid="${o.lorebook_id}" data-uid="${n}" data-state="${u}" title="Click to cycle: 🌙 mentioned → ☀️ always → ✖ off">
                    ${Z(u)}
                  </button>
                  <div class="lb-entry-info">
                    <span class="lb-entry-name">${E(b)}</span>
                    <span class="lb-entry-keys">${E($)}</span>
                  </div>
                </div>
              `}).join("")}
          </div>
        </div>
      `}).join(""),S.querySelectorAll(".lb-toggle-expand").forEach(o=>{o.addEventListener("click",()=>{const s=o.closest(".lb-attached-item"),l=s.querySelector(".lb-entries-list"),n=s.querySelector(".lb-expand-arrow"),c=l.style.display!=="none";l.style.display=c?"none":"block",n.textContent=c?"▶":"▼"})}),S.querySelectorAll(".lb-state-btn").forEach(o=>{o.addEventListener("click",()=>{const s=o.dataset.lbid,l=o.dataset.uid,n=o.dataset.state,c=fe(n);o.dataset.state=c,o.textContent=Z(c),k[s]||(k[s]={}),k[s][l]=c})}),S.querySelectorAll("[data-detach-lb]").forEach(o=>{o.addEventListener("click",async()=>{const s=parseInt(o.dataset.detachLb),l=d.find(n=>n.lorebook_id===s);if(confirm(`Detach lorebook "${l==null?void 0:l.name}" from this bot?`))try{r||await f.detachLorebook(parseInt(a),s),d=d.filter(n=>n.lorebook_id!==s),delete k[s],q(),D(),p("Lorebook detached","success")}catch(n){p(n.message,"error")}})})}q(),be.addEventListener("click",async()=>{const o=parseInt(j.value);if(!o)return p("Select a lorebook first","error");try{r||await f.attachLorebook(parseInt(a),o);const s=await M.get(o),l=m.find(n=>n.id===o);d.push({lorebook_id:o,name:(l==null?void 0:l.name)||s.name,data:s.data,overrides:"{}"}),k[o]={},q(),D(),p("Lorebook attached","success")}catch(s){p(s.message,"error")}});const F=document.getElementById("phrases-list"),J=document.getElementById("new-phrase-input"),ee=document.getElementById("add-phrase-btn"),te=document.getElementById("new-audio-input"),C=document.getElementById("add-audio-btn");function O(){if(F.innerHTML="",L.length===0){F.innerHTML='<li style="padding: 0.75rem; text-align: center; color: var(--text-secondary);">No phrases added yet.</li>';return}L.forEach((o,s)=>{const l=document.createElement("li");l.style.cssText="padding: 0.75rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;";const n=document.createElement("span");n.style.wordBreak="break-word",typeof o=="string"?n.textContent=o:o.type==="audio"&&(n.innerHTML=`🎵 <strong>Audio:</strong> ${E(o.originalName||"response.mp3")}`);const c=document.createElement("button");c.type="button",c.className="btn btn-ghost",c.style.padding="0.25rem 0.5rem",c.style.color="var(--danger)",c.textContent="✖",c.onclick=()=>{L.splice(s,1),O()},l.appendChild(n),l.appendChild(c),F.appendChild(l)})}O(),ee.addEventListener("click",()=>{const o=J.value.trim();o&&(L.push(o),J.value="",O())}),J.addEventListener("keydown",o=>{o.key==="Enter"&&(o.preventDefault(),ee.click())}),C.addEventListener("click",async()=>{const o=te.files[0];if(!o)return p("Please select a file first","error");try{C.disabled=!0,C.textContent="Uploading...";const s=await ge(o);L.push({type:"audio",path:s.path,originalName:s.originalname}),te.value="",O(),p("Audio uploaded successfully","success")}catch(s){p(s.message,"error")}finally{C.disabled=!1,C.textContent="Upload MP3"}});const w=document.getElementById("bot-provider"),P=document.getElementById("bot-vision-provider"),U=document.getElementById("bot-model"),oe=document.getElementById("use-chat-vision-group"),ae=document.getElementById("use-chat-vision");let N=[];function ye(o){if(!N||N.length===0)return!1;const s=N.find(c=>c.id===o);if(!s||!s.architecture)return!1;s.architecture.instruct_type;const l=s.architecture.modality||"",n=Array.isArray(s.architecture.input_modalities)?s.architecture.input_modalities.join(","):"";return l.includes("image")||n.includes("image")}function z(){const o=U.value.trim();ye(o)?oe.style.display="block":(oe.style.display="none",ae&&(ae.checked=!1))}U.addEventListener("input",z),U.addEventListener("change",z);async function T(o,s){const l=document.getElementById(s);if(l.innerHTML="",!!o)try{const n=await _.getModels(o);n&&n.data&&Array.isArray(n.data)&&(s==="bot-model-list"&&(N=n.data),n.data.forEach(c=>{const u=document.createElement("option");u.value=c.id;let b=c.name&&c.name!==c.id?c.name:"";s==="bot-model-list"&&(c.architecture&&c.architecture.modality&&c.architecture.modality.includes("image")||c.architecture&&Array.isArray(c.architecture.input_modalities)&&c.architecture.input_modalities.includes("image"))&&(b+=" 👓"),b&&(u.textContent=b),l.appendChild(u)}),s==="bot-model-list"&&z())}catch(n){console.error("Failed to load models:",n)}}w.addEventListener("change",()=>{T(w.value,"bot-model-list"),P.value||T(w.value,"bot-vision-model-list")}),P.addEventListener("change",()=>{T(P.value||w.value,"bot-vision-model-list")}),w.value&&T(w.value,"bot-model-list"),(P.value||w.value)&&T(P.value||w.value,"bot-vision-model-list"),[{input:"bot-temp",display:"temp-val"},{input:"bot-topp",display:"topp-val"},{input:"bot-pp",display:"pp-val"},{input:"bot-fp",display:"fp-val"}].forEach(({input:o,display:s})=>{const l=document.getElementById(o),n=document.getElementById(s);l.addEventListener("input",()=>{n.textContent=l.value})}),document.getElementById("back-btn").addEventListener("click",()=>{window.location.hash="#/"}),document.getElementById("cancel-btn").addEventListener("click",()=>{window.location.hash="#/"});const re=document.getElementById("clear-history-btn");re&&re.addEventListener("click",async()=>{try{const o=await f.getHistory(e.id);if(!o||o.length===0){p("No conversation history to clear","info");return}const s=o.map(u=>`  • ${u.guild_id==="DM"||!u.guild_id?"Direct Messages":`Server ${u.guild_id}`} (${u.message_count} messages)`).join(`
`),l=prompt(`Conversation history for "${e.name}":

${s}

Enter a server ID to clear just that server,
or type "all" to clear everything:`);if(l===null)return;const n=l.trim();if(!n)return;let c;if(n.toLowerCase()==="all"){if(!confirm(`Clear ALL conversation history for "${e.name}" across all servers?`))return;c=await f.clearHistory(e.id)}else{const u=o.find(b=>b.guild_id===n||n.toLowerCase()==="dm"&&(!b.guild_id||b.guild_id==="DM"));if(!u){p("Server ID not found in history","error");return}c=await f.clearHistory(e.id,u.guild_id)}p(`History cleared (${c.messagesRemoved} messages removed)`,"success")}catch(o){p(o.message,"error")}});const se=document.getElementById("delete-btn");se&&se.addEventListener("click",async()=>{if(confirm(`Are you sure you want to delete "${e.name}"? This cannot be undone.`))try{await f.delete(e.id),p(`"${e.name}" deleted`,"info"),window.location.hash="#/"}catch(o){p(o.message,"error")}}),document.getElementById("bot-form").addEventListener("submit",async o=>{var c;o.preventDefault();const s=document.getElementById("save-btn");s.disabled=!0,s.textContent="Saving…";const l={name:document.getElementById("bot-name").value.trim(),model:document.getElementById("bot-model").value.trim(),vision_model:document.getElementById("bot-vision-model").value.trim(),use_chat_vision:((c=document.getElementById("use-chat-vision"))==null?void 0:c.checked)||!1,provider_id:parseInt(document.getElementById("bot-provider").value)||null,vision_provider_id:parseInt(document.getElementById("bot-vision-provider").value)||null,bot_type:document.getElementById("bot-type").value,false_phrases:JSON.stringify(L),system_prompt:document.getElementById("bot-system").value,character_prompt:document.getElementById("bot-character").value,first_message:document.getElementById("bot-first-msg").value,example_messages:document.getElementById("bot-examples").value,prefill:document.getElementById("bot-prefill").value,temperature:parseFloat(document.getElementById("bot-temp").value),top_p:parseFloat(document.getElementById("bot-topp").value),max_tokens:parseInt(document.getElementById("bot-max-tokens").value),max_prompt_tokens:parseInt(document.getElementById("bot-max-prompt").value),presence_penalty:parseFloat(document.getElementById("bot-pp").value),frequency_penalty:parseFloat(document.getElementById("bot-fp").value),auto_start:document.getElementById("bot-autostart").checked,allowed_guilds:JSON.stringify(document.getElementById("bot-allowed-guilds").value.split(",").map(u=>u.trim()).filter(u=>u)),providers_order:JSON.stringify(document.getElementById("bot-providers-order").value.split(",").map(u=>u.trim()).filter(u=>u))},n=document.getElementById("bot-token").value.trim();if(n&&(l.discord_token=n),!l.name){p("Bot name is required","error"),s.disabled=!1,s.textContent=r?"Create Bot":"Save Changes";return}if(r&&!n){p("Discord token is required for new bots","error"),s.disabled=!1,s.textContent="Create Bot";return}try{if(r){const u=await f.create(l);for(const b of d)try{await f.attachLorebook(u.id,b.lorebook_id);const $=k[b.lorebook_id];$&&Object.keys($).length>0&&await f.updateLorebook(u.id,b.lorebook_id,$)}catch($){console.error("Failed to attach lorebook:",$)}p("Bot created!","success")}else{await f.update(e.id,l);for(const u of d){const b=k[u.lorebook_id];if(b)try{await f.updateLorebook(e.id,u.lorebook_id,b)}catch($){console.error("Failed to save lorebook overrides:",$)}}p("Bot updated!","success")}window.location.hash="#/"}catch(u){p(u.message,"error"),s.disabled=!1,s.textContent=r?"Create Bot":"Save Changes"}})}function E(t){if(!t)return"";const a=document.createElement("div");return a.textContent=t,a.innerHTML}function A(t){return t?t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}const $e=Object.freeze(Object.defineProperty({__proto__:null,destroy:ke,render:pe},Symbol.toStringTag,{value:"Module"}));function we(){}async function me(t){t.innerHTML=`
    <div class="page">
      <div class="page-header">
        <h1>🔑 API Providers</h1>
        <button class="btn btn-primary" id="add-provider-btn">＋ New Provider</button>
      </div>
      <div id="provider-list" class="card-grid"></div>
    </div>
  `,document.getElementById("add-provider-btn").addEventListener("click",()=>W()),G()}async function G(){var a;const t=document.getElementById("provider-list");if(t)try{const r=await _.list();if(r.length===0){t.innerHTML=`
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🔑</div>
          <p>No API providers yet. Add one to connect your bots to an AI service.</p>
          <button class="btn btn-primary" id="empty-add-btn">＋ Add Provider</button>
        </div>
      `,(a=document.getElementById("empty-add-btn"))==null||a.addEventListener("click",()=>W());return}t.innerHTML=r.map(e=>`
      <div class="card">
        <div class="provider-card-header">
          <span class="provider-card-name">${ie(e.name)}</span>
          <div class="provider-card-actions">
            <button class="btn-icon" data-edit-provider="${e.id}" title="Edit">✎</button>
            <button class="btn-icon danger" data-delete-provider="${e.id}" title="Delete">🗑</button>
          </div>
        </div>
        <div class="provider-card-url">${ie(e.base_url)}</div>
      </div>
    `).join(""),t.querySelectorAll("[data-edit-provider]").forEach(e=>{e.addEventListener("click",()=>W(parseInt(e.dataset.editProvider)))}),t.querySelectorAll("[data-delete-provider]").forEach(e=>{e.addEventListener("click",async()=>{const i=parseInt(e.dataset.deleteProvider),m=r.find(d=>d.id===i);if(confirm(`Delete provider "${m==null?void 0:m.name}"? Bots using it will lose their API connection.`))try{await _.delete(i),p("Provider deleted","info"),G()}catch(d){p(d.message,"error")}})})}catch(r){t.innerHTML=`<p style="color: var(--danger);">Failed to load providers: ${r.message}</p>`}}async function W(t=null){var m;const a=t!==null;let r=null;if(a)try{r=await _.get(t)}catch(d){p(d.message,"error");return}(m=document.querySelector(".modal-overlay"))==null||m.remove();const e=document.createElement("div");e.className="modal-overlay",e.innerHTML=`
    <div class="modal">
      <div class="modal-header">
        <h2>${a?"Edit Provider":"New Provider"}</h2>
        <button class="btn-icon" id="modal-close">✕</button>
      </div>
      <form id="provider-form" autocomplete="off">
        <div class="form-group">
          <label class="form-label" for="prov-name">Name *</label>
          <input class="form-input" id="prov-name" type="text" placeholder="e.g. OpenRouter, My Local LLM" value="${le(r==null?void 0:r.name)}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="prov-url">Base URL</label>
          <input class="form-input" id="prov-url" type="url" placeholder="https://openrouter.ai/api/v1" value="${le((r==null?void 0:r.base_url)||"https://openrouter.ai/api/v1")}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="prov-key">API Key ${a?"(leave blank to keep current)":"*"}</label>
          <input class="form-input" id="prov-key" type="password" placeholder="${a?"••••••••":"sk-..."}" ${a?"":"required"} />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" id="modal-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">${a?"Save":"Create"}</button>
        </div>
      </form>
    </div>
  `,document.body.appendChild(e);const i=()=>e.remove();document.getElementById("modal-close").addEventListener("click",i),document.getElementById("modal-cancel").addEventListener("click",i),e.addEventListener("click",d=>{d.target===e&&i()}),document.getElementById("provider-form").addEventListener("submit",async d=>{d.preventDefault();const y={name:document.getElementById("prov-name").value.trim(),base_url:document.getElementById("prov-url").value.trim()||"https://openrouter.ai/api/v1"},g=document.getElementById("prov-key").value.trim();if(g&&(y.api_key=g),!y.name){p("Name is required","error");return}if(!a&&!g){p("API key is required","error");return}try{a?(await _.update(t,y),p("Provider updated!","success")):(await _.create(y),p("Provider created!","success")),i(),G()}catch(h){p(h.message,"error")}})}function ie(t){if(!t)return"";const a=document.createElement("div");return a.textContent=t,a.innerHTML}function le(t){return t?t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}const xe=Object.freeze(Object.defineProperty({__proto__:null,destroy:we,render:me},Symbol.toStringTag,{value:"Module"}));function Le(){}async function ue(t){let a=[];try{a=await M.list()}catch(d){t.innerHTML=`<div class="page"><p style="color:var(--danger)">Error loading lorebooks: ${d.message}</p></div>`;return}t.innerHTML=`
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
  `;const r=document.getElementById("lb-list"),e=document.getElementById("lb-file"),i=document.getElementById("upload-lb-btn");function m(){if(a.length===0){r.innerHTML='<p style="color: var(--text-secondary); text-align: center;">No lorebooks uploaded yet.</p>';return}r.innerHTML=a.map(d=>`
      <div class="lb-row" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 0.5rem;">
        <div>
          <strong>${_e(d.name)}</strong>
          <span style="color: var(--text-secondary); font-size: 0.85rem; margin-left: 0.75rem;">${d.entry_count||0} entries</span>
        </div>
        <button type="button" class="btn btn-danger btn-sm" data-delete-lb="${d.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">🗑 Delete</button>
      </div>
    `).join(""),r.querySelectorAll("[data-delete-lb]").forEach(d=>{d.addEventListener("click",async()=>{const y=parseInt(d.dataset.deleteLb),g=a.find(h=>h.id===y);if(confirm(`Delete lorebook "${g==null?void 0:g.name}"? This will also remove it from all bots.`))try{await M.delete(y),a=a.filter(h=>h.id!==y),m(),p("Lorebook deleted","success")}catch(h){p(h.message,"error")}})})}m(),i.addEventListener("click",async()=>{const d=e.files[0];if(!d)return p("Please select a JSON file first","error");try{i.disabled=!0,i.textContent="Uploading…";const y=await d.text(),g=JSON.parse(y);if(!g.entries)throw new Error('File must contain an "entries" object');const h=g.name||d.name.replace(/\.json$/i,""),I=await M.create({name:h,data:y}),B=Object.keys(g.entries).length;a.push({id:I.id,name:I.name,entry_count:B}),m(),e.value="",p(`Lorebook "${I.name}" uploaded (${B} entries)`,"success")}catch(y){p(y.message,"error")}finally{i.disabled=!1,i.textContent="📤 Upload"}})}function _e(t){if(!t)return"";const a=document.createElement("div");return a.textContent=t,a.innerHTML}const Ie=Object.freeze(Object.defineProperty({__proto__:null,destroy:Le,render:ue},Symbol.toStringTag,{value:"Module"})),Be=document.getElementById("app");let x=null;function Se(t){return`
    <nav class="navbar">
      <div class="navbar-brand" onclick="location.hash='#/'">
        <span class="logo-icon">⚡</span>
        CordBridge
      </div>
      <div class="navbar-links">
        <a href="#/" class="${t==="dashboard"?"active":""}">Dashboard</a>
        <a href="#/providers" class="${t==="providers"?"active":""}">Providers</a>
        <a href="#/lorebooks" class="${t==="lorebooks"?"active":""}">Lorebooks</a>
      </div>
    </nav>
  `}async function ve(){x!=null&&x.destroy&&x.destroy();const t=window.location.hash||"#/";let a="dashboard";t.startsWith("#/providers")?a="providers":t.startsWith("#/lorebooks")?a="lorebooks":t.startsWith("#/bots/")&&(a="botEditor"),Be.innerHTML=Se(a)+'<div id="page-content"></div>';const r=document.getElementById("page-content");if(a==="providers")x=xe,await me(r);else if(a==="lorebooks")x=Ie,await ue(r);else if(a==="botEditor"){const e=t.split("/").pop();x=$e,await pe(r,e)}else x=Ee,ce(r)}window.addEventListener("hashchange",ve);window.addEventListener("DOMContentLoaded",()=>{window.location.hash||(window.location.hash="#/"),ve()});
