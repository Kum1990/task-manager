import { useAuth } from './hooks/useAuth.js';
import AuthPage from './pages/AuthPage.jsx';
import TasksPage from './pages/TasksPage.jsx';

export default function App() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Task Manager</h1>
        {user && (
          <div className="user-bar">
            <span>
              Signed in as <strong>{user.username}</strong>
            </span>
            <button type="button" className="btn btn-secondary" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </header>
      <main className="app-main">
        {loading ? <p className="muted">Loading…</p> : user ? <TasksPage /> : <AuthPage />}
      </main>
    </div>
  );
}
