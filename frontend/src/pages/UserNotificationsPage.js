import React, { useEffect, useMemo, useState } from 'react';
import { userService } from '../services/api';
import '../styles/UserModules.css';

function UserNotificationsPage({ authUser }) {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [paymentsResponse, ordersResponse] = await Promise.all([
        userService.getPayments(authUser?.id),
        userService.getOrders(authUser?.id),
      ]);
      setPayments(paymentsResponse.data || []);
      setOrders(ordersResponse.data || []);
    };
    load();
  }, [authUser?.id]);

  const notifications = useMemo(() => {
    const paymentItems = payments.slice(0, 8).map((payment) => ({
      id: `p-${payment.payment_id}`,
      title: `Payment ${payment.status}`,
      detail: `${payment.subscription_name} • INR ${payment.amount}`,
      time: payment.created_at,
    }));
    const orderItems = orders.slice(0, 8).map((order) => ({
      id: `o-${order.order_id}`,
      title: `Order ${order.status}`,
      detail: `Order #${order.order_id} • INR ${order.total_amount}`,
      time: order.created_at,
    }));
    return [...paymentItems, ...orderItems]
      .sort((first, second) => new Date(second.time) - new Date(first.time))
      .slice(0, 12);
  }, [payments, orders]);

  return (
    <div className="user-module">
      <header className="user-module-header">
        <h1>Notifications</h1>
        <p>Recent account activity, payments, and order updates.</p>
      </header>

      <div className="module-list">
        {notifications.length === 0 ? (
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
