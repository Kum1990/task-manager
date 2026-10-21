import { useState } from 'react';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

function isOverdue(task) {
  const today = new Date().toISOString().slice(0, 10);
  return Boolean(task.dueDate) && task.dueDate < today && task.status !== 'done';
}

export default function TaskItem({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  function startEditing() {
    setDraft({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate || '',
    });
    setEditing(true);
  }

  function handleDraftChange(event) {
    const { name, value } = event.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    await onUpdate(task.id, {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      dueDate: draft.dueDate || null,
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="task-item editing">
        <form className="form" onSubmit={saveEdit}>
          <label className="field">
            <span>Edit title</span>
            <input name="title" value={draft.title} onChange={handleDraftChange} />
          </label>
          <label className="field">
            <span>Edit description</span>
            <textarea
              name="description"
              value={draft.description}
              onChange={handleDraftChange}
              rows={2}
            />
          </label>
          <div className="row">
            <label className="field">
              <span>Edit priority</span>
              <select name="priority" value={draft.priority} onChange={handleDraftChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="field">
              <span>Edit due date</span>
              <input
                name="dueDate"
                type="date"
                value={draft.dueDate}
                onChange={handleDraftChange}
              />
            </label>
          </div>
          <div className="actions">
            <button type="submit" className="btn">
              Save
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`task-item status-${task.status}`}>
      <div className="task-main">
        <h3 className="task-title">{task.title}</h3>
        {task.description && <p className="task-description">{task.description}</p>}
        <div className="task-meta">
          <span className={`badge priority-${task.priority}`}>{task.priority}</span>
          {task.dueDate && (
            <span className={isOverdue(task) ? 'due overdue' : 'due'}>Due {task.dueDate}</span>
          )}
        </div>
      </div>
      <div className="task-actions">
        <select
          aria-label={`Status of ${task.title}`}
          value={task.status}
          onChange={(event) => onUpdate(task.id, { status: event.target.value })}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-secondary"
          aria-label={`Edit ${task.title}`}
          onClick={startEditing}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn btn-danger"
          aria-label={`Delete ${task.title}`}
          onClick={() => onDelete(task.id)}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
