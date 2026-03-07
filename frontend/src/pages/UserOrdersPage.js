import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import '../styles/UserModules.css';
import Modal from '../components/Modal';

function UserOrdersPage({ authUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const load = async () => {
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
    load();
  }, [authUser?.id]);

  const orderRows = useMemo(() => (
    orders.map((order) => ({
      id: order.order_id,
      status: order.status,
      total: order.total_amount,
      createdAt: order.created_at,
      items: order.items || [],
    }))
  ), [orders]);

  const selectedOrderTotal = useMemo(() => {
    if (!selectedOrder) return 0;
    const total = Number(selectedOrder.total);
    return Number.isFinite(total) ? total : 0;
  }, [selectedOrder]);

  const backTarget = location?.state?.from;
  const handleBack = () => {
    if (backTarget) {
      navigate(backTarget);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/user/dashboard');
  };

  return (
    <div className="user-module">
      <header className="user-module-header">
        <h1>Orders</h1>
        <p>Track one-time orders and your subscription deliveries.</p>
      </header>

      <div className="module-actions">
        <button type="button" className="ghost" onClick={handleBack}>Back</button>
      </div>

      {loading ? (
        <div className="module-card">Loading orders...</div>
      ) : (
        <div className="module-grid">
          <article className="module-card">
            <h3>One-Time Orders</h3>
            {orderRows.length === 0 ? (
              <div className="module-meta">No orders yet.</div>
            ) : (
              <div className="module-list">
                {orderRows.slice(0, 8).map((order) => (
                  <div
                    key={order.id}
                    className="module-item clickable"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedOrder(order)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedOrder(order);
                      }
                    }}
                    aria-label={`Open order ${order.id} details`}
                  >
                    <div>
                      <strong>Order #{order.id}</strong>
                      <div className="module-meta">{new Date(order.createdAt).toLocaleString()}</div>
                      <div className="module-meta">{order.items.length} items</div>
                    </div>
                    <div>
                      <span className="module-badge">{order.status}</span>
                      <div className="module-meta">INR {order.total}</div>
                    </div>
                  </div>
                ))}
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
                      <span className="module-badge">Scheduled</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedOrder)}
        title={selectedOrder ? `Order #${selectedOrder.id}` : 'Order details'}
        onClose={() => setSelectedOrder(null)}
      >
        {!selectedOrder ? null : (
          <div className="module-list" style={{ gap: 12 }}>
            <div className="module-item" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="module-item-title">Status</div>
                <div className="module-meta">{selectedOrder.status}</div>
              </div>
              <div>
                <div className="module-item-title">Total</div>
                <div className="module-meta">INR {selectedOrderTotal}</div>
              </div>
            </div>

            <div className="module-card" style={{ padding: 0, border: 'none' }}>
              <div className="module-item-title" style={{ marginBottom: 8 }}>Items</div>
              {selectedOrder.items.length === 0 ? (
                <div className="module-meta">No item details available for this order.</div>
              ) : (
                <div className="module-list">
                  {selectedOrder.items.map((item, index) => (
                    <div key={`${item.product_id || item.name || 'item'}-${index}`} className="module-item">
                      <div>
                        <strong>{item.name || item.product_name || `Item ${index + 1}`}</strong>
                        <div className="module-meta">Qty {item.quantity || 1}</div>
                      </div>
                      {item.price ? <div className="module-meta">INR {item.price}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="module-actions" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="ghost" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default UserOrdersPage;
