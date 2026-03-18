import React, { useState, useEffect } from 'react';
import { Events } from '../../../shared/events';
import { AppEvent } from '../../../shared/types';

interface Props {
  onBack: () => void;
  publish: (event: AppEvent) => void;
  lastEvent: AppEvent | null;
}

export const Register: React.FC<Props> = ({ onBack, publish, lastEvent }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lastEvent?.type === Events.AUTH_REGISTER_RESPONSE) {
      setLoading(false);
      const payload = lastEvent.payload;
      if (payload.success) {
        // Success: back to login
        onBack();
      } else {
        setError(payload.error || 'Registration failed.');
      }
    }
  }, [lastEvent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    publish({
      type: Events.AUTH_REGISTER_REQUEST,
      payload: { username, password },
      timestamp: Date.now(),
      source: 'renderer'
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Register</h2>
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              required
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={styles.footer}>
          <button onClick={onBack} style={styles.linkButton} disabled={loading}>
            &larr; Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#0a0a1a', // Minimal dark theme
  },
  card: {
    backgroundColor: '#16213e',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box',
  },
  title: {
    margin: '0 0 24px 0',
    fontSize: '1.8rem',
    color: '#e94560',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#e0e0e0',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #1f2a4a',
    backgroundColor: '#0a0a1a',
    color: '#fff',
    outline: 'none',
    fontSize: '1rem',
  },
  button: {
    padding: '14px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem',
    marginTop: '10px',
    transition: 'background-color 0.2s',
  },
  error: {
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    color: '#ff6b6b',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '0.9rem',
    textAlign: 'center',
    border: '1px solid rgba(233, 69, 96, 0.3)',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#a0a0a0',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#a0a0a0',
    cursor: 'pointer',
    fontWeight: 'bold',
    padding: 0,
    fontSize: '0.9rem',
  }
};
