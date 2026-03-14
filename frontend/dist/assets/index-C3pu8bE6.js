(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))e(s);new MutationObserver(s=>{for(const c of s)if(c.type==="childList")for(const p of c.addedNodes)p.tagName==="LINK"&&p.rel==="modulepreload"&&e(p)}).observe(document,{childList:!0,subtree:!0});function a(s){const c={};return s.integrity&&(c.integrity=s.integrity),s.referrerPolicy&&(c.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?c.credentials="include":s.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function e(s){if(s.ep)return;s.ep=!0;const c=a(s);fetch(s.href,c)}})();const X="/api";async function u(t,o={}){const a=await fetch(`${X}${t}`,{headers:{"Content-Type":"application/json",...o.headers},...o}),e=await a.json();if(!a.ok)throw new Error(e.error||`Request failed (${a.status})`);return e}const oe=async t=>{const o=new FormData;o.append("file",t);const a=await fetch(`${X}/upload`,{method:"POST",body:o}),e=await a.json();if(!a.ok)throw new Error(e.error||`Upload failed (${a.status})`);return e},w={list:()=>u("/providers"),get:t=>u(`/providers/${t}`),create:t=>u("/providers",{method:"POST",body:JSON.stringify(t)}),update:(t,o)=>u(`/providers/${t}`,{method:"PUT",body:JSON.stringify(o)}),delete:t=>u(`/providers/${t}`,{method:"DELETE"}),getModels:t=>u(`/providers/${t}/models`)},f={list:()=>u("/bots"),get:t=>u(`/bots/${t}`),create:t=>u("/bots",{method:"POST",body:JSON.stringify(t)}),update:(t,o)=>u(`/bots/${t}`,{method:"PUT",body:JSON.stringify(o)}),delete:t=>u(`/bots/${t}`,{method:"DELETE"}),start:t=>u(`/bots/${t}/start`,{method:"POST"}),stop:t=>u(`/bots/${t}/stop`,{method:"POST"}),getHistory:t=>u(`/bots/${t}/history`),clearHistory:(t,o)=>u(`/bots/${t}/history${o?`?guild_id=${o}`:""}`,{method:"DELETE"})},W={success:"✓",error:"✕",info:"ℹ"};function d(t,o="info",a=3500){const e=document.getElementById("toast-container"),s=document.createElement("div");s.className=`toast ${o}`,s.innerHTML=`
    <span class="toast-icon">${W[o]||W.info}</span>
    <span>${t}</span>
  `,e.appendChild(s),setTimeout(()=>{s.classList.add("fade-out"),s.addEventListener("animationend",()=>s.remove())},a)}let C=null;function Y(t){t.innerHTML=`
    <div class="page">
      <div class="page-header">
        <h1>🤖 Dashboard</h1>
        <button class="btn btn-primary" id="add-bot-btn">＋ New Bot</button>
      </div>
      <div id="bot-list" class="card-grid"></div>
    </div>
  `,document.getElementById("add-bot-btn").addEventListener("click",()=>{window.location.hash="#/bots/new"}),N(),C=setInterval(N,5e3)}function re(){C&&(clearInterval(C),C=null)}async function N(){const t=document.getElementById("bot-list");if(t)try{const o=await f.list();if(o.length===0){t.innerHTML=`
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🤖</div>
          <p>No bots yet. Create your first bot to get started!</p>
          <button class="btn btn-primary" onclick="location.hash='#/bots/new'">＋ Create Bot</button>
        </div>
      `;return}t.innerHTML=o.map(a=>`
      <div class="card bot-card" data-bot-id="${a.id}">
        <div class="bot-card-header">
          <span class="bot-card-name">${O(a.name)}</span>
          <span class="status-badge ${a.online?"online":"offline"}">
            <span class="status-dot"></span>
            ${a.online?"Online":"Offline"}
          </span>
        </div>
        <div class="bot-card-meta">
          <div class="meta-row">
            <span class="meta-label">Model</span>
            <span>${O(a.model||"—")}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Provider</span>
            <span>${O(a.provider_name||"None")}</span>
          </div>
        </div>
        <div class="bot-card-actions">
          <button class="btn btn-sm ${a.online?"btn-danger":"btn-success"}" data-toggle-id="${a.id}">
            ${a.online?"⏹ Stop":"▶ Start"}
          </button>
          <button class="btn btn-sm btn-ghost" data-edit-id="${a.id}">✎ Edit</button>
        </div>
      </div>
    `).join(""),t.querySelectorAll("[data-toggle-id]").forEach(a=>{a.addEventListener("click",async e=>{e.stopPropagation();const s=parseInt(a.dataset.toggleId),c=o.find(p=>p.id===s);a.disabled=!0,a.textContent="…";try{c.online?(await f.stop(s),d(`"${c.name}" stopped`,"info")):(await f.start(s),d(`"${c.name}" started`,"success"))}catch(p){d(p.message,"error")}N()})}),t.querySelectorAll("[data-edit-id]").forEach(a=>{a.addEventListener("click",e=>{e.stopPropagation(),window.location.hash=`#/bots/${a.dataset.editId}`})}),t.querySelectorAll(".bot-card").forEach(a=>{a.addEventListener("click",()=>{window.location.hash=`#/bots/${a.dataset.botId}`})})}catch(o){t.innerHTML=`<p style="color: var(--danger);">Failed to load bots: ${o.message}</p>`}}function O(t){if(!t)return"";const o=document.createElement("div");return o.textContent=t,o.innerHTML}const se=Object.freeze(Object.defineProperty({__proto__:null,destroy:re,render:Y},Symbol.toStringTag,{value:"Module"}));function ne(){}async function Z(t,o){const a=o==="new";let e=null,s=[];try{s=await w.list(),a||(e=await f.get(parseInt(o)))}catch(r){t.innerHTML=`<div class="page"><p style="color:var(--danger)">Error loading data: ${r.message}</p></div>`;return}const c=a?"Create New Bot":`Edit — ${y(e.name)}`;t.innerHTML=`
    <div class="page" style="max-width: 760px;">
      <div class="page-header">
        <h1>${a?"🆕":"✎"} ${c}</h1>
        <button class="btn btn-ghost" id="back-btn">← Back</button>
      </div>

      <form id="bot-form" autocomplete="off">
        <!-- Identity -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem;">Identity</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="bot-name">Bot Name *</label>
              <input class="form-input" id="bot-name" type="text" placeholder="My Cool Bot" value="${H(e==null?void 0:e.name)}" required />
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
                ${s.map(r=>`
                  <option value="${r.id}" ${(e==null?void 0:e.provider_id)===r.id?"selected":""}>${y(r.name)}</option>
                `).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-model">Model ID</label>
              <input class="form-input" id="bot-model" type="text" list="bot-model-list" placeholder="deepseek/deepseek-v3.2" value="${H((e==null?void 0:e.model)||"deepseek/deepseek-v3.2")}" autocomplete="off" />
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
                ${s.map(r=>`
                  <option value="${r.id}" ${(e==null?void 0:e.vision_provider_id)===r.id?"selected":""}>${y(r.name)}</option>
                `).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="bot-vision-model">Vision Model ID (Optional)</label>
              <input class="form-input" id="bot-vision-model" type="text" list="bot-vision-model-list" placeholder="openai/gpt-4o-mini" value="${H((e==null?void 0:e.vision_model)||"")}" autocomplete="off" />
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
  `;const p=document.getElementById("bot-type"),h=document.getElementById("ai-config-card"),x=document.getElementById("prompts-card"),k=document.getElementById("params-card"),j=document.getElementById("false-phrases-card");let E=[];try{e&&e.false_phrases&&(E=JSON.parse(e.false_phrases||"[]"))}catch{}function F(){const r=p.value==="false";h&&(h.style.display=r?"none":"block"),x&&(x.style.display=r?"none":"block"),k&&(k.style.display=r?"none":"block"),j&&(j.style.display=r?"block":"none")}p.addEventListener("change",F),F();const M=document.getElementById("phrases-list"),T=document.getElementById("new-phrase-input"),U=document.getElementById("add-phrase-btn"),V=document.getElementById("new-audio-input"),B=document.getElementById("add-audio-btn");function L(){if(M.innerHTML="",E.length===0){M.innerHTML='<li style="padding: 0.75rem; text-align: center; color: var(--text-secondary);">No phrases added yet.</li>';return}E.forEach((r,n)=>{const m=document.createElement("li");m.style.cssText="padding: 0.75rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;";const l=document.createElement("span");l.style.wordBreak="break-word",typeof r=="string"?l.textContent=r:r.type==="audio"&&(l.innerHTML=`🎵 <strong>Audio:</strong> ${y(r.originalName||"response.mp3")}`);const i=document.createElement("button");i.type="button",i.className="btn btn-ghost",i.style.padding="0.25rem 0.5rem",i.style.color="var(--danger)",i.textContent="✖",i.onclick=()=>{E.splice(n,1),L()},m.appendChild(l),m.appendChild(i),M.appendChild(m)})}L(),U.addEventListener("click",()=>{const r=T.value.trim();r&&(E.push(r),T.value="",L())}),T.addEventListener("keydown",r=>{r.key==="Enter"&&(r.preventDefault(),U.click())}),B.addEventListener("click",async()=>{const r=V.files[0];if(!r)return d("Please select a file first","error");try{B.disabled=!0,B.textContent="Uploading...";const n=await oe(r);E.push({type:"audio",path:n.path,originalName:n.originalname}),V.value="",L(),d("Audio uploaded successfully","success")}catch(n){d(n.message,"error")}finally{B.disabled=!1,B.textContent="Upload MP3"}});const b=document.getElementById("bot-provider"),I=document.getElementById("bot-vision-provider"),S=document.getElementById("bot-model"),z=document.getElementById("use-chat-vision-group"),J=document.getElementById("use-chat-vision");let P=[];function ae(r){if(!P||P.length===0)return!1;const n=P.find(i=>i.id===r);if(!n||!n.architecture)return!1;n.architecture.instruct_type;const m=n.architecture.modality||"",l=Array.isArray(n.architecture.input_modalities)?n.architecture.input_modalities.join(","):"";return m.includes("image")||l.includes("image")}function A(){const r=S.value.trim();ae(r)?z.style.display="block":(z.style.display="none",J&&(J.checked=!1))}S.addEventListener("input",A),S.addEventListener("change",A);async function _(r,n){const m=document.getElementById(n);if(m.innerHTML="",!!r)try{const l=await w.getModels(r);l&&l.data&&Array.isArray(l.data)&&(n==="bot-model-list"&&(P=l.data),l.data.forEach(i=>{const v=document.createElement("option");v.value=i.id;let g=i.name&&i.name!==i.id?i.name:"";n==="bot-model-list"&&(i.architecture&&i.architecture.modality&&i.architecture.modality.includes("image")||i.architecture&&Array.isArray(i.architecture.input_modalities)&&i.architecture.input_modalities.includes("image"))&&(g+=" 👓"),g&&(v.textContent=g),m.appendChild(v)}),n==="bot-model-list"&&A())}catch(l){console.error("Failed to load models:",l)}}b.addEventListener("change",()=>{_(b.value,"bot-model-list"),I.value||_(b.value,"bot-vision-model-list")}),I.addEventListener("change",()=>{_(I.value||b.value,"bot-vision-model-list")}),b.value&&_(b.value,"bot-model-list"),(I.value||b.value)&&_(I.value||b.value,"bot-vision-model-list"),[{input:"bot-temp",display:"temp-val"},{input:"bot-topp",display:"topp-val"},{input:"bot-pp",display:"pp-val"},{input:"bot-fp",display:"fp-val"}].forEach(({input:r,display:n})=>{const m=document.getElementById(r),l=document.getElementById(n);m.addEventListener("input",()=>{l.textContent=m.value})}),document.getElementById("back-btn").addEventListener("click",()=>{window.location.hash="#/"}),document.getElementById("cancel-btn").addEventListener("click",()=>{window.location.hash="#/"});const R=document.getElementById("clear-history-btn");R&&R.addEventListener("click",async()=>{try{const r=await f.getHistory(e.id);if(!r||r.length===0){d("No conversation history to clear","info");return}const n=r.map(v=>`  • ${v.guild_id==="DM"||!v.guild_id?"Direct Messages":`Server ${v.guild_id}`} (${v.message_count} messages)`).join(`
`),m=prompt(`Conversation history for "${e.name}":

${n}

Enter a server ID to clear just that server,
or type "all" to clear everything:`);if(m===null)return;const l=m.trim();if(!l)return;let i;if(l.toLowerCase()==="all"){if(!confirm(`Clear ALL conversation history for "${e.name}" across all servers?`))return;i=await f.clearHistory(e.id)}else{const v=r.find(g=>g.guild_id===l||l.toLowerCase()==="dm"&&(!g.guild_id||g.guild_id==="DM"));if(!v){d("Server ID not found in history","error");return}i=await f.clearHistory(e.id,v.guild_id)}d(`History cleared (${i.messagesRemoved} messages removed)`,"success")}catch(r){d(r.message,"error")}});const K=document.getElementById("delete-btn");K&&K.addEventListener("click",async()=>{if(confirm(`Are you sure you want to delete "${e.name}"? This cannot be undone.`))try{await f.delete(e.id),d(`"${e.name}" deleted`,"info"),window.location.hash="#/"}catch(r){d(r.message,"error")}}),document.getElementById("bot-form").addEventListener("submit",async r=>{var i;r.preventDefault();const n=document.getElementById("save-btn");n.disabled=!0,n.textContent="Saving…";const m={name:document.getElementById("bot-name").value.trim(),model:document.getElementById("bot-model").value.trim(),vision_model:document.getElementById("bot-vision-model").value.trim(),use_chat_vision:((i=document.getElementById("use-chat-vision"))==null?void 0:i.checked)||!1,provider_id:parseInt(document.getElementById("bot-provider").value)||null,vision_provider_id:parseInt(document.getElementById("bot-vision-provider").value)||null,bot_type:document.getElementById("bot-type").value,false_phrases:JSON.stringify(E),system_prompt:document.getElementById("bot-system").value,character_prompt:document.getElementById("bot-character").value,first_message:document.getElementById("bot-first-msg").value,example_messages:document.getElementById("bot-examples").value,prefill:document.getElementById("bot-prefill").value,temperature:parseFloat(document.getElementById("bot-temp").value),top_p:parseFloat(document.getElementById("bot-topp").value),max_tokens:parseInt(document.getElementById("bot-max-tokens").value),max_prompt_tokens:parseInt(document.getElementById("bot-max-prompt").value),presence_penalty:parseFloat(document.getElementById("bot-pp").value),frequency_penalty:parseFloat(document.getElementById("bot-fp").value),auto_start:document.getElementById("bot-autostart").checked},l=document.getElementById("bot-token").value.trim();if(l&&(m.discord_token=l),!m.name){d("Bot name is required","error"),n.disabled=!1,n.textContent=a?"Create Bot":"Save Changes";return}if(a&&!l){d("Discord token is required for new bots","error"),n.disabled=!1,n.textContent="Create Bot";return}try{a?(await f.create(m),d("Bot created!","success")):(await f.update(e.id,m),d("Bot updated!","success")),window.location.hash="#/"}catch(v){d(v.message,"error"),n.disabled=!1,n.textContent=a?"Create Bot":"Save Changes"}})}function y(t){if(!t)return"";const o=document.createElement("div");return o.textContent=t,o.innerHTML}function H(t){return t?t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}const ie=Object.freeze(Object.defineProperty({__proto__:null,destroy:ne,render:Z},Symbol.toStringTag,{value:"Module"}));function le(){}async function ee(t){t.innerHTML=`
    <div class="page">
      <div class="page-header">
        <h1>🔑 API Providers</h1>
        <button class="btn btn-primary" id="add-provider-btn">＋ New Provider</button>
      </div>
      <div id="provider-list" class="card-grid"></div>
    </div>
  `,document.getElementById("add-provider-btn").addEventListener("click",()=>q()),D()}async function D(){var o;const t=document.getElementById("provider-list");if(t)try{const a=await w.list();if(a.length===0){t.innerHTML=`
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🔑</div>
          <p>No API providers yet. Add one to connect your bots to an AI service.</p>
          <button class="btn btn-primary" id="empty-add-btn">＋ Add Provider</button>
        </div>
      `,(o=document.getElementById("empty-add-btn"))==null||o.addEventListener("click",()=>q());return}t.innerHTML=a.map(e=>`
      <div class="card">
        <div class="provider-card-header">
          <span class="provider-card-name">${G(e.name)}</span>
          <div class="provider-card-actions">
            <button class="btn-icon" data-edit-provider="${e.id}" title="Edit">✎</button>
            <button class="btn-icon danger" data-delete-provider="${e.id}" title="Delete">🗑</button>
          </div>
        </div>
        <div class="provider-card-url">${G(e.base_url)}</div>
      </div>
    `).join(""),t.querySelectorAll("[data-edit-provider]").forEach(e=>{e.addEventListener("click",()=>q(parseInt(e.dataset.editProvider)))}),t.querySelectorAll("[data-delete-provider]").forEach(e=>{e.addEventListener("click",async()=>{const s=parseInt(e.dataset.deleteProvider),c=a.find(p=>p.id===s);if(confirm(`Delete provider "${c==null?void 0:c.name}"? Bots using it will lose their API connection.`))try{await w.delete(s),d("Provider deleted","info"),D()}catch(p){d(p.message,"error")}})})}catch(a){t.innerHTML=`<p style="color: var(--danger);">Failed to load providers: ${a.message}</p>`}}async function q(t=null){var c;const o=t!==null;let a=null;if(o)try{a=await w.get(t)}catch(p){d(p.message,"error");return}(c=document.querySelector(".modal-overlay"))==null||c.remove();const e=document.createElement("div");e.className="modal-overlay",e.innerHTML=`
    <div class="modal">
      <div class="modal-header">
        <h2>${o?"Edit Provider":"New Provider"}</h2>
        <button class="btn-icon" id="modal-close">✕</button>
      </div>
      <form id="provider-form" autocomplete="off">
        <div class="form-group">
          <label class="form-label" for="prov-name">Name *</label>
          <input class="form-input" id="prov-name" type="text" placeholder="e.g. OpenRouter, My Local LLM" value="${Q(a==null?void 0:a.name)}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="prov-url">Base URL</label>
          <input class="form-input" id="prov-url" type="url" placeholder="https://openrouter.ai/api/v1" value="${Q((a==null?void 0:a.base_url)||"https://openrouter.ai/api/v1")}" />
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
  `,document.body.appendChild(e);const s=()=>e.remove();document.getElementById("modal-close").addEventListener("click",s),document.getElementById("modal-cancel").addEventListener("click",s),e.addEventListener("click",p=>{p.target===e&&s()}),document.getElementById("provider-form").addEventListener("submit",async p=>{p.preventDefault();const h={name:document.getElementById("prov-name").value.trim(),base_url:document.getElementById("prov-url").value.trim()||"https://openrouter.ai/api/v1"},x=document.getElementById("prov-key").value.trim();if(x&&(h.api_key=x),!h.name){d("Name is required","error");return}if(!o&&!x){d("API key is required","error");return}try{o?(await w.update(t,h),d("Provider updated!","success")):(await w.create(h),d("Provider created!","success")),s(),D()}catch(k){d(k.message,"error")}})}function G(t){if(!t)return"";const o=document.createElement("div");return o.textContent=t,o.innerHTML}function Q(t){return t?t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}const de=Object.freeze(Object.defineProperty({__proto__:null,destroy:le,render:ee},Symbol.toStringTag,{value:"Module"})),ce=document.getElementById("app");let $=null;function pe(t){return`
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
  `}async function te(){$!=null&&$.destroy&&$.destroy();const t=window.location.hash||"#/";let o="dashboard";t.startsWith("#/providers")?o="providers":t.startsWith("#/bots/")&&(o="botEditor"),ce.innerHTML=pe(o)+'<div id="page-content"></div>';const a=document.getElementById("page-content");if(o==="providers")$=de,await ee(a);else if(o==="botEditor"){const e=t.split("/").pop();$=ie,await Z(a,e)}else $=se,Y(a)}window.addEventListener("hashchange",te);window.addEventListener("DOMContentLoaded",()=>{window.location.hash||(window.location.hash="#/"),te()});
