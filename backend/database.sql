-- ClaimNest - Purchase Return & Warranty Tracker
-- Database Schema for MySQL
-- Database Name: claimnest_db

CREATE DATABASE IF NOT EXISTS claimnest_db;
USE claimnest_db;

-- 1. Purchases Table
-- Stores information about purchased products, warranty, and return dates
CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_price DECIMAL(10, 2) NOT NULL,
    seller_name VARCHAR(100) NOT NULL,
    return_deadline DATE NOT NULL,
    warranty_expiry DATE NOT NULL,
    receipt_filename VARCHAR(255) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Claims Table
-- Stores service/repair/return requests related to a purchase
CREATE TABLE IF NOT EXISTS claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    request_type ENUM('Return', 'Replacement', 'Repair') NOT NULL,
    problem_description TEXT NOT NULL,
    request_date DATE NOT NULL,
    evidence_notes VARCHAR(255) DEFAULT NULL,
    claim_status ENUM('Pending', 'Submitted', 'In Progress', 'Resolved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_purchase_claim FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
);

-- 3. Realistic Sample Data
-- This sample data ensures the college demo works immediately with rich statistics!
INSERT INTO purchases (product_name, category, purchase_date, purchase_price, seller_name, return_deadline, warranty_expiry, receipt_filename, notes) VALUES
('Dell Inspiron 15 Laptop', 'Electronics', '2026-09-15', 54999.00, 'Dell Official Store', '2026-09-30', '2027-09-15', 'receipt_dell.pdf', 'Includes 1 year comprehensive warranty with accidental damage cover'),
('Sony WH-1000XM5 Headphones', 'Gadgets', '2026-10-05', 26990.00, 'Amazon India', '2026-10-18', '2027-10-05', 'sony_headphones_bill.pdf', 'Return deadline approaching in a few days'),
('Nike Air Zoom Pegasus Shoes', 'Fashion & Apparel', '2026-10-08', 7495.00, 'Nike Store Mall', '2026-10-15', '2026-11-08', NULL, 'Needs trial before return window closes in 2 days'),
('Philips Air Fryer HD9200', 'Home & Kitchen', '2026-05-10', 6999.00, 'Croma Retail', '2026-05-20', '2028-05-10', 'philips_bill.jpg', '2-year standard manufacturer warranty'),
('Logitech MX Master 3S Mouse', 'Electronics', '2025-08-01', 8995.00, 'Flipkart', '2025-08-10', '2026-08-01', 'logitech_invoice.pdf', 'Warranty expired 2 months ago'),
('Samsung 55-inch 4K Smart TV', 'Appliances', '2026-04-12', 48990.00, 'Reliance Digital', '2026-04-26', '2027-04-12', 'samsung_tv_tax_invoice.pdf', 'Panel under standard 1 year warranty');

-- Sample claims linked to purchases
INSERT INTO claims (purchase_id, request_type, problem_description, request_date, evidence_notes, claim_status) VALUES
(2, 'Replacement', 'Right ear cup has a faint buzzing sound at high volumes', '2026-10-10', 'Audio recording clip shared with Amazon support', 'In Progress'),
(5, 'Repair', 'Scroll wheel skipping clicks intermittently after warranty ended', '2026-09-02', 'Serial number verified with Logitech service center', 'Rejected'),
(1, 'Repair', 'Screen hinge making slight creaking noise when opening lid', '2026-10-01', 'Video clip attached to Dell ticket #88412', 'Submitted');
