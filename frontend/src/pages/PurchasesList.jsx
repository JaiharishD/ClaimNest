import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { fetchPurchases, deletePurchase } from '../config/api';
import { formatDate } from '../utils/dateUtils';

/**
 * PurchasesList Component ("My Purchases")
 * 
 * Demonstrates:
 * - Unit I: Responsive tables and action controls
 * - Unit II: Search filters, array mapping/filtering, and modal view dialog
 * - Unit IV & V: useState, useEffect, dynamic API calls, CRUD deletion
 */
export default function PurchasesList() {
  const navigate = useNavigate();

  // State for purchases array
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Selected item for the "View Details" modal
  const [viewingItem, setViewingItem] = useState(null);

  // Load purchases from database on mount or when filters change
  useEffect(() => {
    loadPurchases();
  }, [selectedCategory, selectedStatus]);

  function loadPurchases() {
    setLoading(true);
    setError(null);

    fetchPurchases({
      category: selectedCategory,
      status: selectedStatus
    })
      .then((res) => {
        if (res.success && res.data) {
          setPurchases(res.data);
        } else {
          setError(res.message || 'Failed to load purchases');
        }
      })
      .catch((err) => {
        console.error('Error fetching purchases:', err);
        setError('Failed to connect to backend API: ' + err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  // Handle client-side search query
  const filteredPurchases = purchases.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = item.product_name.toLowerCase().includes(term);
    const sellerMatch = item.seller_name.toLowerCase().includes(term);
    return nameMatch || sellerMatch;
  });

  // Handle Delete Purchase
  async function handleDelete(id, name) {
    const confirmed = window.confirm(`Are you sure you want to delete "${name}"? This will also remove any claims attached to this purchase.`);
    if (!confirmed) return;

    try {
      const res = await deletePurchase(id);
      if (res.success) {
        // Update local state without needing full refresh
        setPurchases((prev) => prev.filter((item) => item.id !== id));
        if (viewingItem && viewingItem.id === id) {
          setViewingItem(null);
        }
      } else {
        alert(res.message || 'Failed to delete purchase.');
      }
    } catch (err) {
      alert('Error deleting purchase: ' + err.message);
    }
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header d-flex flex-wrap justify-content-between align-items-center">
        <div>
          <h1 className="page-title">My Purchases</h1>
          <p className="page-subtitle">Manage all recorded products, warranties, and return windows.</p>
        </div>
        <div className="mt-3 mt-md-0">
          <Link to="/add-purchase" className="btn btn-primary">
            + Add New Purchase
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="app-card mb-4">
        <div className="row g-2 align-items-center">
          {/* Search box */}
          <div className="col-12 col-md-5">
            <input
              type="text"
              className="form-control-custom"
              placeholder="Search product or seller name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select-custom"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Gadgets">Gadgets</option>
              <option value="Appliances">Appliances</option>
              <option value="Fashion & Apparel">Fashion & Apparel</option>
              <option value="Home & Kitchen">Home & Kitchen</option>
              <option value="Books">Books</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select-custom"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon (&le; 7 days)</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="col-12 col-md-1 text-md-end">
            <button
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedStatus('');
              }}
              title="Reset Filters"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Purchases Data Table */}
      <div className="app-card">
        {loading ? (
          <div className="text-center py-5 text-muted">
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
            Loading purchase records from MySQL...
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p className="mb-2">No purchases matched your search or filters.</p>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedStatus('');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Product & Seller</th>
                  <th>Category</th>
                  <th>Purchase Date</th>
                  <th>Return Deadline</th>
                  <th>Warranty Expiry</th>
                  <th>Price</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.product_name}</strong>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                        Store: {item.seller_name}
                      </div>
                      {item.receipt_filename && (
                        <span className="badge bg-light text-secondary border mt-1" style={{ fontSize: '0.72rem' }}>
                          📄 Receipt Attached
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {item.category}
                      </span>
                    </td>
                    <td>{formatDate(item.purchase_date)}</td>
                    <td>
                      <div>{formatDate(item.return_deadline)}</div>
                      <StatusBadge
                        status={item.return_status}
                        customText={
                          item.return_days < 0
                            ? 'Expired'
                            : `${item.return_days} days left`
                        }
                      />
                    </td>
                    <td>
                      <div>{formatDate(item.warranty_expiry)}</div>
                      <StatusBadge status={item.warranty_status} />
                    </td>
                    <td>
                      ₹{parseFloat(item.purchase_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm" role="group">
                        {/* View Details */}
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setViewingItem(item)}
                          title="View details"
                        >
                          View
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => navigate(`/edit-purchase/${item.id}`)}
                          title="Edit details"
                        >
                          Edit
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(item.id, item.product_name)}
                          title="Delete purchase"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simple View Details Modal */}
      {viewingItem && (
        <div className="modal-overlay" onClick={() => setViewingItem(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5 className="modal-title m-0 fw-bold">{viewingItem.product_name}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setViewingItem(null)}
              ></button>
            </div>

            <div className="modal-body-custom">
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <div className="text-muted" style={{ fontSize: '0.82rem' }}>Category</div>
                  <div className="fw-semibold">{viewingItem.category}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted" style={{ fontSize: '0.82rem' }}>Seller / Store</div>
                  <div className="fw-semibold">{viewingItem.seller_name}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted" style={{ fontSize: '0.82rem' }}>Purchase Date</div>
                  <div>{formatDate(viewingItem.purchase_date)}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted" style={{ fontSize: '0.82rem' }}>Purchase Price</div>
                  <div className="fw-bold text-primary">
                    ₹{parseFloat(viewingItem.purchase_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-light rounded border mb-3">
                <div className="row g-2">
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: '0.82rem' }}>Return Window</div>
                    <div>{formatDate(viewingItem.return_deadline)}</div>
                    <div className="mt-1">
                      <StatusBadge
                        status={viewingItem.return_status}
                        customText={
                          viewingItem.return_days < 0
                            ? 'Expired'
                            : `${viewingItem.return_days} days remaining`
                        }
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: '0.82rem' }}>Warranty Status</div>
                    <div>{formatDate(viewingItem.warranty_expiry)}</div>
                    <div className="mt-1">
                      <StatusBadge status={viewingItem.warranty_status} />
                    </div>
                  </div>
                </div>
              </div>

              {viewingItem.notes && (
                <div className="mb-3">
                  <div className="text-muted" style={{ fontSize: '0.82rem' }}>Notes & Serial Number</div>
                  <p className="mb-0 small bg-white p-2 border rounded">{viewingItem.notes}</p>
                </div>
              )}

              {viewingItem.receipt_filename && (
                <div className="mb-2">
                  <div className="text-muted" style={{ fontSize: '0.82rem' }}>Receipt File</div>
                  <div className="small text-secondary">
                    📄 {viewingItem.receipt_filename}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer-custom">
              <Link
                to={`/claims?purchase_id=${viewingItem.id}`}
                className="btn btn-sm btn-primary"
                onClick={() => setViewingItem(null)}
              >
                + File Claim For This Item
              </Link>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setViewingItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
