import React, { useEffect, useState, useCallback } from 'react';
import { api } from './api';
import TaskForm from './components/TaskForm';
import TaskCard from './components/TaskCard';

const FILTERS = [
  { value: '',            label: 'All' },
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done',        label: 'Done' },
];

export default function App() {
  const [tasks,  setTasks]  = useState([]);
  const [filter, setFilter] = useState('');
  const [error,  setError]  = useState('');
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    try {
      setError('');
      const data = await api.getTasks(filter);
      setTasks(data);
    } catch (err) {
      setError('Could not load tasks. Is the API running?');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function handleCreate(data) {
    const task = await api.createTask(data);
    setTasks(prev => [task, ...prev]);
  }
  async function handleUpdate(id, data) {
    const updated = await api.updateTask(id, data);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  }
  async function handleDelete(id) {
    await api.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  // Stats for the summary bar
  const counts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const s = {
    page:   { maxWidth: 720, margin: '0 auto', padding: '32px 16px' },
    header: { marginBottom: 28 },
    title:  { fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' },
    sub:    { color: 'var(--muted)', fontSize: 14, marginTop: 4 },
    stats:  { display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' },
    stat:   (color) => ({
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 16px', fontSize: 13,
      borderTop: `3px solid ${color}`,
    }),
    statNum: { fontSize: 22, fontWeight: 700, display: 'block' },
    card:   {
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: 20, marginBottom: 24,
    },
    cardTitle: { fontWeight: 600, marginBottom: 14, fontSize: 15 },
    filters: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
    filterBtn: (active) => ({
      padding: '6px 14px', fontSize: 13, fontWeight: 500,
      background: active ? 'var(--blue)' : 'var(--surface)',
      color: active ? '#fff' : 'var(--text)',
      border: '1px solid ' + (active ? 'var(--blue)' : 'var(--border)'),
      borderRadius: 20,
    }),
    taskList: { display: 'flex', flexDirection: 'column', gap: 10 },
    empty:  { textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: 14 },
    err:    {
      background: 'var(--red-lt)', border: '1px solid var(--red)',
      color: 'var(--red)', borderRadius: 8, padding: '10px 14px', fontSize: 14,
      marginBottom: 16,
    },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.title}>📋 Task Manager</h1>
        <p style={s.sub}>Hosted on AWS · React + Node.js + PostgreSQL</p>

        <div style={s.stats}>
          {[
            { label: 'Total',       value: tasks.length,                color: 'var(--blue)'  },
            { label: 'Pending',     value: counts.pending     || 0,     color: 'var(--amber)' },
            { label: 'In Progress', value: counts.in_progress || 0,     color: 'var(--blue)'  },
            { label: 'Done',        value: counts.done        || 0,     color: 'var(--green)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={s.stat(color)}>
              <span style={s.statNum}>{value}</span>
              {label}
            </div>
          ))}
        </div>
      </header>

      {/* Add Task */}
      <div style={s.card}>
        <p style={s.cardTitle}>Add a new task</p>
        <TaskForm onCreated={handleCreate} />
      </div>

      {/* Error */}
      {error && <div style={s.err}>⚠️ {error}</div>}

      {/* Filter buttons */}
      <div style={s.filters}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            style={s.filterBtn(filter === f.value)}
            onClick={() => { setFilter(f.value); setLoading(true); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <p style={s.empty}>Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p style={s.empty}>No tasks here yet. Add one above!</p>
      ) : (
        <div style={s.taskList}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
