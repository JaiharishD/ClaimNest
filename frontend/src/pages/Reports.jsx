import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { fetchReports } from '../config/api';
import { formatDate } from '../utils/dateUtils';

/**
 * Reports Component
 * 
 * Demonstrates:
 * - Unit I: CSS bar charts, structured reporting tables, and badges
 * - Unit II: Array data grouping, mathematical aggregations (totals, percentages)
 * - Unit III: Backend SQL GROUP BY queries consumed via REST API
 * - Unit IV & V: useState, useEffect, dynamic reporting view
 */
export default function Reports() {
  const [reportsData, setReportsData] = useState({
    by_category: [],
    upcoming_returns: [],
    expired_warranties: [],
    claims_by_status: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  function loadReports() {
    setLoading(true);
    fetchReports()
      .then((res) => {
        if (res.success && res.data) {
          setReportsData(res.data);
        } else {
          setError(res.message || 'Failed to load report data');
        }
      })
      .catch((err) => {
        console.error('Error fetching reports:', err);
        setError('Failed to connect to backend server: ' + err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  // Calculate highest count for proportional CSS bar chart width
  const maxCategoryCount = reportsData.by_category.reduce(
    (max, item) => Math.max(max, parseInt(item.count, 10)),
    1
  );

  // Total expenditure across all purchases
  const totalExpenditure = reportsData.by_category.reduce(
    (sum, item) => sum + parseFloat(item.total_spent || 0),
    0
  );

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header d-flex flex-wrap justify-content-between align-items-center">
        <div>
          <h1 className="page-title">Summary & Reports</h1>
          <p className="page-subtitle">Visual summaries of purchases by category, upcoming deadlines, and warranty status.</p>
        </div>
        <div className="mt-3 mt-md-0">
          <button className="btn btn-outline-primary" onClick={loadReports}>
            Refresh Reports
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2">Computing report aggregations from database...</p>
        </div>
      ) : (
        <>
          {/* Top Row: Purchases by Category & CSS Bar Chart */}
          <div className="row g-4 mb-4">
            {/* Category Table */}
            <div className="col-12 col-lg-7">
              <div className="app-card h-100">
                <div className="app-card-header">
                  <h2 className="app-card-title">Purchases Grouped by Category</h2>
                  <span className="badge bg-light text-dark border">
                    Total: ₹{totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="app-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Item Count</th>
                        <th>Total Spent (₹)</th>
                        <th>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportsData.by_category.map((cat, idx) => {
                        const count = parseInt(cat.count, 10);
                        const spent = parseFloat(cat.total_spent);
                        const percent = totalExpenditure > 0 ? ((spent / totalExpenditure) * 100).toFixed(1) : 0;

                        return (
                          <tr key={idx}>
                            <td>
                              <strong>{cat.category}</strong>
                            </td>
                            <td>{count} item{count > 1 ? 's' : ''}</td>
                            <td>
                              ₹{spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td>
                              <span className="text-muted">{percent}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Visual Bar Chart (Pure CSS - student friendly & easy to explain) */}
            <div className="col-12 col-lg-5">
              <div className="app-card h-100">
                <div className="app-card-header">
                  <h2 className="app-card-title">Category Distribution Chart</h2>
                  <small className="text-muted">Relative volume</small>
                </div>

                <div className="chart-container">
                  {reportsData.by_category.map((cat, idx) => {
                    const count = parseInt(cat.count, 10);
                    const widthPercent = Math.round((count / maxCategoryCount) * 100);

                    return (
                      <div key={idx} className="chart-row">
                        <div className="chart-row-label">
                          <span>{cat.category}</span>
                          <span className="text-secondary">{count} items</span>
                        </div>
                        <div className="chart-bar-bg">
                          <div
                            className="chart-bar-fill"
                            style={{ width: `${widthPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Second Row: Upcoming Return Deadlines & Claims Breakdown */}
          <div className="row g-4 mb-4">
            {/* Products with Upcoming Return Deadlines */}
            <div className="col-12 col-lg-7">
              <div className="app-card h-100">
                <div className="app-card-header">
                  <h2 className="app-card-title">Upcoming Return Deadlines (&le; 7 Days)</h2>
                  <span className="badge bg-warning text-dark">
                    {reportsData.upcoming_returns.length} approaching
                  </span>
                </div>

                {reportsData.upcoming_returns.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    No return deadlines approaching within the next 7 days.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="app-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Seller</th>
                          <th>Return Deadline</th>
                          <th>Urgency</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportsData.upcoming_returns.map((item) => (
                          <tr key={item.id}>
                            <td><strong>{item.product_name}</strong></td>
                            <td>{item.seller_name}</td>
                            <td>{formatDate(item.return_deadline)}</td>
                            <td>
                              <StatusBadge
                                status="Expiring Soon"
                                customText={
                                  item.days_left === 0
                                    ? 'Expires Today!'
                                    : `${item.days_left} day${item.days_left > 1 ? 's' : ''} left`
                                }
                              />
                            </td>
                            <td>
                              <Link
                                to={`/claims?purchase_id=${item.id}`}
                                className="btn btn-sm btn-outline-primary py-0 px-2"
                                style={{ fontSize: '0.8rem' }}
                              >
                                File Return
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

            {/* Claims by Status */}
            <div className="col-12 col-lg-5">
              <div className="app-card h-100">
                <div className="app-card-header">
                  <h2 className="app-card-title">Claims by Status</h2>
                  <Link to="/claims" className="btn btn-sm btn-outline-secondary">
                    View Tracker
                  </Link>
                </div>

                {reportsData.claims_by_status.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    No claims have been recorded yet.
                  </div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {reportsData.claims_by_status.map((item, idx) => (
                      <li
                        key={idx}
                        className="list-group-item d-flex justify-content-between align-items-center px-0 py-2 border-bottom"
                      >
                        <div className="d-flex align-items-center gap-2">
                          <StatusBadge status={item.claim_status} />
                          <span className="fw-semibold">{item.claim_status}</span>
                        </div>
                        <span className="badge bg-secondary rounded-pill">
                          {item.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Third Row: Expired Warranties List */}
          <div className="app-card">
            <div className="app-card-header">
              <h2 className="app-card-title">Expired Warranties</h2>
              <span className="badge bg-danger">
                {reportsData.expired_warranties.length} expired
              </span>
            </div>

            {reportsData.expired_warranties.length === 0 ? (
              <div className="text-center py-4 text-muted">
                No expired warranties found in the system.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Seller</th>
                      <th>Expiry Date</th>
                      <th>Expired Since</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsData.expired_warranties.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.product_name}</strong></td>
                        <td>{item.category}</td>
                        <td>{item.seller_name}</td>
                        <td>{formatDate(item.warranty_expiry)}</td>
                        <td>{item.days_expired} days ago</td>
                        <td>
                          <StatusBadge status="Expired" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
