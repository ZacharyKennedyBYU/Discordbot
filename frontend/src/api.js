// ═══════════════════════════════════════════════
//  CordBridge — API Helper
// ═══════════════════════════════════════════════

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = { error: text };
    }
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const upload = async (file) => {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    body: fd
  });
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = { error: text };
    }
  }
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data;
};

// ── Providers ──
export const providers = {
  list:      ()           => request('/providers'),
  get:       (id)         => request(`/providers/${id}`),
  create:    (body)       => request('/providers', { method: 'POST', body: JSON.stringify(body) }),
  update:    (id, body)   => request(`/providers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:    (id)         => request(`/providers/${id}`, { method: 'DELETE' }),
  getModels: (id)         => request(`/providers/${id}/models`),
};

// ── Bots ──
export const bots = {
  list:         ()           => request('/bots'),
  get:          (id)         => request(`/bots/${id}`),
  create:       (body)       => request('/bots', { method: 'POST', body: JSON.stringify(body) }),
  update:       (id, body)   => request(`/bots/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:       (id)         => request(`/bots/${id}`, { method: 'DELETE' }),
  start:        (id)         => request(`/bots/${id}/start`, { method: 'POST' }),
  stop:         (id)         => request(`/bots/${id}/stop`, { method: 'POST' }),
  getHistory:   (id)         => request(`/bots/${id}/history`),
  clearHistory: (id, guildId) => request(`/bots/${id}/history${guildId ? `?guild_id=${encodeURIComponent(guildId)}` : ''}`, { method: 'DELETE' }),
  getMemory:     (id, guildId) => request(`/bots/${id}/memory${guildId ? `?guild_id=${encodeURIComponent(guildId)}` : ''}`),
  saveMemory:    (id, guildId, summary) => request(`/bots/${id}/memory`, { method: 'PUT', body: JSON.stringify({ guild_id: guildId || 'DM', summary }) }),
  getLorebooks:    (id)              => request(`/bots/${id}/lorebooks`),
  attachLorebook:  (id, lorebookId)  => request(`/bots/${id}/lorebooks`, { method: 'POST', body: JSON.stringify({ lorebook_id: lorebookId }) }),
  updateLorebook:  (id, lbId, overrides) => request(`/bots/${id}/lorebooks/${lbId}`, { method: 'PUT', body: JSON.stringify({ overrides }) }),
  detachLorebook:  (id, lbId)        => request(`/bots/${id}/lorebooks/${lbId}`, { method: 'DELETE' }),
  getLogServers:   (id)              => request(`/bots/${id}/log_servers`),
  getLogs:         (id, guildId)     => request(`/bots/${id}/logs${guildId ? `?guild_id=${encodeURIComponent(guildId)}` : ''}`),
};

// ── Lorebooks ──
export const lorebooks = {
  list:   ()       => request('/lorebooks'),
  get:    (id)     => request(`/lorebooks/${id}`),
  create: (body)   => request('/lorebooks', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id)     => request(`/lorebooks/${id}`, { method: 'DELETE' }),
};
