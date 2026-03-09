import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import '../styles/UserModules.css';

const DELIVERY_STEPS = ['scheduled', 'packed', 'out_for_delivery', 'delivered'];
const TERMINAL_DELIVERY_STEPS = ['missed', 'skipped'];

const formatStatus = (value) => (
  (value || 'scheduled')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
);

function StatusTimeline({ status }) {
  const currentIndex = DELIVERY_STEPS.indexOf(status);
  const terminal = TERMINAL_DELIVERY_STEPS.includes(status) ? status : '';

  return (
    <div className="mm-stepper">
      {DELIVERY_STEPS.map((step, index) => (
        <div key={step} className={`mm-step ${index <= currentIndex ? 'done' : ''}`}>
          <span className="mm-dot" />
          <span>{formatStatus(step)}</span>
        </div>
      ))}
      {terminal ? (
        <div className="mm-step done">
          <span className="mm-dot mm-dot-terminal" />
          <span>{formatStatus(terminal)}</span>
        </div>
      ) : null}
    </div>
  );
}

function UserDeliveryPage({ authUser }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const [ordersRes, deliveriesRes] = await Promise.allSettled([
          userService.getOrders(authUser?.id),
          userService.getSubscriptionDeliveries(authUser?.id, 14),
        ]);

        if (ordersRes.status === 'fulfilled') {
          setOrders(Array.isArray(ordersRes.value.data) ? ordersRes.value.data : []);
        } else {
          setOrders([]);
          setError(ordersRes.reason?.response?.data?.error || 'Could not load order deliveries.');
        }

        if (deliveriesRes.status === 'fulfilled') {
          setDeliveries(Array.isArray(deliveriesRes.value.data?.deliveries) ? deliveriesRes.value.data.deliveries : []);
        } else {
          setDeliveries([]);
          setError(deliveriesRes.reason?.response?.data?.error || 'Could not load subscription deliveries.');
        }
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [authUser?.id]);

  const nextDelivery = useMemo(() => {
    if (!deliveries.length) return null;
    return [...deliveries].sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for))[0];
  }, [deliveries]);

  const activeOrders = useMemo(() => (
    orders.filter((order) => ['placed', 'confirmed', 'packed', 'out_for_delivery'].includes(order.status)).slice(0, 6)
  ), [orders]);

  return (
    <div className="user-module">
      <header className="user-module-header">
        <h1>Delivery Schedule</h1>
        <p>Track route-ready deliveries, saved addresses, and the live status of recurring drops.</p>
      </header>

      <div className="module-actions" style={{ gap: 10 }}>
        <button type="button" className="ghost" onClick={() => navigate('/user/dashboard')}>Back to Dashboard</button>
        <button type="button" className="ghost" onClick={() => navigate('/user/profile')}>Manage Addresses</button>
        <button type="button" className="ghost" onClick={() => navigate('/user/orders', { state: { from: '/user/delivery' } })}>View Orders</button>
      </div>

      {error ? <div className="module-card danger-zone">{error}</div> : null}

      {loading ? (
        <div className="module-card">Loading delivery schedule...</div>
      ) : (
        <div className="module-grid">
          <article className="module-card">
            <h3>Next Subscription Delivery</h3>
            {!nextDelivery ? (
              <div className="module-meta">No subscription deliveries scheduled for the next 14 days.</div>
            ) : (
              <>
                <div className="module-item" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div className="module-item-title">
                      {new Date(nextDelivery.scheduled_for).toLocaleDateString()}
                      <span className="module-badge" style={{ marginLeft: 8 }}>
                        {formatStatus(nextDelivery.status)}
                      </span>
                    </div>
                    <div className="module-meta">
                      {(nextDelivery.delivery_address_label || 'Delivery address')} • {formatStatus(nextDelivery.delivery_slot)}
                    </div>
                    {nextDelivery.delivery_address_line1 ? (
                      <div className="module-meta">{nextDelivery.delivery_address_line1}</div>
                    ) : null}
                    <div className="module-meta">
                      {(nextDelivery.items || []).length === 0
                        ? 'No items'
                        : nextDelivery.items.map((item) => `${item.product_name || item.name} x${item.quantity}`).join(', ')
                      }
                    </div>
                  </div>
                </div>
                <StatusTimeline status={nextDelivery.status} />
              </>
            )}
          </article>

          <article className="module-card">
            <h3>Open One-Time Orders</h3>
            {activeOrders.length === 0 ? (
              <div className="module-meta">No active one-time orders right now.</div>
            ) : (
              <div className="module-list">
                {activeOrders.map((order) => (
                  <div key={order.order_id} className="module-item">
                    <div>
                      <strong>Order #{order.order_id}</strong>
                      <div className="module-meta">
                        {(order.delivery_address_label || 'Delivery address')} • {formatStatus(order.delivery_slot)}
                      </div>
                      <div className="module-meta">
                        {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Date pending'}
                      </div>
                    </div>
                    <div>
                      <span className="module-badge">{formatStatus(order.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="module-card">
            <h3>Subscription Deliveries</h3>
            {deliveries.length === 0 ? (
              <div className="module-meta">No subscription deliveries scheduled.</div>
            ) : (
              <div className="module-list">
                {deliveries.map((delivery) => (
                  <div key={delivery.delivery_id || delivery.scheduled_for} className="module-item">
                    <div>
                      <strong>{new Date(delivery.scheduled_for).toLocaleDateString()}</strong>
                      <div className="module-meta">
                        {(delivery.delivery_address_label || 'Delivery address')} • {formatStatus(delivery.delivery_slot)}
                      </div>
                      <div className="module-meta">
                        {(delivery.items || []).length === 0
                          ? 'No items'
                          : delivery.items.map((item) => `${item.product_name || item.name} x${item.quantity}`).join(', ')
                        }
                      </div>
                    </div>
                    <div>
                      <span className="module-badge">{formatStatus(delivery.status)}</span>
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
