import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/AuthPage.css';

function DeveloperLoginPage({ onDeveloperLogin }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const next = useMemo(() => {
    const params = new URLSearchParams(location.search || '');
    const raw = params.get('next') || '/admin/developer';
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/admin/developer';
  }, [location.search]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onDeveloperLogin(form);
      navigate(next, { replace: true });
    } catch (apiError) {
      setError(apiError?.response?.data?.error || 'Developer login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-modal">
        <h1>Developer Login</h1>
        <p>Super Admin only. Access is validated by the backend.</p>
        {error && <div className="auth-error">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          <label>
            Email or Username
            <input
              type="text"
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              required
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default DeveloperLoginPage;
