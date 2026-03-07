import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserModules.css';
import Modal from '../components/Modal';
import { userService } from '../services/api';

const emptyAddress = {
  label: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  is_default: false,
};

const makeChangeOtpState = () => ({
  pending: '',
  email: { sent: false, code: '', status: null, devOtp: null, verified: false },
  phone: { sent: false, code: '', status: null, devOtp: null, verified: false },
  loading: false,
  action: null, // 'send' | 'verify'
  completed: false,
});

function UserProfilePage({ authUser, onAuthUserUpdate, onAuthRefresh }) {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState('settings');
  const [openSection, setOpenSection] = useState('account');
  const [prefs, setPrefs] = useState(() => {
    const raw = window.localStorage.getItem('mm_user_prefs');
    return raw ? JSON.parse(raw) : {
      email_updates: true,
      sms_alerts: true,
      language: 'en',
    };
  });
  const [prefsStatus, setPrefsStatus] = useState(null);

  const savePreferences = () => {
    window.localStorage.setItem('mm_user_prefs', JSON.stringify(prefs));
    setPrefsStatus('Saved');
    window.setTimeout(() => setPrefsStatus(null), 1500);
  };

  const initialProfile = useMemo(() => ({
    username: authUser?.username || '',
    email: authUser?.email || '',
    phone: authUser?.phone || '',
  }), [authUser?.email, authUser?.phone, authUser?.username]);

  const [profileForm, setProfileForm] = useState(initialProfile);
  const [emailChangeOtp, setEmailChangeOtp] = useState(makeChangeOtpState);
  const [phoneChangeOtp, setPhoneChangeOtp] = useState(makeChangeOtpState);
  const [profileStatus, setProfileStatus] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const pushToast = (message, variant = 'info') => setToast({ message, variant });

  const showDevOtp = (
    process.env.REACT_APP_SHOW_DEV_OTP === 'true'
    && window.location.hostname === 'localhost'
    && window.localStorage.getItem('mm_show_dev_otp') === '1'
  );

  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressStatus, setAddressStatus] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOtps, setDeleteOtps] = useState({
    email: { sent: false, code: '', status: null, devOtp: null, verified: false },
    phone: { sent: false, code: '', status: null, devOtp: null, verified: false },
    loading: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadProfileAndAddresses = async () => {
    setProfileLoading(true);
    setAddressesLoading(true);
    try {
      const response = await userService.getProfile();
      const profile = response?.data?.profile;
      if (profile) {
        setProfileForm({
          username: profile.username || '',
          email: profile.email || '',
          phone: profile.phone || '',
        });
      }
      setAddresses(response?.data?.addresses || []);
    } catch (error) {
      setProfileForm(initialProfile);
      setAddresses([]);
    } finally {
      setProfileLoading(false);
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    setProfileForm(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    loadProfileAndAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast?.message) return undefined;
    const timerId = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timerId);
  }, [toast?.message]);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileStatus(null);
    try {
      const payload = {};
      if ((profileForm.username || '') !== (initialProfile.username || '')) payload.username = profileForm.username || null;

      if (Object.keys(payload).length === 0) {
        setProfileStatus('No changes to save.');
        return;
      }

      const response = await userService.updateProfile(payload);
      const updatedUser = response?.data?.user;
      if (updatedUser && onAuthUserUpdate) onAuthUserUpdate(updatedUser);
      if (onAuthRefresh) {
        try {
          await onAuthRefresh();
        } catch (error) {
          // Ignore refresh errors; UI already updated.
        }
      }
      setProfileStatus('Saved');
      window.setTimeout(() => setProfileStatus(null), 1500);
    } catch (error) {
      setProfileStatus('Failed to save. Please check your inputs.');
    }
  };

  const normalizeIndianPhoneOnClient = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(-10);
    return digits.slice(0, 10);
  };

  const requestEmailChangeOtps = async () => {
    const nextEmail = (profileForm.email || '').trim();
    if (!nextEmail) {
      setEmailChangeOtp((prev) => ({ ...prev, email: { ...prev.email, status: 'Enter email first.' } }));
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(nextEmail)) {
      setEmailChangeOtp((prev) => ({ ...prev, email: { ...prev.email, status: 'Enter a valid email address.' } }));
      pushToast('Please enter a valid email address.', 'error');
      return;
    }
    if ((nextEmail || '') === (initialProfile.email || '')) {
      setEmailChangeOtp((prev) => ({ ...prev, email: { ...prev.email, status: 'Email is unchanged.' } }));
      return;
    }
    setEmailChangeOtp({
      pending: nextEmail,
      email: { sent: false, code: '', status: null, devOtp: null, verified: false },
      phone: { sent: false, code: '', status: null, devOtp: null, verified: false },
      loading: true,
      action: 'send',
      completed: false,
    });
    try {
      const [emailResp, phoneResp] = await Promise.all([
        userService.requestOtp({ type: 'email', purpose: 'update_email', value: nextEmail }),
        userService.requestOtp({ type: 'phone', purpose: 'update_email', value: nextEmail }),
      ]);
      setEmailChangeOtp({
        pending: nextEmail,
        email: { sent: true, code: '', status: 'OTP sent to registered email.', devOtp: emailResp?.data?.dev_otp || null, verified: false },
        phone: { sent: true, code: '', status: 'OTP sent to registered phone.', devOtp: phoneResp?.data?.dev_otp || null, verified: false },
        loading: false,
        action: null,
        completed: false,
      });
      pushToast(
        process.env.NODE_ENV === 'production'
          ? 'OTPs sent to your registered email and phone.'
          : 'OTP sent. Email arrives in inbox; SMS OTP is logged in the backend console unless SMS is configured.',
        'info'
      );
    } catch (error) {
      setEmailChangeOtp((prev) => ({ ...prev, loading: false, action: null, email: { ...prev.email, status: 'Failed to send OTPs.' } }));
      pushToast('Failed to send OTPs. Please try again.', 'error');
    }
  };

  const verifyEmailChangeOtp = async (channel) => {
    const pending = emailChangeOtp.pending || (profileForm.email || '').trim();
    if (!pending) return;
    const code = channel === 'email' ? emailChangeOtp.email.code : emailChangeOtp.phone.code;
    setEmailChangeOtp((prev) => ({ ...prev, loading: true, action: 'verify' }));
    try {
      const response = await userService.verifyOtp({
        type: channel,
        purpose: 'update_email',
        value: pending,
        code,
      });
      const serverMessage = response?.data?.message || 'OTP verified.';
      const updatedUser = response?.data?.user;
      if (updatedUser && onAuthUserUpdate) onAuthUserUpdate(updatedUser);
      if (onAuthRefresh) {
        try { await onAuthRefresh(); } catch (error) { /* ignore */ }
      }
      setEmailChangeOtp((prev) => {
        const next = {
          ...prev,
          loading: false,
          action: null,
          [channel]: { ...prev[channel], status: serverMessage, verified: true },
        };
        if (updatedUser) next.completed = true;
        return next;
      });
      if (updatedUser) {
        pushToast('Email updated successfully.', 'success');
        window.setTimeout(() => setEmailChangeOtp(makeChangeOtpState()), 1600);
      } else {
        pushToast(channel === 'email' ? 'Email OTP verified. Verify phone OTP to finish.' : 'Phone OTP verified. Verify email OTP to finish.', 'info');
      }
    } catch (error) {
      setEmailChangeOtp((prev) => ({
        ...prev,
        loading: false,
        action: null,
        [channel]: { ...prev[channel], status: error?.response?.data?.error || 'Invalid/expired OTP.' },
      }));
      pushToast('Invalid/expired OTP. Please try again.', 'error');
    }
  };

  const requestPhoneChangeOtps = async () => {
    const nextPhone = normalizeIndianPhoneOnClient(profileForm.phone);
    if (!nextPhone) {
      setPhoneChangeOtp((prev) => ({ ...prev, phone: { ...prev.phone, status: 'Enter mobile number first.' } }));
      return;
    }
    if (!/^[6-9][0-9]{9}$/.test(nextPhone)) {
      setPhoneChangeOtp((prev) => ({ ...prev, phone: { ...prev.phone, status: 'Enter a valid 10-digit Indian mobile number.' } }));
      return;
    }
    if ((nextPhone || '') === normalizeIndianPhoneOnClient(initialProfile.phone || '')) {
      setPhoneChangeOtp((prev) => ({ ...prev, phone: { ...prev.phone, status: 'Mobile number is unchanged.' } }));
      return;
    }
    setPhoneChangeOtp({
      pending: nextPhone,
      email: { sent: false, code: '', status: null, devOtp: null, verified: false },
      phone: { sent: false, code: '', status: null, devOtp: null, verified: false },
      loading: true,
      action: 'send',
      completed: false,
    });
    try {
      const [emailResp, phoneResp] = await Promise.all([
        userService.requestOtp({ type: 'email', purpose: 'update_phone', value: nextPhone }),
        userService.requestOtp({ type: 'phone', purpose: 'update_phone', value: nextPhone }),
      ]);
      setPhoneChangeOtp({
        pending: nextPhone,
        email: { sent: true, code: '', status: 'OTP sent to registered email.', devOtp: emailResp?.data?.dev_otp || null, verified: false },
        phone: { sent: true, code: '', status: 'OTP sent to registered phone.', devOtp: phoneResp?.data?.dev_otp || null, verified: false },
        loading: false,
        action: null,
        completed: false,
      });
      pushToast(
        process.env.NODE_ENV === 'production'
          ? 'OTPs sent to your registered email and phone.'
          : 'OTP sent. Email arrives in inbox; SMS OTP is logged in the backend console unless SMS is configured.',
        'info'
      );
    } catch (error) {
      setPhoneChangeOtp((prev) => ({ ...prev, loading: false, action: null, phone: { ...prev.phone, status: 'Failed to send OTPs.' } }));
      pushToast('Failed to send OTPs. Please try again.', 'error');
    }
  };

  const verifyPhoneChangeOtp = async (channel) => {
    const pending = phoneChangeOtp.pending || normalizeIndianPhoneOnClient(profileForm.phone);
    if (!pending) return;
    const code = channel === 'email' ? phoneChangeOtp.email.code : phoneChangeOtp.phone.code;
    setPhoneChangeOtp((prev) => ({ ...prev, loading: true, action: 'verify' }));
    try {
      const response = await userService.verifyOtp({
        type: channel,
        purpose: 'update_phone',
        value: pending,
        code,
      });
      const serverMessage = response?.data?.message || 'OTP verified.';
      const updatedUser = response?.data?.user;
      if (updatedUser && onAuthUserUpdate) onAuthUserUpdate(updatedUser);
      if (onAuthRefresh) {
        try { await onAuthRefresh(); } catch (error) { /* ignore */ }
      }
      setPhoneChangeOtp((prev) => {
        const next = {
          ...prev,
          loading: false,
          action: null,
          [channel]: { ...prev[channel], status: serverMessage, verified: true },
        };
        if (updatedUser) next.completed = true;
        return next;
      });
      if (updatedUser) {
        pushToast('Mobile number updated successfully.', 'success');
        window.setTimeout(() => setPhoneChangeOtp(makeChangeOtpState()), 1600);
      } else {
        pushToast(channel === 'email' ? 'Email OTP verified. Verify phone OTP to finish.' : 'Phone OTP verified. Verify email OTP to finish.', 'info');
      }
    } catch (error) {
      setPhoneChangeOtp((prev) => ({
        ...prev,
        loading: false,
        action: null,
        [channel]: { ...prev[channel], status: error?.response?.data?.error || 'Invalid/expired OTP.' },
      }));
      pushToast('Invalid/expired OTP. Please try again.', 'error');
    }
  };

  const refreshAddresses = async () => {
    setAddressesLoading(true);
    try {
      const response = await userService.getAddresses();
      setAddresses(response?.data || []);
    } catch (error) {
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  };

  const startEditAddress = (address) => {
    setEditingAddressId(address.address_id);
    setAddressForm({
      label: address.label || '',
      line1: address.line1 || '',
      line2: address.line2 || '',
      city: address.city || '',
      state: address.state || '',
      postal_code: address.postal_code || '',
      country: address.country || '',
      is_default: Boolean(address.is_default),
    });
    setActivePanel('settings');
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm(emptyAddress);
  };

  const handleSaveAddress = async (event) => {
    event.preventDefault();
    setAddressStatus(null);
    try {
      if (!addressForm.line1.trim()) {
        setAddressStatus('Address line 1 is required.');
        return;
      }

      if (editingAddressId) {
        await userService.updateAddress(editingAddressId, addressForm);
        setAddressStatus('Updated');
      } else {
        await userService.createAddress(addressForm);
        setAddressStatus('Added');
      }
      resetAddressForm();
      await refreshAddresses();
      window.setTimeout(() => setAddressStatus(null), 1500);
    } catch (error) {
      setAddressStatus('Failed to save address.');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm('Delete this address?');
    if (!ok) return;
    try {
      await userService.deleteAddress(addressId);
      await refreshAddresses();
    } catch (error) {
      // eslint-disable-next-line no-alert
      window.alert('Failed to delete address');
    }
  };

  const handleMakeDefault = async (addressId) => {
    try {
      await userService.updateAddress(addressId, { is_default: true });
      await refreshAddresses();
    } catch (error) {
      // eslint-disable-next-line no-alert
      window.alert('Failed to set default address');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteStatus(null);
    try {
      if (deleteConfirm.trim().toUpperCase() !== 'DELETE') {
        setDeleteStatus('Type DELETE to confirm.');
        return;
      }
      if (!deleteOtps.email.sent || !deleteOtps.phone.sent) {
        setDeleteStatus('Please request OTPs first.');
        return;
      }
      setDeleteLoading(true);
      await userService.verifyOtp({ type: 'email', purpose: 'delete_account', code: deleteOtps.email.code });
      await userService.verifyOtp({ type: 'phone', purpose: 'delete_account', code: deleteOtps.phone.code });
      if (onAuthUserUpdate) onAuthUserUpdate(null);
      setShowDeleteModal(false);
      navigate('/');
    } catch (error) {
      setDeleteStatus(error?.response?.data?.error || 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const requestDeleteOtp = async () => {
    setDeleteOtps({
      email: { sent: false, code: '', status: null, devOtp: null, verified: false },
      phone: { sent: false, code: '', status: null, devOtp: null, verified: false },
      loading: true,
    });
    try {
      const [emailResp, phoneResp] = await Promise.all([
        userService.requestOtp({ type: 'email', purpose: 'delete_account' }),
        userService.requestOtp({ type: 'phone', purpose: 'delete_account' }),
      ]);
      setDeleteOtps({
        email: { sent: true, code: '', status: 'OTP sent to registered email.', devOtp: emailResp?.data?.dev_otp || null },
        phone: { sent: true, code: '', status: 'OTP sent to registered phone.', devOtp: phoneResp?.data?.dev_otp || null },
        loading: false,
      });
      pushToast(
        process.env.NODE_ENV === 'production'
          ? 'OTPs sent to your registered email and phone.'
          : 'OTP sent. Email arrives in inbox; SMS OTP is logged in the backend console unless SMS is configured.',
        'info'
      );
    } catch (error) {
      setDeleteOtps((prev) => ({ ...prev, loading: false, email: { ...prev.email, status: 'Failed to send OTPs.' } }));
      pushToast('Failed to send OTPs. Please try again.', 'error');
    }
  };

  return (
    <div className="user-module">
      <header className="user-module-header">
        <h1>Profile</h1>
        <p>Manage your settings, saved addresses, and preferences.</p>
      </header>

      <div className="module-card">
        <h3>{authUser?.first_name} {authUser?.last_name}</h3>
        <div className="module-meta">{authUser?.email}</div>
        <div className="module-meta">Role: {authUser?.role}</div>
      </div>

      <div className="module-tabs" role="tablist" aria-label="Profile panels">
        <button
          type="button"
          className={`module-tab ${activePanel === 'settings' ? 'active' : ''}`}
          onClick={() => setActivePanel('settings')}
        >
          Settings
        </button>
        <button
          type="button"
          className={`module-tab ${activePanel === 'preferences' ? 'active' : ''}`}
          onClick={() => setActivePanel('preferences')}
        >
          Preferences
        </button>
      </div>

      {activePanel === 'settings' && (
        <>
          <div
            className="module-accordion-header"
            role="button"
            tabIndex={0}
            onClick={() => setOpenSection(openSection === 'account' ? null : 'account')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setOpenSection(openSection === 'account' ? null : 'account');
              }
            }}
            aria-expanded={openSection === 'account'}
          >
            <div>
              <div className="module-accordion-title">Account Settings</div>
              <div className="module-meta">Click to expand. Update username, email, and mobile number.</div>
              
            </div>
            <span className={`module-accordion-chevron ${openSection === 'account' ? 'open' : ''}`} aria-hidden="true">▾</span>
          </div>
          <div className={`module-accordion-panel ${openSection === 'account' ? 'open' : ''}`} aria-hidden={openSection !== 'account'}>
            <div className="module-accordion-panel-inner">
              <div className="module-card">
              <form className="module-form" onSubmit={handleSaveProfile}>
                <label>
                  Username
                  <input
                    type="text"
                    value={profileForm.username}
                    placeholder="e.g. milkman_user"
                    onChange={(event) => setProfileForm({ ...profileForm, username: event.target.value })}
                    disabled={profileLoading}
                    pattern="[A-Za-z0-9_]{3,50}"
                    title="3-50 characters: letters, numbers, underscore"
                    autoComplete="username"
                  />
                </label>
                <div className="module-actions">
                  <button type="submit" disabled={profileLoading}>Save Username</button>
                  <button type="button" className="ghost" onClick={loadProfileAndAddresses} disabled={profileLoading}>Refresh</button>
                  {profileStatus && <span className="module-inline-status">{profileStatus}</span>}
                </div>
              </form>

              <div className="module-divider" />

              <div className="module-grid">
                <div className="module-form">
                  <label>
                    Email
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                      disabled={profileLoading}
                      required
                      autoComplete="email"
                    />
                  </label>
                  <div className="module-actions">
                    <button type="button" onClick={requestEmailChangeOtps} disabled={emailChangeOtp.loading}>
                      {emailChangeOtp.loading && emailChangeOtp.action === 'send'
                        ? (<><span className="mm-spinner" aria-hidden="true" />Sending...</>)
                        : 'Send OTPs'}
                    </button>
                    {emailChangeOtp.email.status && <span className="module-inline-status">{emailChangeOtp.email.status}</span>}
                  </div>
                  {(emailChangeOtp.email.sent || emailChangeOtp.phone.sent) && emailChangeOtp.pending === (profileForm.email || '').trim() && (
                    <>
                      <div className="mm-stepper" aria-label="Email change verification progress">
                        <div className={`mm-step ${(emailChangeOtp.email.sent && emailChangeOtp.phone.sent) ? 'done' : ''}`}><span className="mm-dot" />OTPs sent</div>
                        <div className={`mm-step ${emailChangeOtp.email.verified ? 'done' : ''}`}><span className="mm-dot" />Email verified</div>
                        <div className={`mm-step ${emailChangeOtp.phone.verified ? 'done' : ''}`}><span className="mm-dot" />Phone verified</div>
                        <div className={`mm-step ${emailChangeOtp.completed ? 'done' : ''}`}><span className="mm-dot" />Updated</div>
                      </div>
                      <div className="module-grid" style={{ marginTop: 10 }}>
                        <div className="module-form">
                          <div className="module-meta">Email OTP (registered email)</div>
                          {showDevOtp && emailChangeOtp.email.devOtp && <div className="module-meta">Dev OTP: {emailChangeOtp.email.devOtp}</div>}
                          {emailChangeOtp.email.status && <div className="module-meta">{emailChangeOtp.email.status}</div>}
                          <label>
                            Email OTP
                            <input
                              type="text"
                              inputMode="numeric"
                              value={emailChangeOtp.email.code}
                              onChange={(event) => setEmailChangeOtp((prev) => ({ ...prev, email: { ...prev.email, code: event.target.value } }))}
                              placeholder="6-digit OTP"
                              pattern="\\d{6}"
                            />
                          </label>
                          <div className="module-actions">
                            <button
                              type="button"
                              onClick={() => verifyEmailChangeOtp('email')}
                              disabled={emailChangeOtp.loading || emailChangeOtp.email.verified || !/^\\d{6}$/.test(emailChangeOtp.email.code || '')}
                            >
                              {emailChangeOtp.loading && emailChangeOtp.action === 'verify'
                                ? (<><span className="mm-spinner" aria-hidden="true" />Verifying...</>)
                                : (emailChangeOtp.email.verified ? 'Email Verified' : 'Verify Email OTP')}
                            </button>
                          </div>
                        </div>

                        <div className="module-form">
                          <div className="module-meta">Phone OTP (registered phone)</div>
                          {showDevOtp && emailChangeOtp.phone.devOtp && <div className="module-meta">Dev OTP: {emailChangeOtp.phone.devOtp}</div>}
                          {emailChangeOtp.phone.status && <div className="module-meta">{emailChangeOtp.phone.status}</div>}
                          <label>
                            Phone OTP
                            <input
                              type="text"
                              inputMode="numeric"
                              value={emailChangeOtp.phone.code}
                              onChange={(event) => setEmailChangeOtp((prev) => ({ ...prev, phone: { ...prev.phone, code: event.target.value } }))}
                              placeholder="6-digit OTP"
                              pattern="\\d{6}"
                            />
                          </label>
                          <div className="module-actions">
                            <button
                              type="button"
                              onClick={() => verifyEmailChangeOtp('phone')}
                              disabled={emailChangeOtp.loading || emailChangeOtp.phone.verified || !/^\\d{6}$/.test(emailChangeOtp.phone.code || '')}
                            >
                              {emailChangeOtp.loading && emailChangeOtp.action === 'verify'
                                ? (<><span className="mm-spinner" aria-hidden="true" />Verifying...</>)
                                : (emailChangeOtp.phone.verified ? 'Phone Verified' : 'Verify Phone OTP')}
                            </button>
                            <button
                              type="button"
                              className="ghost"
                              onClick={() => setEmailChangeOtp(makeChangeOtpState())}
                              disabled={emailChangeOtp.loading}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="module-form">
                <label>
                  Mobile Number (India)
                  <input
                    type="tel"
                    value={profileForm.phone}
                    placeholder="10-digit mobile number"
                    onChange={(event) => setProfileForm({ ...profileForm, phone: normalizeIndianPhoneOnClient(event.target.value) })}
                    disabled={profileLoading}
                    required
                    pattern="[6-9][0-9]{9}"
                    title="Enter 10-digit Indian mobile number (starts with 6-9)"
                    autoComplete="tel"
                    inputMode="numeric"
                  />
                </label>
                  <div className="module-actions">
                    <button type="button" onClick={requestPhoneChangeOtps} disabled={phoneChangeOtp.loading}>
                      {phoneChangeOtp.loading && phoneChangeOtp.action === 'send'
                        ? (<><span className="mm-spinner" aria-hidden="true" />Sending...</>)
                        : 'Send OTPs'}
                    </button>
                    {phoneChangeOtp.phone.status && <span className="module-inline-status">{phoneChangeOtp.phone.status}</span>}
                  </div>
                  {(phoneChangeOtp.email.sent || phoneChangeOtp.phone.sent) && phoneChangeOtp.pending === normalizeIndianPhoneOnClient(profileForm.phone) && (
                    <>
                      <div className="mm-stepper" aria-label="Phone change verification progress">
                        <div className={`mm-step ${(phoneChangeOtp.email.sent && phoneChangeOtp.phone.sent) ? 'done' : ''}`}><span className="mm-dot" />OTPs sent</div>
                        <div className={`mm-step ${phoneChangeOtp.email.verified ? 'done' : ''}`}><span className="mm-dot" />Email verified</div>
                        <div className={`mm-step ${phoneChangeOtp.phone.verified ? 'done' : ''}`}><span className="mm-dot" />Phone verified</div>
                        <div className={`mm-step ${phoneChangeOtp.completed ? 'done' : ''}`}><span className="mm-dot" />Updated</div>
                      </div>
                      <div className="module-grid" style={{ marginTop: 10 }}>
                        <div className="module-form">
                          <div className="module-meta">Email OTP (registered email)</div>
                          {showDevOtp && phoneChangeOtp.email.devOtp && <div className="module-meta">Dev OTP: {phoneChangeOtp.email.devOtp}</div>}
                          {phoneChangeOtp.email.status && <div className="module-meta">{phoneChangeOtp.email.status}</div>}
                          <label>
                            Email OTP
                            <input
                              type="text"
                              inputMode="numeric"
                              value={phoneChangeOtp.email.code}
                              onChange={(event) => setPhoneChangeOtp((prev) => ({ ...prev, email: { ...prev.email, code: event.target.value } }))}
                              placeholder="6-digit OTP"
                              pattern="\\d{6}"
                            />
                          </label>
                          <div className="module-actions">
                            <button
                              type="button"
                              onClick={() => verifyPhoneChangeOtp('email')}
                              disabled={phoneChangeOtp.loading || phoneChangeOtp.email.verified || !/^\\d{6}$/.test(phoneChangeOtp.email.code || '')}
                            >
                              {phoneChangeOtp.loading && phoneChangeOtp.action === 'verify'
                                ? (<><span className="mm-spinner" aria-hidden="true" />Verifying...</>)
                                : (phoneChangeOtp.email.verified ? 'Email Verified' : 'Verify Email OTP')}
                            </button>
                          </div>
                        </div>

                        <div className="module-form">
                          <div className="module-meta">Phone OTP (registered phone)</div>
                          {showDevOtp && phoneChangeOtp.phone.devOtp && <div className="module-meta">Dev OTP: {phoneChangeOtp.phone.devOtp}</div>}
                          {phoneChangeOtp.phone.status && <div className="module-meta">{phoneChangeOtp.phone.status}</div>}
                          <label>
                            Phone OTP
                            <input
                              type="text"
                              inputMode="numeric"
                              value={phoneChangeOtp.phone.code}
                              onChange={(event) => setPhoneChangeOtp((prev) => ({ ...prev, phone: { ...prev.phone, code: event.target.value } }))}
                              placeholder="6-digit OTP"
                              pattern="\\d{6}"
                            />
                          </label>
                          <div className="module-actions">
                            <button
                              type="button"
                              onClick={() => verifyPhoneChangeOtp('phone')}
                              disabled={phoneChangeOtp.loading || phoneChangeOtp.phone.verified || !/^\\d{6}$/.test(phoneChangeOtp.phone.code || '')}
                            >
                              {phoneChangeOtp.loading && phoneChangeOtp.action === 'verify'
                                ? (<><span className="mm-spinner" aria-hidden="true" />Verifying...</>)
                                : (phoneChangeOtp.phone.verified ? 'Phone Verified' : 'Verify Phone OTP')}
                            </button>
                            <button
                              type="button"
                              className="ghost"
                              onClick={() => setPhoneChangeOtp(makeChangeOtpState())}
                              disabled={phoneChangeOtp.loading}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>

          <div
            className="module-accordion-header"
            role="button"
            tabIndex={0}
            onClick={() => setOpenSection(openSection === 'addresses' ? null : 'addresses')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setOpenSection(openSection === 'addresses' ? null : 'addresses');
              }
            }}
            aria-expanded={openSection === 'addresses'}
          >
            <div>
              <div className="module-accordion-title">Addresses</div>
              <div className="module-meta">Click to expand. Add, edit, delete and set default.</div>
            </div>
            <span className={`module-accordion-chevron ${openSection === 'addresses' ? 'open' : ''}`} aria-hidden="true">▾</span>
          </div>
          <div className={`module-accordion-panel ${openSection === 'addresses' ? 'open' : ''}`} aria-hidden={openSection !== 'addresses'}>
            <div className="module-accordion-panel-inner">
              <div className="module-grid">
              <div className="module-card">
                <h3>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                <form className="module-form" onSubmit={handleSaveAddress}>
                  <label>
                    Label
                    <input
                      type="text"
                      value={addressForm.label}
                      placeholder="Home / Work"
                      onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })}
                      autoComplete="address-level3"
                    />
                  </label>
                  <label>
                    Address Line 1 *
                    <input
                      type="text"
                      value={addressForm.line1}
                      onChange={(event) => setAddressForm({ ...addressForm, line1: event.target.value })}
                      required
                      autoComplete="address-line1"
                    />
                  </label>
                  <label>
                    Address Line 2
                    <input
                      type="text"
                      value={addressForm.line2}
                      onChange={(event) => setAddressForm({ ...addressForm, line2: event.target.value })}
                      autoComplete="address-line2"
                    />
                  </label>
                  <label>
                    City
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })}
                      autoComplete="address-level2"
                    />
                  </label>
                  <label>
                    State
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(event) => setAddressForm({ ...addressForm, state: event.target.value })}
                      autoComplete="address-level1"
                    />
                  </label>
                  <label>
                    Postal Code
                    <input
                      type="text"
                      value={addressForm.postal_code}
                      onChange={(event) => setAddressForm({ ...addressForm, postal_code: event.target.value })}
                      autoComplete="postal-code"
                    />
                  </label>
                  <label>
                    Country
                    <input
                      type="text"
                      value={addressForm.country}
                      onChange={(event) => setAddressForm({ ...addressForm, country: event.target.value })}
                      autoComplete="country-name"
                    />
                  </label>
                  <label className="module-checkbox">
                    <input
                      type="checkbox"
                      checked={addressForm.is_default}
                      onChange={(event) => setAddressForm({ ...addressForm, is_default: event.target.checked })}
                    />
                    Set as default
                  </label>
                  <div className="module-actions">
                    <button type="submit">{editingAddressId ? 'Update' : 'Add'}</button>
                    {editingAddressId && (
                      <button type="button" className="ghost" onClick={resetAddressForm}>Cancel</button>
                    )}
                    {addressStatus && <span className="module-inline-status">{addressStatus}</span>}
                  </div>
                </form>
              </div>

              <div className="module-card">
                <h3>Saved Addresses {addressesLoading ? <span className="module-badge">Loading</span> : null}</h3>
                <div className="module-list">
                  {!addressesLoading && addresses.length === 0 && (
                    <div className="module-meta">No saved addresses yet.</div>
                  )}
                  {addresses.map((address) => (
                    <div key={address.address_id} className="module-item">
                      <div>
                        <div className="module-item-title">
                          {address.label || 'Address'} {address.is_default ? <span className="module-badge">Default</span> : null}
                        </div>
                        <div className="module-meta">
                          {address.line1}{address.line2 ? `, ${address.line2}` : ''}
                        </div>
                        <div className="module-meta">
                          {[address.city, address.state, address.postal_code, address.country].filter(Boolean).join(', ')}
                        </div>
                      </div>
                      <div className="module-actions">
                        {!address.is_default && (
                          <button type="button" className="ghost" onClick={() => handleMakeDefault(address.address_id)}>Default</button>
                        )}
                        <button type="button" className="ghost" onClick={() => startEditAddress(address)}>Edit</button>
                        <button type="button" className="danger" onClick={() => handleDeleteAddress(address.address_id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            </div>
          </div>

          <div className="module-card danger-zone">
            <h3>Delete Account</h3>
            <div className="module-meta">This action is permanent and will remove your account data.</div>
            <div className="module-actions">
              <button type="button" className="danger" onClick={() => setShowDeleteModal(true)}>Delete Account</button>
            </div>
          </div>
        </>
      )}

      {activePanel === 'preferences' && (
        <form className="module-form" onSubmit={(event) => {
          event.preventDefault();
          savePreferences();
        }}>
          <label>
            Language
            <select value={prefs.language} onChange={(event) => setPrefs({ ...prefs, language: event.target.value })}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </label>
          <label className="module-checkbox">
            <input type="checkbox" checked={prefs.email_updates} onChange={(event) => setPrefs({ ...prefs, email_updates: event.target.checked })} />
            Email Updates
          </label>
          <label className="module-checkbox">
            <input type="checkbox" checked={prefs.sms_alerts} onChange={(event) => setPrefs({ ...prefs, sms_alerts: event.target.checked })} />
            SMS Alerts
          </label>
          <div className="module-actions">
            <button type="submit">Save Preferences</button>
            {prefsStatus && <span className="module-inline-status">{prefsStatus}</span>}
          </div>
        </form>
      )}

      <Modal
        isOpen={showDeleteModal}
        title="Delete account"
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirm('');
          setDeleteStatus(null);
          setDeleteOtps({
            email: { sent: false, code: '', status: null, devOtp: null, verified: false },
            phone: { sent: false, code: '', status: null, devOtp: null, verified: false },
            loading: false,
          });
        }}
      >
        <div className="module-meta">
          Type <strong>DELETE</strong> and verify OTP to confirm.
        </div>
        <div style={{ marginTop: 10 }}>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(event) => setDeleteConfirm(event.target.value)}
            placeholder="DELETE"
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
          />
        </div>
        <div className="module-divider" style={{ marginTop: 14 }} />
        <div className="module-form" style={{ padding: 0, border: 'none' }}>
          <div className="module-actions">
            <button type="button" onClick={requestDeleteOtp} disabled={deleteOtps.loading}>
              {deleteOtps.loading ? (<><span className="mm-spinner" aria-hidden="true" />Sending...</>) : 'Send OTPs'}
            </button>
            {deleteOtps.email.status && <span className="module-inline-status">{deleteOtps.email.status}</span>}
          </div>

          {(deleteOtps.email.sent || deleteOtps.phone.sent) && (
            <div className="module-grid" style={{ marginTop: 10 }}>
              <div className="module-form">
                <div className="module-meta">Email OTP (registered email)</div>
                {showDevOtp && deleteOtps.email.devOtp && <div className="module-meta">Dev OTP: {deleteOtps.email.devOtp}</div>}
                {deleteOtps.email.status && <div className="module-meta">{deleteOtps.email.status}</div>}
                <label>
                  Email OTP
                  <input
                    type="text"
                    inputMode="numeric"
                    value={deleteOtps.email.code}
                    onChange={(event) => setDeleteOtps((prev) => ({ ...prev, email: { ...prev.email, code: event.target.value } }))}
                    placeholder="6-digit OTP"
                    pattern="\\d{6}"
                  />
                </label>
              </div>

              <div className="module-form">
                <div className="module-meta">Phone OTP (registered phone)</div>
                {showDevOtp && deleteOtps.phone.devOtp && <div className="module-meta">Dev OTP: {deleteOtps.phone.devOtp}</div>}
                {deleteOtps.phone.status && <div className="module-meta">{deleteOtps.phone.status}</div>}
                <label>
                  Phone OTP
                  <input
                    type="text"
                    inputMode="numeric"
                    value={deleteOtps.phone.code}
                    onChange={(event) => setDeleteOtps((prev) => ({ ...prev, phone: { ...prev.phone, code: event.target.value } }))}
                    placeholder="6-digit OTP"
                    pattern="\\d{6}"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
        {deleteStatus && <div className="module-inline-status" style={{ marginTop: 10 }}>{deleteStatus}</div>}
        <div className="module-actions" style={{ marginTop: 12 }}>
          <button type="button" className="danger" onClick={handleDeleteAccount} disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete Account'}
          </button>
          <button type="button" className="ghost" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>Cancel</button>
        </div>
      </Modal>

      {toast?.message && (
        <div className={`mm-toast ${toast.variant || 'info'}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default UserProfilePage;
