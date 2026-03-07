import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import '../styles/ManagementPage.css';

function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    role: 'admin',
    is_active: true,
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAll();
      setAdmins(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      alert('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      role: 'admin',
      is_active: true,
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (admin) => {
    setFormData({ ...admin, password: '' });
    setEditingId(admin.admin_id);
    setShowModal(true);
  };

  const handleDelete = async (admin) => {
    try {
      await adminService.delete(admin.admin_id);
      setAdmins(admins.filter(a => a.admin_id !== admin.admin_id));
      alert('Admin deleted successfully');
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Failed to delete admin');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.first_name || !formData.last_name || !formData.email || 
          !formData.phone || !formData.username) {
        alert('Please fill in all required fields');
        return;
      }

      // Validate password for new admin
      if (!editingId && !formData.password) {
        alert('Password is required for new admin');
        return;
      }

      const data = { ...formData };
      
      // Remove password if editing and no new password provided
      if (editingId && !data.password) {
        delete data.password;
      }
      
      if (editingId) {
        await adminService.update(editingId, data);
        alert('Admin updated successfully');
      } else {
        await adminService.create(data);
        alert('Admin created successfully');
      }
      setShowModal(false);
      fetchAdmins();
    } catch (error) {
      console.error('Error saving admin:', error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || 'Failed to save admin';
      alert('Error: ' + errorMsg);
    }
  };

  const columns = [
    { key: 'username', label: 'Username' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'is_active', label: 'Status', render: (val) => val ? '✅ Active' : '❌ Inactive' },
  ];

  return (
    <div className="page">
      <DataTable
        title="Administrators"
        columns={columns}
        data={admins}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal isOpen={showModal} title={editingId ? 'Edit Admin' : 'Add Admin'} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Password {editingId ? '(leave blank to keep current)' : '*'}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingId}
            />
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
              <option value="manager">Manager</option>
            </select>
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

export default AdminsPage;
