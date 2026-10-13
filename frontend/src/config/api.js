/**
 * ClaimNest - API Service Configuration
 * 
 * Handles HTTP communication between the React frontend and PHP backend using native fetch().
 * Demonstrates Unit IV & V (API integration, Promises, Async/Await).
 */

// Base URL for the PHP backend API running on localhost:8000
export const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Helper: Fetch dashboard summary statistics
 */
export async function fetchDashboard() {
  const response = await fetch(`${API_BASE_URL}/dashboard.php`);
  if (!response.ok) {
    throw new Error('Failed to load dashboard metrics');
  }
  return response.json();
}

/**
 * Helper: Fetch purchases list with optional search and filter parameters
 */
export async function fetchPurchases(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.category) params.append('category', filters.category);
  if (filters.status) params.append('status', filters.status);

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/purchases.php${query}`);
  if (!response.ok) {
    throw new Error('Failed to fetch purchases');
  }
  return response.json();
}

/**
 * Helper: Fetch a single purchase by ID
 */
export async function fetchPurchaseById(id) {
  const response = await fetch(`${API_BASE_URL}/purchases.php?id=${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch purchase details');
  }
  return response.json();
}

/**
 * Helper: Create a new purchase
 * Supports either FormData (if file attached) or regular JavaScript Object
 */
export async function createPurchase(data) {
  let options = {};

  if (data instanceof FormData) {
    options = {
      method: 'POST',
      body: data
    };
  } else {
    options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  }

  const response = await fetch(`${API_BASE_URL}/purchases.php`, options);
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to create purchase');
  }
  return result;
}

/**
 * Helper: Update an existing purchase
 */
export async function updatePurchase(data) {
  const response = await fetch(`${API_BASE_URL}/purchases.php`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to update purchase');
  }
  return result;
}

/**
 * Helper: Delete a purchase by ID
 */
export async function deletePurchase(id) {
  const response = await fetch(`${API_BASE_URL}/purchases.php?id=${id}`, {
    method: 'DELETE'
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to delete purchase');
  }
  return result;
}

/**
 * Helper: Fetch claims list
 */
export async function fetchClaims(filters = {}) {
  const params = new URLSearchParams();
  if (filters.purchase_id) params.append('purchase_id', filters.purchase_id);
  if (filters.status) params.append('status', filters.status);

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/claims.php${query}`);
  if (!response.ok) {
    throw new Error('Failed to fetch claims');
  }
  return response.json();
}

/**
 * Helper: Create a new claim
 */
export async function createClaim(data) {
  const response = await fetch(`${API_BASE_URL}/claims.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to record claim');
  }
  return result;
}

/**
 * Helper: Update claim status or details
 */
export async function updateClaim(data) {
  const response = await fetch(`${API_BASE_URL}/claims.php`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to update claim');
  }
  return result;
}

/**
 * Helper: Delete a claim by ID
 */
export async function deleteClaim(id) {
  const response = await fetch(`${API_BASE_URL}/claims.php?id=${id}`, {
    method: 'DELETE'
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to delete claim');
  }
  return result;
}

/**
 * Helper: Fetch reports and analytics
 */
export async function fetchReports() {
  const response = await fetch(`${API_BASE_URL}/reports.php`);
  if (!response.ok) {
    throw new Error('Failed to fetch reports');
  }
  return response.json();
}
