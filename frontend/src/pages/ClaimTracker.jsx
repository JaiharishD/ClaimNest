import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { fetchClaims, createClaim, updateClaim, deleteClaim, fetchPurchases } from '../config/api';
import { formatDate, getTodayDateString } from '../utils/dateUtils';

/**
 * ClaimTracker Component
 * 
 * Demonstrates:
 * - Unit I: Forms, select dropdowns, responsive card grid and tables
 * - Unit II: Conditional logic, form validation, business rule checks
 * - Unit IV & V: useState, useEffect, useSearchParams, relational foreign key handling
 */
export default function ClaimTracker() {
  const [searchParams] = useSearchParams();
  const preselectedPurchaseId = searchParams.get('purchase_id');

  // Claims and purchases lists
  const [claims, setClaims] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Form toggle state
  const [showForm, setShowForm] = useState(Boolean(preselectedPurchaseId));

  // New claim form state
  const [formData, setFormData] = useState({
    purchase_id: preselectedPurchaseId || '',
    request_type: 'Return',
    problem_description: '',
    request_date: getTodayDateString(),
    evidence_notes: '',
    claim_status: 'Pending'
  });

  // UI feedback state
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load claims and purchases on mount
  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Set preselected purchase if available from query params
  useEffect(() => {
    if (preselectedPurchaseId) {
      setFormData((prev) => ({ ...prev, purchase_id: preselectedPurchaseId }));
      setShowForm(true);
    }
  }, [preselectedPurchaseId]);

  function loadData() {
    setLoading(true);

    Promise.all([
      fetchClaims({ status: statusFilter }),
      fetchPurchases()
    ])
      .then(([claimsRes, purchasesRes]) => {
        if (claimsRes.success) setClaims(claimsRes.data || []);
        if (purchasesRes.success) setPurchases(purchasesRes.data || []);
      })
      .catch((err) => {
        console.error('Error loading claims data:', err);
        setErrorMessage('Failed to connect to backend API: ' + err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  }

  // Selected purchase details helper to check business rule (flagging missing details)
  const selectedPurchase = purchases.find(
    (p) => String(p.id) === String(formData.purchase_id)
  );

  // Core Business Rule Check: Flag missing purchase details or receipt
  const isMissingReceipt = selectedPurchase && !selectedPurchase.receipt_filename;

  // Submit new claim
  async function handleSubmitClaim(e) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.purchase_id) {
      setErrorMessage('Please select a purchase to file a claim against.');
      return;
    }
    if (!formData.problem_description.trim()) {
      setErrorMessage('Please provide a description of the issue or problem.');
      return;
    }
    if (formData.problem_description.trim().length < 5) {
      setErrorMessage('Problem description should be at least 5 characters.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await createClaim(formData);
      if (res.success) {
        setSuccessMessage('Claim request created successfully!');
        // Reset form
        setFormData({
          purchase_id: '',
          request_type: 'Return',
          problem_description: '',
          request_date: getTodayDateString(),
          evidence_notes: '',
          claim_status: 'Pending'
        });
        setShowForm(false);
        // Refresh claims list
        loadData();
      } else {
        setErrorMessage(res.message || 'Failed to submit claim.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error communicating with backend.');
    } finally {
      setSubmitting(false);
    }
  }

  // Update claim status directly from table row dropdown
  async function handleStatusChange(claimId, newStatus) {
    try {
      const res = await updateClaim({
        id: claimId,
        claim_status: newStatus
      });

      if (res.success) {
        // Update state locally
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? { ...c, claim_status: newStatus } : c))
        );
      } else {
        alert(res.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  }

  // Delete claim
  async function handleDeleteClaim(claimId) {
    const confirmed = window.confirm('Are you sure you want to delete this claim record?');
    if (!confirmed) return;

    try {
      const res = await deleteClaim(claimId);
      if (res.success) {
        setClaims((prev) => prev.filter((c) => c.id !== claimId));
      } else {
        alert(res.message || 'Failed to delete claim');
      }
    } catch (err) {
      alert('Error deleting claim: ' + err.message);
    }
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header d-flex flex-wrap justify-content-between align-items-center">
        <div>
          <h1 className="page-title">Claim Tracker</h1>
          <p className="page-subtitle">Track return, replacement, and repair requests for registered purchases.</p>
        </div>
        <div className="mt-3 mt-md-0">
          <button
            className={`btn ${showForm ? 'btn-outline-secondary' : 'btn-primary'}`}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Hide Form' : '+ Record New Claim'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      {/* Collapsible Record Claim Form */}
      {showForm && (
        <div className="app-card mb-4 border-primary">
          <div className="app-card-header">
            <h2 className="app-card-title">Record Claim Request</h2>
            <button
              className="btn btn-sm btn-link text-muted"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitClaim}>
            <div className="row g-3 mb-3">
              {/* Target Purchase */}
              <div className="col-md-7">
                <label className="form-label form-label-custom" htmlFor="purchase_id">
                  Select Purchase <span className="text-danger">*</span>
                </label>
                <select
                  id="purchase_id"
                  name="purchase_id"
                  className="form-select-custom"
                  value={formData.purchase_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Choose a registered purchase --</option>
                  {purchases.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} ({p.seller_name} - ₹{p.purchase_price})
                    </option>
                  ))}
                </select>
                <div className="form-hint">Claim will be linked to this product record</div>
              </div>

              {/* Request Type */}
              <div className="col-md-5">
                <label className="form-label form-label-custom" htmlFor="request_type">
                  Request Type <span className="text-danger">*</span>
                </label>
                <select
                  id="request_type"
                  name="request_type"
                  className="form-select-custom"
                  value={formData.request_type}
                  onChange={handleInputChange}
                >
                  <option value="Return">Return (Refund)</option>
                  <option value="Replacement">Replacement</option>
                  <option value="Repair">Repair / Service</option>
                </select>
              </div>
            </div>

            {/* Core Business Rule Warning: Missing receipt flag */}
            {isMissingReceipt && (
              <div className="alert alert-warning py-2 mb-3" style={{ fontSize: '0.88rem' }} role="alert">
                <strong>Attention:</strong> No receipt file was attached when <em>{selectedPurchase.product_name}</em> was added. Please make sure to reference your invoice number or evidence note below before submitting.
              </div>
            )}

            {/* Dates & Status */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label form-label-custom" htmlFor="request_date">
                  Request Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  id="request_date"
                  name="request_date"
                  className="form-control-custom"
                  value={formData.request_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label form-label-custom" htmlFor="claim_status">
                  Initial Status
                </label>
                <select
                  id="claim_status"
                  name="claim_status"
                  className="form-select-custom"
                  value={formData.claim_status}
                  onChange={handleInputChange}
                >
                  <option value="Pending">Pending (Draft / Not submitted yet)</option>
                  <option value="Submitted">Submitted (Sent to seller)</option>
                  <option value="In Progress">In Progress (Under review / inspection)</option>
                  <option value="Resolved">Resolved (Completed)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Problem Description */}
            <div className="mb-3">
              <label className="form-label form-label-custom" htmlFor="problem_description">
                Problem Description <span className="text-danger">*</span>
              </label>
              <textarea
                id="problem_description"
                name="problem_description"
                rows="3"
                className="form-control-custom"
                placeholder="Describe what is wrong with the product or reason for return..."
                value={formData.problem_description}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>

            {/* Evidence / Support Ticket Reference */}
            <div className="mb-4">
              <label className="form-label form-label-custom" htmlFor="evidence_notes">
                Evidence or Ticket Reference (Optional)
              </label>
              <input
                type="text"
                id="evidence_notes"
                name="evidence_notes"
                className="form-control-custom"
                placeholder="e.g. Ticket #SR-88412, support email sent, photos shared"
                value={formData.evidence_notes}
                onChange={handleInputChange}
              />
            </div>

            {/* Buttons */}
            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <button
                type="button"
                className="btn btn-light border"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4"
                disabled={submitting}
              >
                {submitting ? 'Saving Claim...' : 'Save Claim'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="app-card mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="fw-semibold text-secondary" style={{ fontSize: '0.92rem' }}>
            Filter Claims by Status:
          </div>
          <div className="d-flex gap-2">
            <select
              className="form-select-custom"
              style={{ width: '220px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses ({claims.length})</option>
              <option value="Pending">Pending</option>
              <option value="Submitted">Submitted</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>

            {statusFilter && (
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setStatusFilter('')}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Existing Claims Table */}
      <div className="app-card">
        <div className="app-card-header">
          <h2 className="app-card-title">Existing Claim Records</h2>
          <span className="badge bg-secondary">{claims.length} claims</span>
        </div>

        {loading ? (
          <div className="text-center py-5 text-muted">
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
            Loading claims from MySQL...
          </div>
        ) : claims.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p className="mb-2">No claims found.</p>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => setShowForm(true)}
            >
              Record a claim now
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Product & Seller</th>
                  <th>Request Type</th>
                  <th>Date</th>
                  <th>Problem Description</th>
                  <th>Status & Quick Update</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id}>
                    <td>
                      <strong>{claim.product_name}</strong>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                        {claim.seller_name} &bull; {claim.category}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {claim.request_type}
                      </span>
                    </td>
                    <td>{formatDate(claim.request_date)}</td>
                    <td style={{ maxWidth: '280px' }}>
                      <div>{claim.problem_description}</div>
                      {claim.evidence_notes && (
                        <div className="text-muted mt-1" style={{ fontSize: '0.78rem' }}>
                          <em>Ref: {claim.evidence_notes}</em>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <StatusBadge status={claim.claim_status} />
                        <select
                          className="form-select form-select-sm"
                          style={{ width: '130px', fontSize: '0.8rem' }}
                          value={claim.claim_status}
                          onChange={(e) => handleStatusChange(claim.id, e.target.value)}
                          title="Change claim status"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Submitted">Submitted</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteClaim(claim.id)}
                        title="Delete Claim"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
