import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { login, loading, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('admin@inventory.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>Inventory</h1>
          <p>Sign in to your admin account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <FormField label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@inventory.com"
              autoComplete="email"
            />
          </FormField>
          <FormField label="Password" required>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </FormField>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="login-hint">Default email: admin@inventory.com</p>
      </div>
    </div>
  );
}
