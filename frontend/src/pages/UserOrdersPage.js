import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import '../styles/UserModules.css';
import Modal from '../components/Modal';

const ORDER_STEPS = ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered'];
const formatStatus = (value) => (
  (value || 'scheduled')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
);

function StatusTimeline({ steps, status, terminalStatuses = [] }) {
  const terminal = terminalStatuses.includes(status) ? status : '';
  const currentIndex = steps.indexOf(status);

  return (
    <div className="mm-stepper">
      {steps.map((step, index) => (
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

function UserOrdersPage({ authUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const load = async () => {
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
          setError(ordersRes.reason?.response?.data?.error || 'Could not load orders.');
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
    load();
  }, [authUser?.id]);

  const orderRows = useMemo(() => (
    orders.map((order) => ({
      id: order.order_id,
      status: order.status,
      subtotal: Number(order.subtotal || 0),
      discount: Number(order.discount_amount || 0),
      tax: Number(order.tax_amount || 0),
      total: Number(order.total_amount || 0),
      createdAt: order.created_at,
      deliveredAt: order.delivered_at,
      deliveryDate: order.delivery_date,
      deliverySlot: order.delivery_slot,
      addressLabel: order.delivery_address_label,
      addressLine1: order.delivery_address_line1,
      items: order.items || [],
    }))
  ), [orders]);

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
        <p>Track one-time orders and your upcoming subscription deliveries with live delivery stages.</p>
      </header>

      <div className="module-actions">
        <button type="button" className="ghost" onClick={handleBack}>Back</button>
      </div>

      {error ? <div className="module-card danger-zone">{error}</div> : null}

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
                      <div className="module-meta">
                        {(order.addressLabel || 'Delivery address')} • {formatStatus(order.deliverySlot)}
                      </div>
                      <div className="module-meta">{order.items.length} items</div>
                    </div>
                    <div>
                      <span className="module-badge">{formatStatus(order.status)}</span>
                      <div className="module-meta">INR {order.total.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="module-card">
            <h3>Subscription Deliveries</h3>
            <div className="module-meta" style={{ marginBottom: 10 }}>
              Daily plan deliveries move through packing and last-mile stages just like your one-time orders.
            </div>
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
                      <span className="module-badge">{formatStatus(delivery.status || 'scheduled')}</span>
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
            <div className="module-card">
              <div className="module-item-title">Delivery Timeline</div>
              <StatusTimeline steps={ORDER_STEPS} status={selectedOrder.status} />
            </div>

            <div className="module-item" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="module-item-title">Delivery Address</div>
                <div className="module-meta">{selectedOrder.addressLabel || 'Address not available'}</div>
                {selectedOrder.addressLine1 ? <div className="module-meta">{selectedOrder.addressLine1}</div> : null}
              </div>
              <div>
                <div className="module-item-title">Delivery Slot</div>
                <div className="module-meta">{formatStatus(selectedOrder.deliverySlot)}</div>
              </div>
              <div>
                <div className="module-item-title">Delivery Date</div>
                <div className="module-meta">
                  {selectedOrder.deliveryDate ? new Date(selectedOrder.deliveryDate).toLocaleDateString() : 'Not set'}
                </div>
              </div>
            </div>

            <div className="module-item" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="module-item-title">Status</div>
                <div className="module-meta">{formatStatus(selectedOrder.status)}</div>
              </div>
              <div>
                <div className="module-item-title">Placed At</div>
                <div className="module-meta">{new Date(selectedOrder.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="module-item-title">Delivered At</div>
                <div className="module-meta">
                  {selectedOrder.deliveredAt ? new Date(selectedOrder.deliveredAt).toLocaleString() : 'Pending'}
                </div>
              </div>
            </div>

            <div className="module-item" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="module-item-title">Subtotal</div>
                <div className="module-meta">INR {selectedOrder.subtotal.toFixed(2)}</div>
              </div>
              <div>
                <div className="module-item-title">Discount</div>
                <div className="module-meta">INR {selectedOrder.discount.toFixed(2)}</div>
              </div>
              <div>
                <div className="module-item-title">Tax</div>
                <div className="module-meta">INR {selectedOrder.tax.toFixed(2)}</div>
              </div>
              <div>
                <div className="module-item-title">Total</div>
                <div className="module-meta">INR {selectedOrder.total.toFixed(2)}</div>
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
                      <div className="module-meta">INR {Number(item.line_total || item.price || 0).toFixed(2)}</div>
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
