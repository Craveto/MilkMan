import React, { useState, useEffect } from 'react';
import { productService, categoryService } from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import '../styles/ManagementPage.css';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    variant: 'success',
    title: '',
    message: '',
    action: null,
    productId: null,
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    cost: '',
    quantity_in_stock: '0',
    sku: '',
    rating: '',
    status: 'active',
    is_featured: false,
    subscription_only: false,
    tags: '',
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!feedbackModal.open || feedbackModal.variant === 'warning' || feedbackModal.variant === 'error') {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setFeedbackModal((prev) => ({ ...prev, open: false }));
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [feedbackModal.open, feedbackModal.variant]);

  const openFeedbackModal = (variant, title, message, action = null, productId = null) => {
    setFeedbackModal({
      open: true,
      variant,
      title,
      message,
      action,
      productId,
    });
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll();
      setProducts(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      cost: '',
      quantity_in_stock: '0',
      sku: '',
      rating: '',
      status: 'active',
      is_featured: false,
      subscription_only: false,
      tags: '',
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product.product_id);
    setShowModal(true);
  };

  const handleDelete = async (product) => {
    try {
      const response = await productService.delete(product.product_id);
      await fetchProducts();
      openFeedbackModal(
        'success',
        'Product Deleted',
        response?.data?.message || 'Product deleted successfully'
      );
    } catch (error) {
      console.error('Error deleting product:', error);
      if (error.response?.status === 409 && error.response?.data?.can_delete_anyway) {
        openFeedbackModal(
          'warning',
          'Delete Blocked',
          error.response?.data?.message || 'This product is already used in active records.',
          'delete-anyway',
          product.product_id
        );
        return;
      }
      const errorMsg = error.response?.data?.message ||
        error.response?.data?.detail ||
        'Failed to delete product';
      openFeedbackModal('error', 'Delete Failed', errorMsg);
    }
  };

  const handleDeleteAnyway = async () => {
    if (!feedbackModal.productId) return;
    try {
      const response = await productService.deleteAnyway(feedbackModal.productId);
      await fetchProducts();
      const notifiedCount = Number(response?.data?.notified_customers || 0);
      openFeedbackModal(
        'success',
        'Product Discontinued',
        notifiedCount > 0
          ? `${response?.data?.message} ${notifiedCount} customer${notifiedCount > 1 ? 's were' : ' was'} notified in Alerts.`
          : (response?.data?.message || 'Product discontinued successfully')
      );
    } catch (error) {
      const errorMsg = error.response?.data?.message ||
        error.response?.data?.detail ||
        'Failed to discontinue product';
      openFeedbackModal('error', 'Action Failed', errorMsg);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.name || !formData.sku || !formData.price || !formData.category) {
        alert('Please fill in all required fields (Name, SKU, Price, Category)');
        return;
      }

      // Parse tags: convert from string to array
      let tagsArray = [];
      if (formData.tags && typeof formData.tags === 'string') {
        tagsArray = formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      } else if (Array.isArray(formData.tags)) {
        tagsArray = formData.tags;
      }

      const data = {
        ...formData,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : null,
        quantity_in_stock: parseInt(formData.quantity_in_stock) || 0,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        category: parseInt(formData.category),
        tags: tagsArray, // Convert to proper array
      };

      if (editingId) {
        await productService.update(editingId, data);
        alert('✅ Product updated successfully');
      } else {
        await productService.create(data);
        alert('✅ Product created successfully');
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMsg = error.response?.data?.detail || 
                       error.response?.data?.non_field_errors?.[0] ||
                       Object.values(error.response?.data || {}).flat()?.[0] ||
                       'Failed to save product';
      alert('Error: ' + errorMsg);
    }
  };

  const columns = [
    { key: 'name', label: 'Product Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'price', label: 'Price', render: (val) => `$${val}` },
    { key: 'quantity_in_stock', label: 'Stock' },
    { key: 'subscription_only', label: 'Subscription', render: (val) => (val ? 'Eligible' : 'One-time only') },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="page">
      <DataTable
        title="Products"
        columns={columns}
        data={products}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal isOpen={showModal} title={editingId ? 'Edit Product' : 'Add Product'} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>SKU *</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
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
              <label>Cost</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Stock Quantity</label>
              <input
                type="number"
                value={formData.quantity_in_stock}
                onChange={(e) => setFormData({ ...formData, quantity_in_stock: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Rating (0-5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              />
              Featured Product
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={Boolean(formData.subscription_only)}
                onChange={(e) => setFormData({ ...formData, subscription_only: e.target.checked })}
              />
              Available for Subscription (can also be ordered one-time)
            </label>
          </div>

          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. premium, wireless, new"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={feedbackModal.open}
        title=""
        onClose={() => setFeedbackModal((prev) => ({ ...prev, open: false }))}
      >
        <div className={`product-feedback product-feedback-${feedbackModal.variant}`}>
          <div className="product-feedback-accent" />
          <div className="product-feedback-shell">
            <div className={`product-feedback-icon ${feedbackModal.variant}`}>
              {feedbackModal.variant === 'success' ? 'OK' : feedbackModal.variant === 'warning' ? 'FYI' : '!'}
            </div>
            <div className="product-feedback-copy">
              <span className="product-feedback-kicker">
                {feedbackModal.variant === 'warning' ? 'Action adjusted' : feedbackModal.variant === 'error' ? 'Needs attention' : 'Update complete'}
              </span>
              <h3>{feedbackModal.title}</h3>
              <p>{feedbackModal.message}</p>
            </div>
          </div>
          <div className="product-feedback-actions">
            {feedbackModal.action === 'delete-anyway' ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFeedbackModal((prev) => ({ ...prev, open: false }))}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-delete-anyway"
                  onClick={handleDeleteAnyway}
                >
                  Delete Anyway
                </button>
              </>
            ) : (
              <button
                type="button"
                className={`btn ${feedbackModal.variant === 'error' ? 'btn-delete' : 'btn-primary'}`}
                onClick={() => setFeedbackModal((prev) => ({ ...prev, open: false }))}
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ProductsPage;
