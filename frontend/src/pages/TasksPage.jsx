import { useCallback, useEffect, useState } from 'react';
import TaskForm from '../components/TaskForm.jsx';
import TaskList from '../components/TaskList.jsx';
import { useAuth } from '../hooks/useAuth.js';
import * as taskService from '../services/taskService.js';
import logger from '../utils/logger.js';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export default function TasksPage() {
  const { logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleError = useCallback(
    (err) => {
      if (err.status === 401) {
        logout();
        return;
      }
      logger.error('Task operation failed', { message: err.message, status: err.status });
      setError(err.message);
    },
    [logout],
  );

  useEffect(() => {
    let cancelled = false;
    taskService
      .listTasks(filter)
      .then(({ tasks: loaded }) => {
        if (cancelled) return;
        setTasks(loaded);
        setError('');
      })
      .catch((err) => !cancelled && handleError(err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filter, handleError]);

  const matchesFilter = (task) => !filter || task.status === filter;

  async function handleCreate(data) {
    try {
      const { task } = await taskService.createTask(data);
      logger.info('Task created', { taskId: task.id });
      if (matchesFilter(task)) setTasks((prev) => [task, ...prev]);
    } catch (err) {
      if (err.status === 401) logout();
      throw err;
    }
  }

  async function handleUpdate(id, changes) {
    try {
      const { task } = await taskService.updateTask(id, changes);
      logger.info('Task updated', { taskId: id, fields: Object.keys(changes) });
      setTasks((prev) =>
        matchesFilter(task)
          ? prev.map((t) => (t.id === id ? task : t))
          : prev.filter((t) => t.id !== id),
      );
    } catch (err) {
      handleError(err);
    }
  }

  async function handleDelete(id) {
    try {
      await taskService.deleteTask(id);
      logger.info('Task deleted', { taskId: id });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      handleError(err);
    }
  }

  function handleFilterChange(event) {
    setLoading(true);
    setFilter(event.target.value);
  }

  return (
    <div className="tasks-page">
      <TaskForm onCreate={handleCreate} />
      <section className="card">
        <div className="toolbar">
          <h2>My tasks</h2>
          <label className="field inline">
            <span>Show</span>
            <select value={filter} onChange={handleFilterChange}>
              {FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {loading ? (
          <p className="muted">Loading tasks…</p>
        ) : (
          <TaskList tasks={tasks} onUpdate={handleUpdate} onDelete={handleDelete} />
        )}
      </section>
    </div>
  );
}
