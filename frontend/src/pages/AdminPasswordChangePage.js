import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';
import '../styles/AuthPage.css';

function AdminPasswordChangePage({ authUser, onAuthUserUpdate }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.new_password.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError('New password and confirm password must match.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await adminService.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      });
      if (response?.data?.user) {
        onAuthUserUpdate(response.data.user);
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (apiError) {
      setError(apiError?.response?.data?.error || 'Password change failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-modal">
        <h1>Change Admin Password</h1>
        <p>
          {authUser?.first_name ? `${authUser.first_name}, ` : ''}
          you must change your temporary password before using the admin dashboard.
        </p>
        {error && <div className="auth-error">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          <label>
            Current Password
            <input
              type="password"
              value={form.current_password}
              onChange={(event) => setForm({ ...form, current_password: event.target.value })}
              required
              autoComplete="current-password"
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              value={form.new_password}
              onChange={(event) => setForm({ ...form, new_password: event.target.value })}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm New Password
            <input
              type="password"
              value={form.confirm_password}
              onChange={(event) => setForm({ ...form, confirm_password: event.target.value })}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminPasswordChangePage;
