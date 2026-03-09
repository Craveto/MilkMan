import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminService } from '../services/api';
import '../styles/UserModules.css';

const formatStatus = (value) => (
  (value || 'scheduled')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
);

const getRouteLabel = (record) => {
  if (record.delivery_address_label) return record.delivery_address_label;
  if (record.delivery_address_line1) return record.delivery_address_line1;
  return 'Unassigned route';
};

function AdminDeliveriesPage() {
  const [tab, setTab] = useState('subscriptions');
  const [filters, setFilters] = useState({
    date: '',
    slot: '',
  });
  const [subscriptionDeliveries, setSubscriptionDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [deliveriesRes, ordersRes] = await Promise.all([
        adminService.getSubscriptionDeliveries({
          ...(filters.date ? { scheduled_for: filters.date } : {}),
          ...(filters.slot ? { delivery_slot: filters.slot } : {}),
        }),
        adminService.getOrderDeliveries({
          ...(filters.date ? { delivery_date: filters.date } : {}),
          ...(filters.slot ? { delivery_slot: filters.slot } : {}),
        }),
      ]);

      const deliveryResults = Array.isArray(deliveriesRes.data?.results) ? deliveriesRes.data.results : deliveriesRes.data || [];
      const orderResults = Array.isArray(ordersRes.data?.results) ? ordersRes.data.results : ordersRes.data || [];
      setSubscriptionDeliveries(Array.isArray(deliveryResults) ? deliveryResults : []);
      setOrders(Array.isArray(orderResults) ? orderResults : []);
    } catch (_error) {
      setError('Failed to load delivery operations.');
    } finally {
      setLoading(false);
    }
  }, [filters.date, filters.slot]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const routeGroups = useMemo(() => {
    const source = tab === 'subscriptions' ? subscriptionDeliveries : orders;
    return source.reduce((accumulator, record) => {
      const route = getRouteLabel(record);
      if (!accumulator[route]) accumulator[route] = [];
      accumulator[route].push(record);
      return accumulator;
    }, {});
  }, [orders, subscriptionDeliveries, tab]);

  const runAction = async (actionKey, callback) => {
    setActionLoading(actionKey);
    setError('');
    try {
      await callback();
      await loadData();
    } catch (_error) {
      setError('Could not update delivery status.');
    } finally {
      setActionLoading('');
    }
  };

  const renderSubscriptionActions = (record) => {
    const id = record.delivery_id;
    if (record.status === 'scheduled') {
      return (
        <button
          type="button"
          onClick={() => runAction(`sub-packed-${id}`, () => adminService.markSubscriptionDeliveryPacked(id))}
          disabled={actionLoading === `sub-packed-${id}`}
        >
          Mark Packed
        </button>
      );
    }
    if (record.status === 'packed') {
      return (
        <button
          type="button"
          onClick={() => runAction(`sub-ride-${id}`, () => adminService.markSubscriptionDeliveryOutForDelivery(id))}
          disabled={actionLoading === `sub-ride-${id}`}
        >
          Out for Delivery
        </button>
      );
    }
    if (record.status === 'out_for_delivery') {
      return (
        <>
          <button
            type="button"
            onClick={() => runAction(`sub-done-${id}`, () => adminService.markSubscriptionDeliveryDelivered(id))}
            disabled={actionLoading === `sub-done-${id}`}
          >
            Delivered
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => runAction(`sub-missed-${id}`, () => adminService.markSubscriptionDeliveryMissed(id))}
            disabled={actionLoading === `sub-missed-${id}`}
          >
            Missed
          </button>
        </>
      );
    }
    return null;
  };

  const renderOrderActions = (record) => {
    const id = record.order_id;
    if (record.status === 'placed') {
      return (
        <button
          type="button"
          onClick={() => runAction(`ord-confirmed-${id}`, () => adminService.markOrderConfirmed(id))}
          disabled={actionLoading === `ord-confirmed-${id}`}
        >
          Confirm
        </button>
      );
    }
    if (record.status === 'confirmed') {
      return (
        <button
          type="button"
          onClick={() => runAction(`ord-packed-${id}`, () => adminService.markOrderPacked(id))}
          disabled={actionLoading === `ord-packed-${id}`}
        >
          Mark Packed
        </button>
      );
    }
    if (record.status === 'packed') {
      return (
        <button
          type="button"
          onClick={() => runAction(`ord-ride-${id}`, () => adminService.markOrderOutForDelivery(id))}
          disabled={actionLoading === `ord-ride-${id}`}
        >
          Out for Delivery
        </button>
      );
    }
    if (record.status === 'out_for_delivery') {
      return (
        <button
          type="button"
          onClick={() => runAction(`ord-done-${id}`, () => adminService.markOrderDelivered(id))}
          disabled={actionLoading === `ord-done-${id}`}
        >
          Delivered
        </button>
      );
    }
    return null;
  };

  return (
    <div className="user-module">
      <header className="user-module-header">
        <h1>Deliveries</h1>
        <p>Filter by date and slot, then push route-wise one-time orders and subscription drops through real delivery stages.</p>
      </header>

      <div className="module-card">
        <div className="module-tabs" style={{ marginBottom: 12 }}>
          <button type="button" className={`module-tab ${tab === 'subscriptions' ? 'active' : ''}`} onClick={() => setTab('subscriptions')}>
            Subscription Drops
          </button>
          <button type="button" className={`module-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
            One-Time Orders
          </button>
        </div>

        <div className="module-form" style={{ border: 'none', padding: 0 }}>
          <div className="payment-row">
            <label>
              Delivery Date
              <input
                type="date"
                value={filters.date}
                onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))}
              />
            </label>
            <label>
              Delivery Slot
              <select
                value={filters.slot}
                onChange={(event) => setFilters((current) => ({ ...current, slot: event.target.value }))}
              >
                <option value="">All slots</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </select>
            </label>
          </div>
          <div className="module-actions">
            <button type="button" onClick={loadData}>Refresh</button>
            <button
              type="button"
              className="ghost"
              onClick={() => setFilters({ date: '', slot: '' })}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {error ? <div className="module-card danger-zone">{error}</div> : null}

      {loading ? (
        <div className="module-card">Loading delivery operations...</div>
      ) : (
        <div className="module-grid">
          {Object.keys(routeGroups).length === 0 ? (
            <div className="module-card">No records found for the current filters.</div>
          ) : (
            Object.entries(routeGroups).map(([route, records]) => (
              <article className="module-card" key={route}>
                <div className="module-card-header">
                  <div>
                    <h3>{route}</h3>
                    <div className="module-meta">{records.length} stops in this view</div>
                  </div>
                </div>
                <div className="module-list">
                  {records.map((record) => (
                    <div className="module-item" key={record.delivery_id || record.order_id}>
                      <div>
                        <strong>
                          {tab === 'subscriptions'
                            ? `Delivery #${record.delivery_id}`
                            : `Order #${record.order_id}`}
                        </strong>
                        <div className="module-meta">
                          {tab === 'subscriptions'
                            ? new Date(record.scheduled_for).toLocaleDateString()
                            : (record.delivery_date ? new Date(record.delivery_date).toLocaleDateString() : 'Date pending')}
                          {' • '}
                          {formatStatus(record.delivery_slot)}
                        </div>
                        <div className="module-meta">
                          {record.customer_name || record.customer_full_name || `Customer #${record.customer}`}
                        </div>
                        <div className="module-meta">
                          {tab === 'subscriptions'
                            ? ((record.items || []).map((item) => `${item.product_name || item.name} x${item.quantity}`).join(', ') || 'No items')
                            : ((record.items || []).map((item) => `${item.name || item.product_name} x${item.quantity}`).join(', ') || 'No items')}
                        </div>
                      </div>
                      <div>
                        <span className="module-badge">{formatStatus(record.status)}</span>
                        <div className="module-actions" style={{ marginTop: 8, justifyContent: 'flex-end' }}>
                          {tab === 'subscriptions' ? renderSubscriptionActions(record) : renderOrderActions(record)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDeliveriesPage;
