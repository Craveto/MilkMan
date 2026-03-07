import React, { useEffect, useMemo, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import '../styles/AuthPage.css';

const initialLogin = {
  identifier: '',
  password: '',
};

const initialSignup = {
  role: 'user',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  username: '',
  password: '',
  shop_name: '',
  shop_address: '',
  gst_number: '',
  notes: '',
};

function AuthPage({
  onLogin,
  onSignup,
  isModal = false,
  onClose = null,
  initialTab = 'login',
  notice = '',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loginData, setLoginData] = useState(initialLogin);
  const [signupData, setSignupData] = useState(initialSignup);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isAdminSignup = useMemo(() => signupData.role === 'admin', [signupData.role]);

  const normalizeIndianPhone = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length >= 12 && digits.startsWith('91')) return digits.slice(-10);
    return digits.slice(0, 10);
  };

  useEffect(() => {
    setActiveTab(initialTab);
    setError('');
  }, [initialTab]);

  const submitLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await onLogin(loginData);
      setLoginData(initialLogin);
    } catch (apiError) {
      setError(apiError?.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitSignup = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await onSignup(signupData);
      setError('');
      setSignupData(initialSignup);
      if (signupData.role === 'admin' && response?.data?.status === 'pending') {
        setActiveTab('login');
      }
    } catch (apiError) {
      const details = apiError?.response?.data;
      if (typeof details === 'string') {
        setError(details);
      } else if (details?.error) {
        setError(details.error);
      } else {
        setError('Signup failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const authCard = (
    <div className={`auth-card ${isModal ? 'auth-card-modal' : ''}`}>
      {isModal && (
        <button type="button" className="auth-close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      )}
        <h1>MilkMan Portal</h1>
        <p>Login or create an account to continue.</p>
        {notice && <div className="auth-notice">{notice}</div>}

        <div className="auth-tabs">
          <button
            type="button"
            className={activeTab === 'login' ? 'active' : ''}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={activeTab === 'signup' ? 'active' : ''}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {activeTab === 'login' ? (
          <form className="auth-form" onSubmit={submitLogin}>
            <label>
              Email / Username / Phone
              <input
                type="text"
                value={loginData.identifier}
                onChange={(event) => setLoginData({ ...loginData, identifier: event.target.value })}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={loginData.password}
                onChange={(event) => setLoginData({ ...loginData, password: event.target.value })}
                required
              />
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? 'Please wait...' : 'Login'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitSignup}>
            <label>
              Account Type
              <select
                value={signupData.role}
                onChange={(event) => setSignupData({ ...signupData, role: event.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <label>
              First Name
              <input
                type="text"
                value={signupData.first_name}
                onChange={(event) => setSignupData({ ...signupData, first_name: event.target.value })}
                required
              />
            </label>

            <label>
              Last Name
              <input
                type="text"
                value={signupData.last_name}
                onChange={(event) => setSignupData({ ...signupData, last_name: event.target.value })}
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={signupData.email}
                onChange={(event) => setSignupData({ ...signupData, email: event.target.value })}
                required
              />
            </label>

            <label>
              Phone
              <input
                type="tel"
                value={signupData.phone}
                onChange={(event) => setSignupData({ ...signupData, phone: normalizeIndianPhone(event.target.value) })}
                required
                placeholder="10-digit mobile (India)"
                inputMode="numeric"
                maxLength={10}
                pattern="[6-9][0-9]{9}"
                title="Enter 10-digit Indian mobile number (starts with 6-9)"
              />
            </label>

            {isAdminSignup && (
              <>
                <label>
                  Shop Name
                  <input
                    type="text"
                    value={signupData.shop_name}
                    onChange={(event) => setSignupData({ ...signupData, shop_name: event.target.value })}
                    required={isAdminSignup}
                  />
                </label>
                <label>
                  Shop Address
                  <input
                    type="text"
                    value={signupData.shop_address}
                    onChange={(event) => setSignupData({ ...signupData, shop_address: event.target.value })}
                    placeholder="Optional"
                  />
                </label>
                <label>
                  GST Number
                  <input
                    type="text"
                    value={signupData.gst_number}
                    onChange={(event) => setSignupData({ ...signupData, gst_number: event.target.value })}
                    placeholder="Optional"
                  />
                </label>
                <label>
                  Notes
                  <input
                    type="text"
                    value={signupData.notes}
                    onChange={(event) => setSignupData({ ...signupData, notes: event.target.value })}
                    placeholder="Optional"
                  />
                </label>
              </>
            )}

            {!isAdminSignup && (
              <label>
                Password
                <input
                  type="password"
                  value={signupData.password}
                  onChange={(event) => setSignupData({ ...signupData, password: event.target.value })}
                  required
                />
              </label>
            )}

            <button type="submit" disabled={submitting}>
              {submitting ? 'Please wait...' : 'Create Account'}
            </button>
          </form>
        )}
    </div>
  );

  if (isModal) {
    return authCard;
  }

  return (
    <div className="auth-page">
      {authCard}
    </div>
  );
}

export default AuthPage;
