import React from 'react';

/**
 * StatusBadge Component
 * 
 * Demonstrates Unit IV (Functional components and Props).
 * Displays a color-coded status badge for deadline states and claim progress.
 * 
 * @param {Object} props
 * @param {string} props.status - e.g. 'Active', 'Expiring Soon', 'Expired', 'Pending', 'Resolved'
 * @param {string} [props.customText] - Optional label override (e.g. '5 days left')
 */
export default function StatusBadge({ status, customText }) {
  if (!status) return null;

  // Convert status string to CSS class name: 'Expiring Soon' -> 'expiring-soon'
  const badgeClass = status.toLowerCase().replace(/\s+/g, '-');

  return (
    <span className={`status-badge ${badgeClass}`}>
      {customText || status}
    </span>
  );
}
