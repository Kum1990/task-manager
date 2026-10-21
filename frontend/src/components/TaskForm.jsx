import { useState } from 'react';

const EMPTY_TASK = { title: '', description: '', priority: 'medium', dueDate: '' };

export default function TaskForm({ onCreate }) {
  const [form, setForm] = useState(EMPTY_TASK);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onCreate({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        dueDate: form.dueDate || null,
      });
      setForm(EMPTY_TASK);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card form task-form" onSubmit={handleSubmit}>
      <h2>New task</h2>
      <label className="field">
        <span>Title</span>
        <input name="title" value={form.title} onChange={handleChange} maxLength={200} />
      </label>
      <label className="field">
        <span>Description</span>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          maxLength={2000}
        />
      </label>
      <div className="row">
        <label className="field">
          <span>Priority</span>
          <select name="priority" value={form.priority} onChange={handleChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="field">
          <span>Due date</span>
          <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} />
        </label>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button type="submit" className="btn" disabled={submitting}>
        {submitting ? 'Adding…' : 'Add task'}
      </button>
    </form>
  );
}
