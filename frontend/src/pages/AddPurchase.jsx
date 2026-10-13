import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createPurchase, updatePurchase, fetchPurchaseById } from '../config/api';
import { calculateDaysRemaining, getDeadlineStatus, getTodayDateString } from '../utils/dateUtils';

/**
 * AddPurchase Component
 * 
 * Demonstrates:
 * - Unit I: Semantic HTML forms, inputs, file attachments, and Bootstrap layouts.
 * - Unit II: Client-side JavaScript form validation, date verification, and state events.
 * - Unit IV & V: React Hooks (useState, useEffect, useNavigate, useParams).
 * - Multi-part file upload and API communication with PHP.
 */
export default function AddPurchase() {
  const navigate = useNavigate();
  const { id } = useParams(); // If present, component is in "Edit" mode
  const isEditMode = Boolean(id);

  // Form state
  const [formData, setFormData] = useState({
    product_name: '',
    category: 'Electronics',
    purchase_date: getTodayDateString(),
    purchase_price: '',
    seller_name: '',
    return_deadline: '',
    warranty_expiry: '',
    notes: ''
  });

  // File upload state
  const [receiptFile, setReceiptFile] = useState(null);

  // UI status messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // If in Edit Mode, fetch current purchase details
  useEffect(() => {
    if (isEditMode) {
      setLoadingData(true);
      fetchPurchaseById(id)
        .then((res) => {
          if (res.success && res.data) {
            const item = res.data;
            setFormData({
              product_name: item.product_name,
              category: item.category,
              purchase_date: item.purchase_date,
              purchase_price: item.purchase_price,
              seller_name: item.seller_name,
              return_deadline: item.return_deadline,
              warranty_expiry: item.warranty_expiry,
              notes: item.notes || ''
            });
          } else {
            setErrorMessage('Could not find existing purchase with ID: ' + id);
          }
        })
        .catch((err) => {
          setErrorMessage('Error loading purchase details: ' + err.message);
        })
        .finally(() => {
          setLoadingData(false);
        });
    }
  }, [id, isEditMode]);

  // Standard input change handler
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear previous errors when user edits
    if (errorMessage) setErrorMessage('');
  }

  // File selection handler
  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  }

  // Quick preset helper: add days/months to purchase date
  function setReturnWindowPreset(days) {
    if (!formData.purchase_date) return;
    const baseDate = new Date(formData.purchase_date);
    baseDate.setDate(baseDate.getDate() + days);
    
    const yyyy = baseDate.getFullYear();
    const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
    const dd = String(baseDate.getDate()).padStart(2, '0');
    
    setFormData((prev) => ({
      ...prev,
      return_deadline: `${yyyy}-${mm}-${dd}`
    }));
  }

  function setWarrantyPreset(years) {
    if (!formData.purchase_date) return;
    const baseDate = new Date(formData.purchase_date);
    baseDate.setFullYear(baseDate.getFullYear() + years);

    const yyyy = baseDate.getFullYear();
    const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
    const dd = String(baseDate.getDate()).padStart(2, '0');

    setFormData((prev) => ({
      ...prev,
      warranty_expiry: `${yyyy}-${mm}-${dd}`
    }));
  }

  // Client-side validation function (Unit II JS logic)
  function validateForm() {
    if (!formData.product_name.trim()) {
      return 'Please enter the product name.';
    }
    if (!formData.category.trim()) {
      return 'Please choose a category.';
    }
    if (!formData.seller_name.trim()) {
      return 'Please specify the seller or store name.';
    }

    const price = parseFloat(formData.purchase_price);
    if (isNaN(price) || price <= 0) {
      return 'Please enter a valid positive purchase price.';
    }

    if (!formData.purchase_date) {
      return 'Please select the purchase date.';
    }
    if (!formData.return_deadline) {
      return 'Please select the return deadline date.';
    }
    if (!formData.warranty_expiry) {
      return 'Please select the warranty expiry date.';
    }

    // Date sequence validation: Return & Warranty cannot be before Purchase Date
    if (formData.return_deadline < formData.purchase_date) {
      return 'Return deadline cannot be earlier than the purchase date.';
    }
    if (formData.warranty_expiry < formData.purchase_date) {
      return 'Warranty expiry cannot be earlier than the purchase date.';
    }

    return null; // Valid!
  }

  // Form submission handler
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Step 1: Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSubmitting(true);

    try {
      if (isEditMode) {
        // Updating existing purchase
        const updatePayload = {
          ...formData,
          id: id
        };
        const response = await updatePurchase(updatePayload);
        if (response.success) {
          setSuccessMessage('Purchase updated successfully!');
          setTimeout(() => {
            navigate('/purchases');
          }, 1200);
        } else {
          setErrorMessage(response.message || 'Update failed');
        }
      } else {
        // Adding new purchase
        // If file is attached, use FormData for multipart POST
        let payload;
        if (receiptFile) {
          payload = new FormData();
          Object.keys(formData).forEach((key) => {
            payload.append(key, formData[key]);
          });
          payload.append('receipt', receiptFile);
        } else {
          payload = formData;
        }

        const response = await createPurchase(payload);
        if (response.success) {
          setSuccessMessage('Purchase recorded successfully into MySQL database!');
          // Reset form
          setFormData({
            product_name: '',
            category: 'Electronics',
            purchase_date: getTodayDateString(),
            purchase_price: '',
            seller_name: '',
            return_deadline: '',
            warranty_expiry: '',
            notes: ''
          });
          setReceiptFile(null);

          setTimeout(() => {
            navigate('/purchases');
          }, 1200);
        } else {
          setErrorMessage(response.message || 'Failed to save purchase');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Network error communicating with backend API.');
    } finally {
      setSubmitting(false);
    }
  }

  // Live dynamic calculations for user guidance
  const returnDays = formData.return_deadline ? calculateDaysRemaining(formData.return_deadline) : null;
  const warrantyDays = formData.warranty_expiry ? calculateDaysRemaining(formData.warranty_expiry) : null;

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1 className="page-title">{isEditMode ? 'Edit Purchase' : 'Add New Purchase'}</h1>
          <p className="page-subtitle">
            {isEditMode
              ? 'Update the details and coverage dates of this item.'
              : 'Enter purchase information to track return deadlines and warranty coverage.'}
          </p>
        </div>
        <Link to="/purchases" className="btn btn-outline-secondary">
          &larr; Back to Purchases
        </Link>
      </div>

      {loadingData ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Loading purchase record...</p>
        </div>
      ) : (
        <div className="row justify-content-center">
          <div className="col-12 col-lg-9">
            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="alert alert-danger" role="alert">
                <strong>Validation Notice:</strong> {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success" role="alert">
                <strong>Success:</strong> {successMessage}
              </div>
            )}

            {/* Live Calculation Preview Banner */}
            {(returnDays !== null || warrantyDays !== null) && (
              <div className="date-helper-box mb-3">
                <strong>Live Date Calculation Preview:</strong>
                <ul className="mb-0 mt-1 ps-3">
                  {returnDays !== null && (
                    <li>
                      Return Window: <strong>{returnDays >= 0 ? `${returnDays} days remaining` : `Expired (${Math.abs(returnDays)} days ago)`}</strong> ({getDeadlineStatus(formData.return_deadline)})
                    </li>
                  )}
                  {warrantyDays !== null && (
                    <li>
                      Warranty Coverage: <strong>{warrantyDays >= 0 ? `${warrantyDays} days remaining` : `Expired (${Math.abs(warrantyDays)} days ago)`}</strong> ({getDeadlineStatus(formData.warranty_expiry)})
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="app-card">
              <form onSubmit={handleSubmit} noValidate>
                {/* Product Name & Category */}
                <div className="row g-3 mb-3">
                  <div className="col-md-8">
                    <label className="form-label form-label-custom" htmlFor="product_name">
                      Product Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="product_name"
                      name="product_name"
                      className="form-control-custom"
                      placeholder="e.g. Sony WH-1000XM5 Headphones"
                      value={formData.product_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label form-label-custom" htmlFor="category">
                      Category <span className="text-danger">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      className="form-select-custom"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Gadgets">Gadgets</option>
                      <option value="Appliances">Appliances</option>
                      <option value="Fashion & Apparel">Fashion & Apparel</option>
                      <option value="Home & Kitchen">Home & Kitchen</option>
                      <option value="Books">Books</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Seller & Price */}
                <div className="row g-3 mb-3">
                  <div className="col-md-7">
                    <label className="form-label form-label-custom" htmlFor="seller_name">
                      Seller or Store Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="seller_name"
                      name="seller_name"
                      className="form-control-custom"
                      placeholder="e.g. Amazon India, Dell Store, Croma"
                      value={formData.seller_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-5">
                    <label className="form-label form-label-custom" htmlFor="purchase_price">
                      Purchase Price (₹) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="purchase_price"
                      name="purchase_price"
                      className="form-control-custom"
                      placeholder="e.g. 2499.00"
                      value={formData.purchase_price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Date Fields */}
                <div className="row g-3 mb-3">
                  {/* Purchase Date */}
                  <div className="col-md-4">
                    <label className="form-label form-label-custom" htmlFor="purchase_date">
                      Purchase Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      id="purchase_date"
                      name="purchase_date"
                      className="form-control-custom"
                      value={formData.purchase_date}
                      onChange={handleChange}
                      required
                    />
                    <div className="form-hint">Date item was bought</div>
                  </div>

                  {/* Return Deadline */}
                  <div className="col-md-4">
                    <label className="form-label form-label-custom" htmlFor="return_deadline">
                      Return Deadline <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      id="return_deadline"
                      name="return_deadline"
                      className="form-control-custom"
                      value={formData.return_deadline}
                      onChange={handleChange}
                      required
                    />
                    <div className="d-flex gap-1 mt-1">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm py-0 px-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setReturnWindowPreset(7)}
                      >
                        +7 days
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm py-0 px-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setReturnWindowPreset(15)}
                      >
                        +15 days
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm py-0 px-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setReturnWindowPreset(30)}
                      >
                        +30 days
                      </button>
                    </div>
                  </div>

                  {/* Warranty Expiry */}
                  <div className="col-md-4">
                    <label className="form-label form-label-custom" htmlFor="warranty_expiry">
                      Warranty Expiry <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      id="warranty_expiry"
                      name="warranty_expiry"
                      className="form-control-custom"
                      value={formData.warranty_expiry}
                      onChange={handleChange}
                      required
                    />
                    <div className="d-flex gap-1 mt-1">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm py-0 px-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setWarrantyPreset(1)}
                      >
                        +1 Year
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm py-0 px-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setWarrantyPreset(2)}
                      >
                        +2 Years
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional File Attachment & Notes */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label form-label-custom" htmlFor="receipt_file">
                      Receipt or Invoice (Optional)
                    </label>
                    <input
                      type="file"
                      id="receipt_file"
                      name="receipt_file"
                      className="form-control-custom"
                      accept=".pdf,image/jpeg,image/png"
                      onChange={handleFileChange}
                    />
                    <div className="form-hint">Accepted formats: PDF, JPG, PNG</div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label form-label-custom" htmlFor="notes">
                      Notes or Serial Number (Optional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows="2"
                      className="form-control-custom"
                      placeholder="e.g. Serial #12345, Invoice #INV-902, purchased with card discount"
                      value={formData.notes}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                  <button
                    type="button"
                    className="btn btn-light border px-4"
                    onClick={() => navigate('/purchases')}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : isEditMode ? 'Update Purchase' : 'Save Purchase'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
