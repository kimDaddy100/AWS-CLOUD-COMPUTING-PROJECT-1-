// Base URL: empty string in dev (Vite proxy handles /api)
// In production build, set VITE_API_URL to your Elastic Beanstalk URL
const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getTasks:   (status) => request(`/api/tasks${status ? `?status=${status}` : ''}`),
  createTask: (data)   => request('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id)     => request(`/api/tasks/${id}`, { method: 'DELETE' }),
};
