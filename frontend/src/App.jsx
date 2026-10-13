import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import AddPurchase from './pages/AddPurchase';
import PurchasesList from './pages/PurchasesList';
import ClaimTracker from './pages/ClaimTracker';
import Reports from './pages/Reports';

/**
 * Main Application Component
 * 
 * Demonstrates:
 * - Unit IV & V (React Router v6/v7 composition, declarative routing, and page layout)
 * - Single Page Application (SPA) architecture
 */
export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Navigation Bar */}
        <Navbar />

        {/* Dynamic Page Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-purchase" element={<AddPurchase />} />
            <Route path="/edit-purchase/:id" element={<AddPurchase />} />
            <Route path="/purchases" element={<PurchasesList />} />
            <Route path="/claims" element={<ClaimTracker />} />
            <Route path="/reports" element={<Reports />} />
            {/* Catch-all redirect to Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}
