import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import '../styles/ManagementPage.css';

function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    billing_cycle: 'monthly',
    duration_days: '30',
    max_products: '10',
    features: '',
    is_active: true,
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getAll();
      setSubscriptions(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      alert('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      billing_cycle: 'monthly',
      duration_days: '30',
      max_products: '10',
      features: '',
      is_active: true,
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (subscription) => {
    setFormData({
      ...subscription,
      features: JSON.stringify(subscription.features || []),
    });
    setEditingId(subscription.subscription_id);
    setShowModal(true);
  };

  const handleDelete = async (subscription) => {
    try {
      await subscriptionService.delete(subscription.subscription_id);
      setSubscriptions(subscriptions.filter(s => s.subscription_id !== subscription.subscription_id));
      alert('Subscription deleted successfully');
    } catch (error) {
      console.error('Error deleting subscription:', error);
      alert('Failed to delete subscription');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        features: formData.features ? JSON.parse(formData.features) : [],
      };
      
      if (editingId) {
        await subscriptionService.update(editingId, data);
        alert('Subscription updated successfully');
      } else {
        await subscriptionService.create(data);
        alert('Subscription created successfully');
      }
      setShowModal(false);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error saving subscription:', error);
      alert('Failed to save subscription');
    }
  };

  const columns = [
    { key: 'name', label: 'Plan Name' },
    { key: 'price', label: 'Price', render: (val) => `$${val}` },
    { key: 'billing_cycle', label: 'Billing' },
    { key: 'max_products', label: 'Max Products' },
    { key: 'is_active', label: 'Status', render: (val) => val ? '✅ Active' : '❌ Inactive' },
  ];

  return (
    <div className="page">
      <DataTable
        title="Subscription Plans"
        columns={columns}
        data={subscriptions}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal isOpen={showModal} title={editingId ? 'Edit Subscription' : 'Add Subscription'} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Plan Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Billing Cycle *</label>
              <select
                value={formData.billing_cycle}
                onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration (Days) *</label>
              <input
                type="number"
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Max Products *</label>
              <input
                type="number"
                value={formData.max_products}
                onChange={(e) => setFormData({ ...formData, max_products: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Features (JSON format)</label>
            <textarea
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              rows="2"
              placeholder='["Feature 1", "Feature 2"]'
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              Active
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SubscriptionsPage;
