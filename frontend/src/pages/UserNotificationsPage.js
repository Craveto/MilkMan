import React, { useEffect, useMemo, useState } from 'react';
import { userService } from '../services/api';
import '../styles/UserModules.css';

function UserNotificationsPage({ authUser }) {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoadError('');
        const [paymentsResponse, ordersResponse, notificationsResponse] = await Promise.all([
          userService.getPayments(authUser?.id),
          userService.getOrders(authUser?.id),
          userService.getNotifications(authUser?.id, { mark_read: true }),
        ]);
        setPayments(paymentsResponse.data || []);
        setOrders(ordersResponse.data || []);
        setSystemAlerts(notificationsResponse.data?.results || []);
      } catch (error) {
        setPayments([]);
        setOrders([]);
        setSystemAlerts([]);
        setLoadError(error?.response?.data?.error || 'Unable to load alerts right now.');
      }
    };
    load();
  }, [authUser?.id]);

  const notifications = useMemo(() => {
    const alertItems = systemAlerts.slice(0, 12).map((note) => ({
      id: `n-${note.notification_id}`,
      title: note.title,
      detail: note.message,
      time: note.created_at,
    }));
    const paymentItems = payments.slice(0, 8).map((payment) => ({
      id: `p-${payment.payment_id}`,
      title: `Payment ${payment.status}`,
      detail: `${payment.subscription_name} | INR ${payment.amount}`,
      time: payment.created_at,
    }));
    const orderItems = orders.slice(0, 8).map((order) => ({
      id: `o-${order.order_id}`,
      title: `Order ${order.status}`,
      detail: `Order #${order.order_id} | INR ${order.total_amount}`,
      time: order.created_at,
    }));
    return [...alertItems, ...paymentItems, ...orderItems]
      .sort((first, second) => new Date(second.time) - new Date(first.time))
      .slice(0, 16);
  }, [payments, orders, systemAlerts]);

  return (
    <div className="user-module">
      <header className="user-module-header">
        <h1>Notifications</h1>
        <p>Recent account activity, payments, order updates, and product alerts.</p>
      </header>

      <div className="module-list">
        {loadError ? (
          <div className="module-card">{loadError}</div>
        ) : notifications.length === 0 ? (
          <div className="module-card">No notifications yet.</div>
        ) : notifications.map((note) => (
          <div key={note.id} className="module-item">
            <div>
              <strong>{note.title}</strong>
              <div className="module-meta">{note.detail}</div>
            </div>
            <div className="module-meta">{new Date(note.time).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserNotificationsPage;
