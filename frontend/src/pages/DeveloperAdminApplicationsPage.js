import React, { useEffect, useMemo, useState } from 'react';
import { developerService } from '../services/api';
import '../styles/ManagementPage.css';
import '../styles/DeveloperConsole.css';

function DeveloperAdminApplicationsPage({ authUser }) {
  const isLocal = useMemo(() => {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
  }, []);

  const allowed = authUser?.role === 'admin' && authUser?.admin_role === 'super_admin' && isLocal;

  const [statusFilter, setStatusFilter] = useState('pending');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noteById, setNoteById] = useState({});
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const fetchApps = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await developerService.listAdminApplications(statusFilter);
      setApplications(response.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) return;
    fetchApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, statusFilter]);

  const approve = async (applicationId) => {
    const note = noteById[applicationId] || '';
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Approve application #${applicationId}? Credentials will be emailed to applicant.`);
    if (!ok) return;
    try {
      await developerService.approveAdminApplication(applicationId, note);
      await fetchApps();
      setToast(`Approved application #${applicationId}. Credentials emailed.`);
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert(err?.response?.data?.error || 'Approve failed');
    }
  };

  const reject = async (applicationId) => {
    const note = noteById[applicationId] || '';
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Reject application #${applicationId}? Rejection email will be sent.`);
    if (!ok) return;
    try {
      await developerService.rejectAdminApplication(applicationId, note);
      await fetchApps();
      setToast(`Rejected application #${applicationId}. Applicant notified.`);
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert(err?.response?.data?.error || 'Reject failed');
    }
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timerId = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timerId);
  }, [toast]);

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((app) => {
      const haystack = [
        app.application_id,
        app.first_name,
        app.last_name,
        app.email,
        app.phone,
        app.shop_name,
        app.shop_address,
        app.gst_number,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [applications, search]);

  if (!allowed) {
    return (
      <div className="page">
        <h2>Developer Console</h2>
        <p>This page is only available on the developer machine (localhost) for a super admin account.</p>
      </div>
    );
  }

  return (
    <div className="page dev-console">
      <div className="dev-console-hero">
        <div>
          <h2 className="dev-console-title">Developer Console</h2>
          <div className="dev-console-subtitle">Review and approve shopkeeper admin applications.</div>
        </div>
        <div className="dev-console-actions">
          <div className="dev-console-tabs" role="tablist" aria-label="Application status filter">
            {['pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                type="button"
                className={`dev-console-tab ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
          <button type="button" className="dev-console-refresh" onClick={fetchApps} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="dev-console-toolbar">
        <input
          className="dev-console-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, shop, GST, ID..."
        />
        <div className="dev-console-count">
          Showing <strong>{filteredApplications.length}</strong> / {applications.length}
        </div>
      </div>

      {error && <div style={{ marginTop: 12, color: '#b91c1c', fontWeight: 700 }}>{error}</div>}

      {toast && (
        <div className="dev-console-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}

      <div className="dev-console-list">
        {filteredApplications.length === 0 && !loading && (
          <div className="dev-console-empty">No applications found.</div>
        )}

        {filteredApplications.map((app) => (
          <div key={app.application_id} className="dev-console-card">
            <div className="dev-console-card-main">
              <div className="dev-console-card-title">
                <span className="dev-console-pill">#{app.application_id}</span>
                <span>{app.first_name} {app.last_name}</span>
                <span className={`dev-console-status ${app.status}`}>{app.status}</span>
              </div>
              <div className="dev-console-card-meta">{app.email} • {app.phone}</div>
              <div className="dev-console-card-section">
                <div className="dev-console-card-shop">{app.shop_name}</div>
                {app.shop_address && <div className="dev-console-card-meta">{app.shop_address}</div>}
                {app.gst_number && <div className="dev-console-card-meta">GST: {app.gst_number}</div>}
                {app.notes && <div className="dev-console-card-meta">Notes: {app.notes}</div>}
              </div>
            </div>

            <div className="dev-console-card-side">
              <label className="dev-console-note">
                Decision note (optional)
                <input
                  type="text"
                  value={noteById[app.application_id] || ''}
                  onChange={(e) => setNoteById({ ...noteById, [app.application_id]: e.target.value })}
                  placeholder="Reason / internal note"
                />
              </label>

              {app.status === 'pending' ? (
                <div className="dev-console-card-buttons">
                  <button type="button" className="dev-console-btn approve" onClick={() => approve(app.application_id)}>
                    Approve
                  </button>
                  <button type="button" className="dev-console-btn reject" onClick={() => reject(app.application_id)}>
                    Reject
                  </button>
                </div>
              ) : (
                <div className="dev-console-result">
                  {app.decision_note ? <div>Note: {app.decision_note}</div> : <div>No note.</div>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DeveloperAdminApplicationsPage;
