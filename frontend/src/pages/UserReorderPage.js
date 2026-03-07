import React, { useEffect, useMemo, useState } from 'react';
import { userService } from '../services/api';
import '../styles/UserModules.css';

function UserReorderPage({ authUser }) {
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const raw = window.localStorage.getItem('mm_favorites');
    return raw ? JSON.parse(raw) : [];
  });

  useEffect(() => {
    const loadOrders = async () => {
      const response = await userService.getOrders(authUser?.id);
      setOrders(response.data || []);
    };
    loadOrders();
  }, [authUser?.id]);

  useEffect(() => {
    window.localStorage.setItem('mm_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const frequentProducts = useMemo(() => {
    const count = {};
    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.product_name || `Product-${item.product}`;
        count[key] = (count[key] || 0) + Number(item.quantity || 0);
      });
    });
    return Object.entries(count)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 8);
  }, [orders]);

  const toggleFavorite = (productName) => {
    setFavorites((prev) => (
      prev.includes(productName) ? prev.filter((value) => value !== productName) : [...prev, productName]
    ));
  };

  return (
    <div className="user-module">
      <header className="user-module-header">
        <h1>Reorder & Favorites</h1>
        <p>Quickly reorder your most bought products and maintain favorites.</p>
      </header>

      <div className="module-grid">
        {frequentProducts.length === 0 ? (
          <div className="module-card">No order history available for reorder suggestions yet.</div>
        ) : frequentProducts.map(([name, qty]) => (
          <article key={name} className="module-card">
            <h3>{name}</h3>
            <div className="module-meta">Ordered quantity: {qty}</div>
            <div className="module-actions">
              <button type="button" onClick={() => window.localStorage.setItem('mm_user_active_panel', 'products')}>
                Reorder
              </button>
              <button type="button" className="ghost" onClick={() => toggleFavorite(name)}>
                {favorites.includes(name) ? 'Unfavorite' : 'Favorite'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default UserReorderPage;
