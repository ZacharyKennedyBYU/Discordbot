(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))e(i);new MutationObserver(i=>{for(const p of i)if(p.type==="childList")for(const l of p.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&e(l)}).observe(document,{childList:!0,subtree:!0});function r(i){const p={};return i.integrity&&(p.integrity=i.integrity),i.referrerPolicy&&(p.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?p.credentials="include":i.crossOrigin==="anonymous"?p.credentials="omit":p.credentials="same-origin",p}function e(i){if(i.ep)return;i.ep=!0;const p=r(i);fetch(i.href,p)}})();const le="/api";async function u(t,a={}){const r=await fetch(`${le}${t}`,{headers:{"Content-Type":"application/json",...a.headers},...a}),e=await r.json();if(!r.ok)throw new Error(e.error||`Request failed (${r.status})`);return e}const fe=async t=>{const a=new FormData;a.append("file",t);const r=await fetch(`${le}/upload`,{method:"POST",body:a}),e=await r.json();if(!r.ok)throw new Error(e.error||`Upload failed (${r.status})`);return e},I={list:()=>u("/providers"),get:t=>u(`/providers/${t}`),create:t=>u("/providers",{method:"POST",body:JSON.stringify(t)}),update:(t,a)=>u(`/providers/${t}`,{method:"PUT",body:JSON.stringify(a)}),delete:t=>u(`/providers/${t}`,{method:"DELETE"}),getModels:t=>u(`/providers/${t}/models`)},y={list:()=>u("/bots"),get:t=>u(`/bots/${t}`),create:t=>u("/bots",{method:"POST",body:JSON.stringify(t)}),update:(t,a)=>u(`/bots/${t}`,{method:"PUT",body:JSON.stringify(a)}),delete:t=>u(`/bots/${t}`,{method:"DELETE"}),start:t=>u(`/bots/${t}/start`,{method:"POST"}),stop:t=>u(`/bots/${t}/stop`,{method:"POST"}),getHistory:t=>u(`/bots/${t}/history`),clearHistory:(t,a)=>u(`/bots/${t}/history${a?`?guild_id=${a}`:""}`,{method:"DELETE"}),getLorebooks:t=>u(`/bots/${t}/lorebooks`),attachLorebook:(t,a)=>u(`/bots/${t}/lorebooks`,{method:"POST",body:JSON.stringify({lorebook_id:a})}),updateLorebook:(t,a,r)=>u(`/bots/${t}/lorebooks/${a}`,{method:"PUT",body:JSON.stringify({overrides:r})}),detachLorebook:(t,a)=>u(`/bots/${t}/lorebooks/${a}`,{method:"DELETE"})},M={list:()=>u("/lorebooks"),get:t=>u(`/lorebooks/${t}`),create:t=>u("/lorebooks",{method:"POST",body:JSON.stringify(t)}),delete:t=>u(`/lorebooks/${t}`,{method:"DELETE"})},se={success:"✓",error:"✕",info:"ℹ"};function m(t,a="info",r=3500){const e=document.getElementById("toast-container"),i=document.createElement("div");i.className=`toast ${a}`,i.innerHTML=`
    <span class="toast-icon">${se[a]||se.info}</span>
    <span>${t}</span>
  `,e.appendChild(i),setTimeout(()=>{i.classList.add("fade-out"),i.addEventListener("animationend",()=>i.remove())},r)}let N=null;function de(t){t.innerHTML=`
    <div class="page">
      <div class="page-header">
        <h1>🤖 Dashboard</h1>
        <button class="btn btn-primary" id="add-bot-btn">＋ New Bot</button>
      </div>
      <div id="bot-list" class="card-grid"></div>
    </div>
  `,document.getElementById("add-bot-btn").addEventListener("click",()=>{window.location.hash="#/bots/new"}),R(),N=setInterval(R,5e3)}function ge(){N&&(clearInterval(N),N=null)}async function R(){const t=document.getElementById("bot-list");if(t)try{const a=await y.list();if(a.length===0){t.innerHTML=`
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🤖</div>
          <p>No bots yet. Create your first bot to get started!</p>
          <button class="btn btn-primary" onclick="location.hash='#/bots/new'">＋ Create Bot</button>
        </div>
      `;return}t.innerHTML=a.map(r=>`
      <div class="card bot-card" data-bot-id="${r.id}">
        <div class="bot-card-header">
          <span class="bot-card-name">${z(r.name)}</span>
          <span class="status-badge ${r.online?"online":"offline"}">
            <span class="status-dot"></span>
            ${r.online?"Online":"Offline"}
          </span>
        </div>
        <div class="bot-card-meta">
          <div class="meta-row">
            <span class="meta-label">Model</span>
            <span>${z(r.model||"—")}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Provider</span>
            <span>${z(r.provider_name||"None")}</span>
          </div>
        </div>
        <div class="bot-card-actions">
          <button class="btn btn-sm ${r.online?"btn-danger":"btn-success"}" data-toggle-id="${r.id}">
            ${r.online?"⏹ Stop":"▶ Start"}
          </button>
          <button class="btn btn-sm btn-ghost" data-edit-id="${r.id}">✎ Edit</button>
        </div>
      </div>
    `).join(""),t.querySelectorAll("[data-toggle-id]").forEach(r=>{r.addEventListener("click",async e=>{e.stopPropagation();const i=parseInt(r.dataset.toggleId),p=a.find(l=>l.id===i);r.disabled=!0,r.textContent="…";try{p.online?(await y.stop(i),m(`"${p.name}" stopped`,"info")):(await y.start(i),m(`"${p.name}" started`,"success"))}catch(l){m(l.message,"error")}R()})}),t.querySelectorAll("[data-edit-id]").forEach(r=>{r.addEventListener("click",e=>{e.stopPropagation(),window.location.hash=`#/bots/${r.dataset.editId}`})}),t.querySelectorAll(".bot-card").forEach(r=>{r.addEventListener("click",()=>{window.location.hash=`#/bots/${r.dataset.botId}`})})}catch(a){t.innerHTML=`<p style="color: var(--danger);">Failed to load bots: ${a.message}</p>`}}function z(t){if(!t)return"";const a=document.createElement("div");return a.textContent=t,a.innerHTML}const he=Object.freeze(Object.defineProperty({__proto__:null,destroy:ge,render:de},Symbol.toStringTag,{value:"Module"}));function Ee(){}async function ce(t,a){const r=a==="new";let e=null,i=[],p=[],l=[];try{i=await I.list(),p=await M.list(),r||(e=await y.get(parseInt(a)),l=await y.getLorebooks(parseInt(a)))}catch(o){t.innerHTML=`<div class="page"><p style="color:var(--danger)">Error loading data: ${o.message}</p></div>`;return}const f=r?"Create New Bot":`Edit — ${E(e.name)}`;t.innerHTML=`
    <div class="page" style="max-width: 760px;">
      <div class="page-header">
        <h1>${r?"🆕":"✎"} ${f}</h1>
        <button class="btn btn-ghost" id="back-btn">← Back</button>
      </div>

      <form id="bot-form" autocomplete="off">
        <!-- Identity -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Identity</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="bot-name">Bot Name *</label>
              <input class="form-input" id="bot-name" type="text" placeholder="My Cool Bot" value="${V(e==null?void 0:e.name)}" required />
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
              <input class="form-input" id="bot-model" type="text" list="bot-model-list" placeholder="deepseek/deepseek-v3.2" value="${V((e==null?void 0:e.model)||"deepseek/deepseek-v3.2")}" autocomplete="off" />
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
              <input class="form-input" id="bot-vision-model" type="text" list="bot-vision-model-list" placeholder="openai/gpt-4o-mini" value="${V((e==null?void 0:e.vision_model)||"")}" autocomplete="off" />
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
  `;const g=document.getElementById("bot-type"),h=document.getElementById("ai-config-card"),B=document.getElementById("prompts-card"),_=document.getElementById("params-card"),G=document.getElementById("false-phrases-card");let L=[];try{e&&e.false_phrases&&(L=JSON.parse(e.false_phrases||"[]"))}catch{}function Q(){const o=g.value==="false";h&&(h.style.display=o?"none":"block"),B&&(B.style.display=o?"none":"block"),_&&(_.style.display=o?"none":"block"),X&&(X.style.display=o?"none":"block"),G&&(G.style.display=o?"block":"none")}g.addEventListener("change",Q),Q();const X=document.getElementById("lorebooks-card"),H=document.getElementById("lb-attach-select"),ve=document.getElementById("lb-attach-btn"),P=document.getElementById("attached-lorebooks");let k={};for(const o of l)try{k[o.lorebook_id]=typeof o.overrides=="string"?JSON.parse(o.overrides||"{}"):o.overrides||{}}catch{k[o.lorebook_id]={}}function j(){H.innerHTML='<option value="">— Select a lorebook to attach —</option>';const o=l.map(s=>s.lorebook_id);p.filter(s=>!o.includes(s.id)).forEach(s=>{const c=document.createElement("option");c.value=s.id,c.textContent=`${s.name} (${s.entry_count||0} entries)`,H.appendChild(c)})}j();function Y(o){return o==="sun"?"☀️":o==="off"?"✖":"🌙"}function be(o){return o==="moon"?"sun":o==="sun"?"off":"moon"}function q(){if(l.length===0){P.innerHTML='<p style="color: var(--text-secondary); text-align: center;">No lorebooks attached.</p>';return}P.innerHTML=l.map(o=>{let s=[];try{const n=typeof o.data=="string"?JSON.parse(o.data):o.data;n.entries&&(s=Object.entries(n.entries))}catch{}const c=k[o.lorebook_id]||{};return`
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
            ${s.map(([n,d])=>{const v=c[n]||"moon",b=d.comment||d.name||`Entry ${n}`,$=(Array.isArray(d.key)?d.key:d.keys||[]).join(", ");return`
                <div class="lb-entry-row">
                  <button type="button" class="lb-state-btn" data-lbid="${o.lorebook_id}" data-uid="${n}" data-state="${v}" title="Click to cycle: 🌙 mentioned → ☀️ always → ✖ off">
                    ${Y(v)}
                  </button>
                  <div class="lb-entry-info">
                    <span class="lb-entry-name">${E(b)}</span>
                    <span class="lb-entry-keys">${E($)}</span>
                  </div>
                </div>
              `}).join("")}
          </div>
        </div>
      `}).join(""),P.querySelectorAll(".lb-toggle-expand").forEach(o=>{o.addEventListener("click",()=>{const s=o.closest(".lb-attached-item"),c=s.querySelector(".lb-entries-list"),n=s.querySelector(".lb-expand-arrow"),d=c.style.display!=="none";c.style.display=d?"none":"block",n.textContent=d?"▶":"▼"})}),P.querySelectorAll(".lb-state-btn").forEach(o=>{o.addEventListener("click",()=>{const s=o.dataset.lbid,c=o.dataset.uid,n=o.dataset.state,d=be(n);o.dataset.state=d,o.textContent=Y(d),k[s]||(k[s]={}),k[s][c]=d})}),P.querySelectorAll("[data-detach-lb]").forEach(o=>{o.addEventListener("click",async()=>{const s=parseInt(o.dataset.detachLb),c=l.find(n=>n.lorebook_id===s);if(confirm(`Detach lorebook "${c==null?void 0:c.name}" from this bot?`))try{r||await y.detachLorebook(parseInt(a),s),l=l.filter(n=>n.lorebook_id!==s),delete k[s],q(),j(),m("Lorebook detached","success")}catch(n){m(n.message,"error")}})})}q(),ve.addEventListener("click",async()=>{const o=parseInt(H.value);if(!o)return m("Select a lorebook first","error");try{r||await y.attachLorebook(parseInt(a),o);const s=await M.get(o),c=p.find(n=>n.id===o);l.push({lorebook_id:o,name:(c==null?void 0:c.name)||s.name,data:s.data,overrides:"{}"}),k[o]={},q(),j(),m("Lorebook attached","success")}catch(s){m(s.message,"error")}});const D=document.getElementById("phrases-list"),F=document.getElementById("new-phrase-input"),Z=document.getElementById("add-phrase-btn"),ee=document.getElementById("new-audio-input"),S=document.getElementById("add-audio-btn");function A(){if(D.innerHTML="",L.length===0){D.innerHTML='<li style="padding: 0.75rem; text-align: center; color: var(--text-secondary);">No phrases added yet.</li>';return}L.forEach((o,s)=>{const c=document.createElement("li");c.style.cssText="padding: 0.75rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;";const n=document.createElement("span");n.style.wordBreak="break-word",typeof o=="string"?n.textContent=o:o.type==="audio"&&(n.innerHTML=`🎵 <strong>Audio:</strong> ${E(o.originalName||"response.mp3")}`);const d=document.createElement("button");d.type="button",d.className="btn btn-ghost",d.style.padding="0.25rem 0.5rem",d.style.color="var(--danger)",d.textContent="✖",d.onclick=()=>{L.splice(s,1),A()},c.appendChild(n),c.appendChild(d),D.appendChild(c)})}A(),Z.addEventListener("click",()=>{const o=F.value.trim();o&&(L.push(o),F.value="",A())}),F.addEventListener("keydown",o=>{o.key==="Enter"&&(o.preventDefault(),Z.click())}),S.addEventListener("click",async()=>{const o=ee.files[0];if(!o)return m("Please select a file first","error");try{S.disabled=!0,S.textContent="Uploading...";const s=await fe(o);L.push({type:"audio",path:s.path,originalName:s.originalname}),ee.value="",A(),m("Audio uploaded successfully","success")}catch(s){m(s.message,"error")}finally{S.disabled=!1,S.textContent="Upload MP3"}});const w=document.getElementById("bot-provider"),C=document.getElementById("bot-vision-provider"),U=document.getElementById("bot-model"),te=document.getElementById("use-chat-vision-group"),oe=document.getElementById("use-chat-vision");let O=[];function ye(o){if(!O||O.length===0)return!1;const s=O.find(d=>d.id===o);if(!s||!s.architecture)return!1;s.architecture.instruct_type;const c=s.architecture.modality||"",n=Array.isArray(s.architecture.input_modalities)?s.architecture.input_modalities.join(","):"";return c.includes("image")||n.includes("image")}function J(){const o=U.value.trim();ye(o)?te.style.display="block":(te.style.display="none",oe&&(oe.checked=!1))}U.addEventListener("input",J),U.addEventListener("change",J);async function T(o,s){const c=document.getElementById(s);if(c.innerHTML="",!!o)try{const n=await I.getModels(o);n&&n.data&&Array.isArray(n.data)&&(s==="bot-model-list"&&(O=n.data),n.data.forEach(d=>{const v=document.createElement("option");v.value=d.id;let b=d.name&&d.name!==d.id?d.name:"";s==="bot-model-list"&&(d.architecture&&d.architecture.modality&&d.architecture.modality.includes("image")||d.architecture&&Array.isArray(d.architecture.input_modalities)&&d.architecture.input_modalities.includes("image"))&&(b+=" 👓"),b&&(v.textContent=b),c.appendChild(v)}),s==="bot-model-list"&&J())}catch(n){console.error("Failed to load models:",n)}}w.addEventListener("change",()=>{T(w.value,"bot-model-list"),C.value||T(w.value,"bot-vision-model-list")}),C.addEventListener("change",()=>{T(C.value||w.value,"bot-vision-model-list")}),w.value&&T(w.value,"bot-model-list"),(C.value||w.value)&&T(C.value||w.value,"bot-vision-model-list"),[{input:"bot-temp",display:"temp-val"},{input:"bot-topp",display:"topp-val"},{input:"bot-pp",display:"pp-val"},{input:"bot-fp",display:"fp-val"}].forEach(({input:o,display:s})=>{const c=document.getElementById(o),n=document.getElementById(s);c.addEventListener("input",()=>{n.textContent=c.value})}),document.getElementById("back-btn").addEventListener("click",()=>{window.location.hash="#/"}),document.getElementById("cancel-btn").addEventListener("click",()=>{window.location.hash="#/"});const ae=document.getElementById("clear-history-btn");ae&&ae.addEventListener("click",async()=>{try{const o=await y.getHistory(e.id);if(!o||o.length===0){m("No conversation history to clear","info");return}const s=o.map(v=>`  • ${v.guild_id==="DM"||!v.guild_id?"Direct Messages":`Server ${v.guild_id}`} (${v.message_count} messages)`).join(`
`),c=prompt(`Conversation history for "${e.name}":

${s}

Enter a server ID to clear just that server,
or type "all" to clear everything:`);if(c===null)return;const n=c.trim();if(!n)return;let d;if(n.toLowerCase()==="all"){if(!confirm(`Clear ALL conversation history for "${e.name}" across all servers?`))return;d=await y.clearHistory(e.id)}else{const v=o.find(b=>b.guild_id===n||n.toLowerCase()==="dm"&&(!b.guild_id||b.guild_id==="DM"));if(!v){m("Server ID not found in history","error");return}d=await y.clearHistory(e.id,v.guild_id)}m(`History cleared (${d.messagesRemoved} messages removed)`,"success")}catch(o){m(o.message,"error")}});const re=document.getElementById("delete-btn");re&&re.addEventListener("click",async()=>{if(confirm(`Are you sure you want to delete "${e.name}"? This cannot be undone.`))try{await y.delete(e.id),m(`"${e.name}" deleted`,"info"),window.location.hash="#/"}catch(o){m(o.message,"error")}}),document.getElementById("bot-form").addEventListener("submit",async o=>{var d;o.preventDefault();const s=document.getElementById("save-btn");s.disabled=!0,s.textContent="Saving…";const c={name:document.getElementById("bot-name").value.trim(),model:document.getElementById("bot-model").value.trim(),vision_model:document.getElementById("bot-vision-model").value.trim(),use_chat_vision:((d=document.getElementById("use-chat-vision"))==null?void 0:d.checked)||!1,provider_id:parseInt(document.getElementById("bot-provider").value)||null,vision_provider_id:parseInt(document.getElementById("bot-vision-provider").value)||null,bot_type:document.getElementById("bot-type").value,false_phrases:JSON.stringify(L),system_prompt:document.getElementById("bot-system").value,character_prompt:document.getElementById("bot-character").value,first_message:document.getElementById("bot-first-msg").value,example_messages:document.getElementById("bot-examples").value,prefill:document.getElementById("bot-prefill").value,temperature:parseFloat(document.getElementById("bot-temp").value),top_p:parseFloat(document.getElementById("bot-topp").value),max_tokens:parseInt(document.getElementById("bot-max-tokens").value),max_prompt_tokens:parseInt(document.getElementById("bot-max-prompt").value),presence_penalty:parseFloat(document.getElementById("bot-pp").value),frequency_penalty:parseFloat(document.getElementById("bot-fp").value),auto_start:document.getElementById("bot-autostart").checked},n=document.getElementById("bot-token").value.trim();if(n&&(c.discord_token=n),!c.name){m("Bot name is required","error"),s.disabled=!1,s.textContent=r?"Create Bot":"Save Changes";return}if(r&&!n){m("Discord token is required for new bots","error"),s.disabled=!1,s.textContent="Create Bot";return}try{if(r){const v=await y.create(c);for(const b of l)try{await y.attachLorebook(v.id,b.lorebook_id);const $=k[b.lorebook_id];$&&Object.keys($).length>0&&await y.updateLorebook(v.id,b.lorebook_id,$)}catch($){console.error("Failed to attach lorebook:",$)}m("Bot created!","success")}else{await y.update(e.id,c);for(const v of l){const b=k[v.lorebook_id];if(b)try{await y.updateLorebook(e.id,v.lorebook_id,b)}catch($){console.error("Failed to save lorebook overrides:",$)}}m("Bot updated!","success")}window.location.hash="#/"}catch(v){m(v.message,"error"),s.disabled=!1,s.textContent=r?"Create Bot":"Save Changes"}})}function E(t){if(!t)return"";const a=document.createElement("div");return a.textContent=t,a.innerHTML}function V(t){return t?t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}const ke=Object.freeze(Object.defineProperty({__proto__:null,destroy:Ee,render:ce},Symbol.toStringTag,{value:"Module"}));function $e(){}async function me(t){t.innerHTML=`
    <div class="page">
      <div class="page-header">
        <h1>🔑 API Providers</h1>
        <button class="btn btn-primary" id="add-provider-btn">＋ New Provider</button>
      </div>
      <div id="provider-list" class="card-grid"></div>
    </div>
  `,document.getElementById("add-provider-btn").addEventListener("click",()=>W()),K()}async function K(){var a;const t=document.getElementById("provider-list");if(t)try{const r=await I.list();if(r.length===0){t.innerHTML=`
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🔑</div>
          <p>No API providers yet. Add one to connect your bots to an AI service.</p>
          <button class="btn btn-primary" id="empty-add-btn">＋ Add Provider</button>
        </div>
      `,(a=document.getElementById("empty-add-btn"))==null||a.addEventListener("click",()=>W());return}t.innerHTML=r.map(e=>`
      <div class="card">
        <div class="provider-card-header">
          <span class="provider-card-name">${ne(e.name)}</span>
          <div class="provider-card-actions">
            <button class="btn-icon" data-edit-provider="${e.id}" title="Edit">✎</button>
            <button class="btn-icon danger" data-delete-provider="${e.id}" title="Delete">🗑</button>
          </div>
        </div>
        <div class="provider-card-url">${ne(e.base_url)}</div>
      </div>
    `).join(""),t.querySelectorAll("[data-edit-provider]").forEach(e=>{e.addEventListener("click",()=>W(parseInt(e.dataset.editProvider)))}),t.querySelectorAll("[data-delete-provider]").forEach(e=>{e.addEventListener("click",async()=>{const i=parseInt(e.dataset.deleteProvider),p=r.find(l=>l.id===i);if(confirm(`Delete provider "${p==null?void 0:p.name}"? Bots using it will lose their API connection.`))try{await I.delete(i),m("Provider deleted","info"),K()}catch(l){m(l.message,"error")}})})}catch(r){t.innerHTML=`<p style="color: var(--danger);">Failed to load providers: ${r.message}</p>`}}async function W(t=null){var p;const a=t!==null;let r=null;if(a)try{r=await I.get(t)}catch(l){m(l.message,"error");return}(p=document.querySelector(".modal-overlay"))==null||p.remove();const e=document.createElement("div");e.className="modal-overlay",e.innerHTML=`
    <div class="modal">
      <div class="modal-header">
        <h2>${a?"Edit Provider":"New Provider"}</h2>
        <button class="btn-icon" id="modal-close">✕</button>
      </div>
      <form id="provider-form" autocomplete="off">
        <div class="form-group">
          <label class="form-label" for="prov-name">Name *</label>
          <input class="form-input" id="prov-name" type="text" placeholder="e.g. OpenRouter, My Local LLM" value="${ie(r==null?void 0:r.name)}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="prov-url">Base URL</label>
          <input class="form-input" id="prov-url" type="url" placeholder="https://openrouter.ai/api/v1" value="${ie((r==null?void 0:r.base_url)||"https://openrouter.ai/api/v1")}" />
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
  `,document.body.appendChild(e);const i=()=>e.remove();document.getElementById("modal-close").addEventListener("click",i),document.getElementById("modal-cancel").addEventListener("click",i),e.addEventListener("click",l=>{l.target===e&&i()}),document.getElementById("provider-form").addEventListener("submit",async l=>{l.preventDefault();const f={name:document.getElementById("prov-name").value.trim(),base_url:document.getElementById("prov-url").value.trim()||"https://openrouter.ai/api/v1"},g=document.getElementById("prov-key").value.trim();if(g&&(f.api_key=g),!f.name){m("Name is required","error");return}if(!a&&!g){m("API key is required","error");return}try{a?(await I.update(t,f),m("Provider updated!","success")):(await I.create(f),m("Provider created!","success")),i(),K()}catch(h){m(h.message,"error")}})}function ne(t){if(!t)return"";const a=document.createElement("div");return a.textContent=t,a.innerHTML}function ie(t){return t?t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}const we=Object.freeze(Object.defineProperty({__proto__:null,destroy:$e,render:me},Symbol.toStringTag,{value:"Module"}));function xe(){}async function pe(t){let a=[];try{a=await M.list()}catch(l){t.innerHTML=`<div class="page"><p style="color:var(--danger)">Error loading lorebooks: ${l.message}</p></div>`;return}t.innerHTML=`
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
  `;const r=document.getElementById("lb-list"),e=document.getElementById("lb-file"),i=document.getElementById("upload-lb-btn");function p(){if(a.length===0){r.innerHTML='<p style="color: var(--text-secondary); text-align: center;">No lorebooks uploaded yet.</p>';return}r.innerHTML=a.map(l=>`
      <div class="lb-row" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 0.5rem;">
        <div>
          <strong>${Le(l.name)}</strong>
          <span style="color: var(--text-secondary); font-size: 0.85rem; margin-left: 0.75rem;">${l.entry_count||0} entries</span>
        </div>
        <button type="button" class="btn btn-danger btn-sm" data-delete-lb="${l.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">🗑 Delete</button>
      </div>
    `).join(""),r.querySelectorAll("[data-delete-lb]").forEach(l=>{l.addEventListener("click",async()=>{const f=parseInt(l.dataset.deleteLb),g=a.find(h=>h.id===f);if(confirm(`Delete lorebook "${g==null?void 0:g.name}"? This will also remove it from all bots.`))try{await M.delete(f),a=a.filter(h=>h.id!==f),p(),m("Lorebook deleted","success")}catch(h){m(h.message,"error")}})})}p(),i.addEventListener("click",async()=>{const l=e.files[0];if(!l)return m("Please select a JSON file first","error");try{i.disabled=!0,i.textContent="Uploading…";const f=await l.text(),g=JSON.parse(f);if(!g.entries)throw new Error('File must contain an "entries" object');const h=g.name||l.name.replace(/\.json$/i,""),B=await M.create({name:h,data:f}),_=Object.keys(g.entries).length;a.push({id:B.id,name:B.name,entry_count:_}),p(),e.value="",m(`Lorebook "${B.name}" uploaded (${_} entries)`,"success")}catch(f){m(f.message,"error")}finally{i.disabled=!1,i.textContent="📤 Upload"}})}function Le(t){if(!t)return"";const a=document.createElement("div");return a.textContent=t,a.innerHTML}const Ie=Object.freeze(Object.defineProperty({__proto__:null,destroy:xe,render:pe},Symbol.toStringTag,{value:"Module"})),Be=document.getElementById("app");let x=null;function _e(t){return`
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
  `}async function ue(){x!=null&&x.destroy&&x.destroy();const t=window.location.hash||"#/";let a="dashboard";t.startsWith("#/providers")?a="providers":t.startsWith("#/lorebooks")?a="lorebooks":t.startsWith("#/bots/")&&(a="botEditor"),Be.innerHTML=_e(a)+'<div id="page-content"></div>';const r=document.getElementById("page-content");if(a==="providers")x=we,await me(r);else if(a==="lorebooks")x=Ie,await pe(r);else if(a==="botEditor"){const e=t.split("/").pop();x=ke,await ce(r,e)}else x=he,de(r)}window.addEventListener("hashchange",ue);window.addEventListener("DOMContentLoaded",()=>{window.location.hash||(window.location.hash="#/"),ue()});
