import React, { useState } from 'react';

const s = {
  form:   { display: 'flex', flexDirection: 'column', gap: 10 },
  row:    { display: 'flex', gap: 10 },
  label:  { fontSize: 13, fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: 4 },
  btn:    { background: 'var(--blue)', color: '#fff', padding: '9px 20px', alignSelf: 'flex-end' },
  err:    { color: 'var(--red)', fontSize: 13 },
};

export default function TaskForm({ onCreated }) {
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return setError('Title is required');
    setLoading(true); setError('');
    try {
      await onCreated({ title, description: desc, priority });
      setTitle(''); setDesc(''); setPriority('medium');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form style={s.form} onSubmit={handleSubmit}>
      <div>
        <label style={s.label}>Task title *</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Set up AWS S3 bucket"
        />
      </div>
      <div>
        <label style={s.label}>Description</label>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Optional details..."
        />
      </div>
      <div style={s.row}>
        <div style={{ flex: 1 }}>
          <label style={s.label}>Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Adding…' : '+ Add Task'}
          </button>
        </div>
      </div>
      {error && <p style={s.err}>{error}</p>}
    </form>
  );
}
