import React from 'react';

/**
 * StatCard Component
 * 
 * Demonstrates Unit IV (Functional components, Props).
 * Displays a single metric block with a colored accent border on top.
 * 
 * @param {Object} props
 * @param {string} props.label - Metric name (e.g. 'Total Purchases')
 * @param {number|string} props.value - Metric count
 * @param {string} props.color - 'blue' | 'amber' | 'teal' | 'red'
 * @param {string} [props.hint] - Small contextual hint
 */
export default function StatCard({ label, value, color = 'blue', hint }) {
  return (
    <div className={`stat-card ${color}`}>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
