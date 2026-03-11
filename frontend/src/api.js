// ═══════════════════════════════════════════════
//  CordBridge — API Helper
// ═══════════════════════════════════════════════

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ── Providers ──
export const providers = {
  list:   ()           => request('/providers'),
  get:    (id)         => request(`/providers/${id}`),
  create: (body)       => request('/providers', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body)   => request(`/providers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id)         => request(`/providers/${id}`, { method: 'DELETE' }),
};

// ── Bots ──
export const bots = {
  list:   ()           => request('/bots'),
  get:    (id)         => request(`/bots/${id}`),
  create: (body)       => request('/bots', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body)   => request(`/bots/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id)         => request(`/bots/${id}`, { method: 'DELETE' }),
  start:  (id)         => request(`/bots/${id}/start`, { method: 'POST' }),
  stop:   (id)         => request(`/bots/${id}/stop`, { method: 'POST' }),
};
