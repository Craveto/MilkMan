import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import '../styles/UserModules.css';

function UserDeliveryPage({ authUser }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(() => window.localStorage.getItem('mm_delivery_paused') === '1');
  const [prefs, setPrefs] = useState(() => {
    const raw = window.localStorage.getItem('mm_delivery_prefs');
    return raw ? JSON.parse(raw) : { slot: 'morning', contactless: true };
  });
  const [prefsStatus, setPrefsStatus] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const [ordersRes, deliveriesRes] = await Promise.all([
          userService.getOrders(authUser?.id),
          userService.getSubscriptionDeliveries(authUser?.id, 7),
        ]);
        setOrders(ordersRes.data || []);
        setDeliveries(deliveriesRes.data?.deliveries || []);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [authUser?.id]);

  useEffect(() => {
    window.localStorage.setItem('mm_delivery_paused', paused ? '1' : '0');
  }, [paused]);

  const savePrefs = () => {
    window.localStorage.setItem('mm_delivery_prefs', JSON.stringify(prefs));
    setPrefsStatus('Saved');
    window.setTimeout(() => setPrefsStatus(null), 1500);
  };

  const paidOrders = useMemo(() => (
    (orders || []).filter((order) => order.status === 'paid').slice(0, 5)
  ), [orders]);

  const nextDelivery = useMemo(() => {
    if (!deliveries || deliveries.length === 0) return null;
    const sorted = [...deliveries].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted[0] || null;
  }, [deliveries]);

  return (
    <div className="user-module">
      <header className="user-module-header">
        <h1>Delivery Schedule</h1>
        <p>Track upcoming deliveries and control your delivery flow.</p>
      </header>

      <div className="module-actions" style={{ gap: 10 }}>
        <button type="button" className="ghost" onClick={() => navigate('/user/dashboard')}>Back to Dashboard</button>
        <button type="button" onClick={() => setPaused((previous) => !previous)} className={paused ? 'danger' : ''}>
          {paused ? 'Resume Deliveries' : 'Pause Deliveries'}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            window.localStorage.setItem('mm_user_active_panel', 'subscription');
            navigate('/user/dashboard', { state: { from: '/user/delivery' } });
          }}
        >
          Manage Plan Basket
        </button>
        <button type="button" className="ghost" onClick={() => navigate('/user/orders', { state: { from: '/user/delivery' } })}>View Orders</button>
      </div>

      {loading ? (
        <div className="module-card">Loading delivery schedule...</div>
      ) : (
        <div className="module-grid">
          <article className={`module-card ${paused ? 'danger-zone' : ''}`}>
            <h3>Delivery Preferences</h3>
            <div className="module-meta">These preferences apply to your device for now.</div>
            <form
              className="module-form"
              style={{ border: 'none', padding: 0 }}
              onSubmit={(event) => {
                event.preventDefault();
                savePrefs();
              }}
            >
              <label>
                Preferred time slot
                <select value={prefs.slot} onChange={(event) => setPrefs({ ...prefs, slot: event.target.value })}>
                  <option value="morning">Morning (6am–9am)</option>
                  <option value="evening">Evening (5pm–8pm)</option>
                </select>
              </label>
              <label className="module-checkbox">
                <input
                  type="checkbox"
                  checked={prefs.contactless}
                  onChange={(event) => setPrefs({ ...prefs, contactless: event.target.checked })}
                />
                Contactless delivery
              </label>
              <div className="module-actions">
                <button type="submit">Save</button>
                {prefsStatus && <span className="module-inline-status">{prefsStatus}</span>}
              </div>
            </form>
          </article>

          <article className="module-card">
            <h3>Next Subscription Delivery</h3>
            {!nextDelivery ? (
              <div className="module-meta">No subscription deliveries scheduled for the next 7 days.</div>
            ) : (
              <div className="module-item" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className="module-item-title">
                    {new Date(nextDelivery.date).toLocaleDateString()}
                    <span className="module-badge" style={{ marginLeft: 8 }}>
                      {paused ? 'Paused' : 'Scheduled'}
                    </span>
                  </div>
                  <div className="module-meta">
                    {(nextDelivery.items || []).length === 0
                      ? 'No items'
                      : nextDelivery.items.map((i) => `${i.name} x${i.quantity}`).join(', ')
                    }
                  </div>
                  <div className="module-meta">Slot: {prefs.slot === 'morning' ? 'Morning' : 'Evening'} · {prefs.contactless ? 'Contactless' : 'Standard'}</div>
                </div>
              </div>
            )}
          </article>

          <article className="module-card">
            <h3>Subscription Deliveries (Next 7 Days)</h3>
            {deliveries.length === 0 ? (
              <div className="module-meta">No subscription deliveries scheduled.</div>
            ) : (
              <div className="module-list">
                {deliveries.map((delivery) => (
                  <div key={delivery.date} className="module-item">
                    <div>
                      <strong>{new Date(delivery.date).toLocaleDateString()}</strong>
                      <div className="module-meta">
                        {(delivery.items || []).length === 0
                          ? 'No items'
                          : delivery.items.map((i) => `${i.name} x${i.quantity}`).join(', ')
                        }
                      </div>
                    </div>
                    <div>
                      <span className="module-badge">{paused ? 'Paused' : 'Scheduled'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="module-card">
            <h3>Recent Paid Orders</h3>
            {paidOrders.length === 0 ? (
              <div className="module-meta">No paid one-time orders yet.</div>
            ) : (
              <div className="module-list">
                {paidOrders.map((order) => (
                  <div key={order.order_id} className="module-item">
                    <div>
                      <strong>Order #{order.order_id}</strong>
                      <div className="module-meta">{new Date(order.created_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="module-badge">{order.status}</span>
                      <div className="module-meta">INR {order.total_amount}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      )}
    </div>
  );
}

export default UserDeliveryPage;
