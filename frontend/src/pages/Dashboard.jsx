import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { fetchDashboard } from '../config/api';
import { formatDate } from '../utils/dateUtils';

/**
 * Dashboard Page
 * 
 * Demonstrates:
 * - Unit IV & V (useState for metrics, useEffect for data fetching on component mount)
 * - Dynamic data display from PHP API & MySQL database
 * - Status calculation and clean card layout
 */
export default function Dashboard() {
  // State for storing metrics and recent items
  const [dashboardData, setDashboardData] = useState({
    total_purchases: 0,
    approaching_returns: 0,
    open_claims: 0,
    expired_warranties: 0,
    recent_purchases: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dashboard statistics when component mounts
  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  // Simple function to fetch data from backend PHP API
  function loadDashboardMetrics() {
    setLoading(true);
    setError(null);

    fetchDashboard()
      .then((res) => {
        if (res.success && res.data) {
          setDashboardData(res.data);
        } else {
          setError(res.message || 'Failed to load dashboard data');
        }
      })
      .catch((err) => {
        console.error('Error fetching dashboard:', err);
        setError('Cannot connect to backend server. Make sure PHP is running on port 8000.');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className="container">
      {/* Top Page Header */}
      <div className="page-header d-flex flex-wrap justify-content-between align-items-center">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Track purchases, upcoming return deadlines, and active warranty claims.</p>
        </div>
        <div className="mt-3 mt-md-0 d-flex gap-2">
          <Link to="/add-purchase" className="btn btn-primary px-3">
            + Add Purchase
          </Link>
          <Link to="/claims" className="btn btn-outline-secondary px-3">
            Open Claims
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
          <div>
            <strong>Notice:</strong> {error}
          </div>
          <button className="btn btn-sm btn-outline-danger" onClick={loadDashboardMetrics}>
            Retry
          </button>
        </div>
      )}

      {/* Attention Banner if deadlines are approaching */}
      {!loading && dashboardData.approaching_returns > 0 && (
        <div className="alert alert-warning mb-4 d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div>
              <strong>Action Needed:</strong> You have <strong>{dashboardData.approaching_returns}</strong> product(s) with return deadlines approaching within the next 7 days!
            </div>
          </div>
          <Link to="/purchases" className="btn btn-sm btn-primary">
            Review in My Purchases &rarr;
          </Link>
        </div>
      )}

      {/* Metric Stat Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            label="Total Purchases"
            value={loading ? '...' : dashboardData.total_purchases}
            color="blue"
            hint="Recorded in database"
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            label="Deadlines Approaching"
            value={loading ? '...' : dashboardData.approaching_returns}
            color="amber"
            hint="Within next 7 days"
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            label="Open Claims"
            value={loading ? '...' : dashboardData.open_claims}
            color="teal"
            hint="Return / Repair in progress"
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            label="Expired Warranties"
            value={loading ? '...' : dashboardData.expired_warranties}
            color="red"
            hint="Past coverage date"
          />
        </div>
      </div>

      {/* Recently Added Purchases Table */}
      <div className="app-card">
        <div className="app-card-header">
          <h2 className="app-card-title">Recently Added Purchases</h2>
          <Link to="/purchases" className="btn btn-sm btn-outline-primary">
            View All ({dashboardData.total_purchases})
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-4 text-muted">
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
            Loading purchases from MySQL database...
          </div>
        ) : dashboardData.recent_purchases.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <p className="mb-2">No purchases recorded yet.</p>
            <Link to="/add-purchase" className="btn btn-sm btn-primary">
              Add your first purchase
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Purchase Date</th>
                  <th>Return Deadline</th>
                  <th>Warranty Expiry</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recent_purchases.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.product_name}</strong>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                        {item.seller_name}
                      </div>
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
                    <td>
                      <Link
                        to={`/claims?purchase_id=${item.id}`}
                        className="btn btn-sm btn-outline-secondary"
                        title="File a return or warranty claim"
                      >
                        File Claim
                      </Link>
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
