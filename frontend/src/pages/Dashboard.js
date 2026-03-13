import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/api';
import '../styles/Dashboard.css';

function Dashboard({ authUser }) {
  const [stats, setStats] = useState({
    admins: 0,
    categories: 0,
    subscriptions: 0,
    customers: 0,
    products: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const showDeveloper = useMemo(() => {
    return authUser?.admin_role === 'super_admin';
  }, [authUser?.admin_role]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardSummary();
      setStats({
        admins: Number(response.data?.admins || 0),
        categories: Number(response.data?.categories || 0),
        subscriptions: Number(response.data?.subscriptions || 0),
        customers: Number(response.data?.customers || 0),
        products: Number(response.data?.products || 0),
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome to MilkMan Management System</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showDeveloper && (
        <div className="welcome-section" style={{ marginTop: 0 }}>
          <h2>Developer Console</h2>
          <p>Open the developer window to approve/reject admin applications.</p>
          <Link to="/admin/developer" style={{ fontWeight: 800, color: '#0f766e' }}>
            Open Developer Window →
          </Link>
        </div>
      )}

    
      <div className="stats-grid">
        <div className="stat-card admin-card">
          <div className="stat-icon">👤</div>
          <div className="stat-info">
            <h3>Admins</h3>
            <div className="stat-number">{stats.admins}</div>
          </div>
        </div>

        <div className="stat-card category-card">
          <div className="stat-icon">📁</div>
          <div className="stat-info">
            <h3>Categories</h3>
            <div className="stat-number">{stats.categories}</div>
          </div>
        </div>

        <div className="stat-card subscription-card">
          <div className="stat-icon">💳</div>
          <div className="stat-info">
            <h3>Subscriptions</h3>
            <div className="stat-number">{stats.subscriptions}</div>
          </div>
        </div>

        <div className="stat-card customer-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Customers</h3>
            <div className="stat-number">{stats.customers}</div>
          </div>
        </div>

        <div className="stat-card product-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>Products</h3>
            <div className="stat-number">{stats.products}</div>
          </div>
        </div>
      </div>

      <div className="welcome-section">
        <h2>Quick Start</h2>
        <p>Use the sidebar navigation to manage different modules of your application.</p>
        <ul>
          <li>📊 <strong>Dashboard:</strong> View system overview and statistics</li>
          <li>👤 <strong>Admins:</strong> Manage administrator accounts and roles</li>
          <li>📁 <strong>Categories:</strong> Organize products into categories</li>
          <li>💳 <strong>Subscriptions:</strong> Define subscription plans and pricing</li>
          <li>👥 <strong>Customers:</strong> Manage customer information and subscriptions</li>
          <li>📦 <strong>Products:</strong> Add and manage product inventory</li>
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;
