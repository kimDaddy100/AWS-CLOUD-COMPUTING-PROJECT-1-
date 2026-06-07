import React, { useState } from 'react';

const PRIORITY_COLOR = {
  high:   { bg: 'var(--red-lt)',   text: 'var(--red)',   label: 'High' },
  medium: { bg: 'var(--amber-lt)', text: 'var(--amber)', label: 'Medium' },
  low:    { bg: 'var(--green-lt)', text: 'var(--green)', label: 'Low' },
};
const STATUS_NEXT = {
  pending:     'in_progress',
  in_progress: 'done',
  done:        'pending',
};
const STATUS_LABEL = {
  pending:     '⏳ Pending',
  in_progress: '🔄 In Progress',
  done:        '✅ Done',
};

export default function TaskCard({ task, onUpdate, onDelete }) {
  const [loading, setLoading] = useState(false);
  const p = PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium;
  const isDone = task.status === 'done';

  async function cycleStatus() {
    setLoading(true);
    try { await onUpdate(task.id, { status: STATUS_NEXT[task.status] }); }
    finally { setLoading(false); }
  }
  async function remove() {
    if (!confirm('Delete this task?')) return;
    setLoading(true);
    try { await onDelete(task.id); }
    finally { setLoading(false); }
  }

  const s = {
    card: {
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '14px 16px',
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      opacity: loading ? 0.6 : 1,
      transition: 'opacity .15s',
    },
    main: { flex: 1, minWidth: 0 },
    title: {
      fontWeight: 600,
      fontSize: 15,
      textDecoration: isDone ? 'line-through' : 'none',
      color: isDone ? 'var(--muted)' : 'var(--text)',
      wordBreak: 'break-word',
    },
    desc: { fontSize: 13, color: 'var(--muted)', marginTop: 4, wordBreak: 'break-word' },
    tags: { display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' },
    badge: (bg, color) => ({
      fontSize: 12, fontWeight: 500,
      background: bg, color,
      padding: '2px 8px', borderRadius: 20,
    }),
    statusBtn: {
      background: 'none',
      border: '1px solid var(--border)',
      padding: '2px 8px',
      fontSize: 12,
      fontWeight: 500,
      color: 'var(--text)',
    },
    delBtn: {
      background: 'none',
      color: 'var(--muted)',
      fontSize: 18,
      lineHeight: 1,
      padding: '2px 6px',
      borderRadius: 6,
    },
    date: { fontSize: 11, color: 'var(--muted)', marginTop: 6 },
  };

  return (
    <div style={s.card}>
      <div style={s.main}>
        <div style={s.title}>{task.title}</div>
        {task.description && <div style={s.desc}>{task.description}</div>}
        <div style={s.tags}>
          <span style={s.badge(p.bg, p.text)}>{p.label}</span>
          <button style={s.statusBtn} onClick={cycleStatus} disabled={loading}
            title="Click to advance status">
            {STATUS_LABEL[task.status]}
          </button>
        </div>
        <div style={s.date}>
          Created {new Date(task.created_at).toLocaleDateString()}
        </div>
      </div>
      <button style={s.delBtn} onClick={remove} disabled={loading} title="Delete task">×</button>
    </div>
  );
}
