import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';

const EMPTY_FORM = { username: '', email: '', password: '' };

function formatError(err) {
  if (err.details?.length) {
    return err.details.map((d) => `${d.field}: ${d.message}`).join('; ');
  }
  return err.message;
}

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === 'register';

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleMode() {
    setMode(isRegister ? 'login' : 'register');
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(form);
      } else {
        await login({ email: form.email, password: form.password });
      }
    } catch (err) {
      setError(formatError(err));
      setSubmitting(false);
    }
  }

  return (
    <section className="card auth-card">
      <h2>{isRegister ? 'Create an account' : 'Sign in'}</h2>
      <form className="form" onSubmit={handleSubmit}>
        {isRegister && (
          <label className="field">
            <span>Username</span>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
            />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Please wait…' : isRegister ? 'Register' : 'Sign in'}
        </button>
      </form>
      <button type="button" className="link-button" onClick={toggleMode}>
        {isRegister ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
    </section>
  );
}
