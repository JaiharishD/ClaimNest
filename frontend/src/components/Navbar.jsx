import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import Logo from './Logo';

/**
 * Navbar Component
 * 
 * Styled with #815854 and #F9EBDE theme palette.
 */
export default function Navbar() {
  return (
    <header className="app-navbar">
      <div className="container d-flex flex-wrap align-items-center justify-content-between py-2">
        {/* Brand Logo Link */}
        <Link to="/" className="navbar-brand-title">
          <Logo size={32} showText={true} />
        </Link>

        {/* Navigation Links */}
        <nav className="d-flex flex-wrap gap-2 my-2 my-md-0">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link-custom ${isActive ? 'active' : ''}`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/add-purchase"
            className={({ isActive }) =>
              `nav-link-custom ${isActive ? 'active' : ''}`
            }
          >
            + Add Purchase
          </NavLink>

          <NavLink
            to="/purchases"
            className={({ isActive }) =>
              `nav-link-custom ${isActive ? 'active' : ''}`
            }
          >
            My Purchases
          </NavLink>

          <NavLink
            to="/claims"
            className={({ isActive }) =>
              `nav-link-custom ${isActive ? 'active' : ''}`
            }
          >
            Claim Tracker
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `nav-link-custom ${isActive ? 'active' : ''}`
            }
          >
            Reports
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
