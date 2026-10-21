const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const isTest = import.meta.env.MODE === 'test';
const consoleLevel = import.meta.env.VITE_LOG_LEVEL || (isTest ? 'error' : 'info');
const remoteLevel = import.meta.env.VITE_REMOTE_LOG_LEVEL || 'info';

function sendToServer(entry) {
  if (isTest) return;
  try {
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Logging must never break the app.
  }
}

function log(level, message, context = {}) {
  const entry = {
    level,
    message,
    context: { ...context, path: window.location.pathname },
    timestamp: new Date().toISOString(),
  };
  if (LEVELS[level] >= LEVELS[consoleLevel]) {
    const method = level === 'debug' ? 'debug' : level;
    console[method](`[${entry.timestamp}] ${level.toUpperCase()} ${message}`, context);
  }
  if (LEVELS[level] >= LEVELS[remoteLevel]) {
    sendToServer(entry);
  }
}

const logger = {
  debug: (message, context) => log('debug', message, context),
  info: (message, context) => log('info', message, context),
  warn: (message, context) => log('warn', message, context),
  error: (message, context) => log('error', message, context),
};

export default logger;
