import React from 'react';
import Logo from './Logo';

/**
 * Footer Component
 * 
 * Styled to harmonize with #815854 and #F9EBDE color scheme.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="container text-center">
        <div className="d-flex justify-content-center align-items-center mb-2">
          <Logo size={24} showText={true} />
        </div>
        <p className="mb-1 fw-semibold" style={{ color: 'var(--primary-color)' }}>
          Purchase Return & Warranty Tracker
        </p>
        <p className="mb-0" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Web Programming Laboratory Academic Project &copy; {currentYear} &bull; Built with React, PHP & MySQL
        </p>
      </div>
    </footer>
  );
}
