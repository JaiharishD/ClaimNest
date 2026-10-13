# ClaimNest — Purchase Return & Warranty Tracker

**ClaimNest** is a clean, student-friendly Web Programming college project that helps users record product purchases, track return deadlines and warranty expiry dates, and manage return, replacement, or repair claims.

Built for academic demonstrations and college viva examinations, the codebase is intentionally structured with straightforward logic, readable naming, and standard web development patterns across all 5 syllabus units.

---

## 🛠️ Technology Stack & Syllabus Mapping

| Technology | Purpose in ClaimNest | Syllabus Unit Demonstrated |
| :--- | :--- | :--- |
| **HTML5 & CSS3** | Semantic structure, custom cards, tables, CSS bar chart, clean color scheme | **Unit I — Web Basics, HTML & CSS** |
| **JavaScript (ES6+)** | Date arithmetic, client-side validation, array filters, helper functions | **Unit II — Client-Side JavaScript** |
| **PHP 8.x** | REST API endpoints, input validation, JSON responses, CORS handling | **Unit III — PHP Backend & Server Logic** |
| **MySQL (PDO)** | Relational database storage (`purchases`, `claims`), prepared statements | **Unit III — Database Connectivity** |
| **React 19 & Vite** | Component architecture, responsive UI, single-page application structure | **Unit IV — ReactJS Components & State** |
| **React Hooks & Router** | `useState`, `useEffect`, `useParams`, `useSearchParams`, `react-router-dom` | **Unit V — React Dataflow & Routing** |
| **Bootstrap 5** | Responsive grid, form controls, action buttons | **Responsive Layouts** |

---

## 📁 Project Directory Structure

```text
ClaimNest/
├── backend/                         # PHP Backend & Database
│   ├── api/
│   │   ├── dashboard.php            # Summary counts & metrics API
│   │   ├── purchases.php            # Purchases CRUD API with date logic
│   │   ├── claims.php               # Claims management API (Return/Repair/Replacement)
│   │   └── reports.php              # Category aggregations & expiring lists API
│   ├── config/
│   │   ├── db.php                   # MySQL PDO connection with password fallback
│   │   ├── cors.php                 # Cross-Origin Resource Sharing (CORS) header helper
│   │   └── init_db.php              # One-click database initializer script
│   ├── uploads/                     # Storage folder for uploaded invoices / receipts
│   └── database.sql                 # SQL schema & realistic sample seed data
│
├── frontend/                        # React Frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Top navigation bar with active route highlighting
│   │   │   ├── Footer.jsx           # Semantic footer with academic project info
│   │   │   ├── StatCard.jsx         # Metric card with color accents
│   │   │   └── StatusBadge.jsx      # Color-coded pills (Active, Expiring Soon, Expired)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Summary cards & recently added purchases
│   │   │   ├── AddPurchase.jsx      # Add/Edit form with live date calculations & presets
│   │   │   ├── PurchasesList.jsx    # Table of purchases with search, filters & details modal
│   │   │   ├── ClaimTracker.jsx     # Return/Repair requests & inline status workflow
│   │   │   └── Reports.jsx          # Category breakdown, CSS bar chart & deadline alerts
│   │   ├── utils/
│   │   │   └── dateUtils.js         # JavaScript date math (days remaining, formatting)
│   │   ├── config/
│   │   │   └── api.js               # Clean fetch-based API service layer
│   │   ├── App.jsx                  # React Router configuration & page shell
│   │   ├── App.css                  # Student-friendly styling & CSS chart rules
│   │   ├── index.css                # CSS variables, color scheme, resets
│   │   └── main.jsx                 # React root mounting & Bootstrap import
│   ├── index.html                   # HTML5 page skeleton with meta tags
│   ├── package.json                 # React dependencies
│   └── vite.config.js               # Vite build configuration
│
├── VIVA_GUIDE.md                    # Comprehensive college viva Q&A document
└── README.md                        # Project documentation & setup instructions
```

---

## 🚀 Setup & Execution Guide

### Prerequisites
1. **XAMPP** (with Apache and MySQL enabled)
2. **Node.js** (v18 or newer)
3. Web browser (Chrome, Edge, Firefox)

---

### Step 1: Start MySQL in XAMPP
1. Open the **XAMPP Control Panel**.
2. Click **Start** next to **MySQL**.
3. (Optional) Click **Start** next to **Apache** if you wish to run PHP through Apache.

---

### Step 2: Initialize the Database (`claimnest_db`)

There are two easy ways to set up the database:

#### Method A: Terminal Command (Fastest)
From the project folder, run:
```powershell
& "C:\xampp\php\php.exe" backend/config/init_db.php
```
*This automatically creates `claimnest_db` and seeds sample purchases and claims.*

#### Method B: phpMyAdmin
1. Open your browser and go to `http://localhost/phpmyadmin`.
2. Click the **Import** tab.
3. Choose the file `ClaimNest/backend/database.sql` and click **Go**.

---

### Step 3: Start the PHP Backend Server

Run PHP's built-in web server from the project directory on port `8000`:
```powershell
# From the project root (ClaimNest/)
& "C:\xampp\php\php.exe" -S localhost:8000 -t backend
```
*Your backend APIs will be active at `http://localhost:8000/api/`.*

---

### Step 4: Start the React Frontend

Open a new terminal window in the `frontend` directory:
```powershell
cd frontend
npm install
npm run dev
```
*The React app will be live at `http://localhost:5173/`.*

---

## 📱 Application Pages & Key Features

### 1. Dashboard (`/`)
- Shows **Total Purchases**, **Deadlines Approaching (&le; 7 days)**, **Open Claims**, and **Expired Warranties**.
- Fetches real-time counts from MySQL.
- Displays a table of the 5 most recently added purchases with calculated days remaining.
- Features quick links to file claims or add new items.

### 2. Add / Edit Purchase (`/add-purchase` & `/edit-purchase/:id`)
- Simple form with Product Name, Category, Store/Seller, Price, Purchase Date, Return Deadline, Warranty Expiry, Receipt file, and Notes.
- **Client-Side Validation:** Prevents return or warranty dates earlier than the purchase date; verifies positive prices.
- **Quick Preset Buttons:** `+7 days`, `+15 days`, `+30 days` for return deadlines; `+1 Year`, `+2 Years` for warranties.
- **Live Preview Banner:** Calculates and displays remaining days in real time as the user selects dates.

### 3. My Purchases (`/purchases`)
- Full table of recorded purchases with live status badges (**Active**, **Expiring Soon**, **Expired**).
- **Search bar:** Filter items by product or store name.
- **Category & Status Dropdowns:** View specific categories or expiring items.
- **Actions:** View full details in a modal, edit an existing record, or delete with confirmation.

### 4. Claim Tracker (`/claims`)
- Record return, replacement, or repair requests linked to any registered purchase.
- **Business Rule Check:** Warns the user if the selected purchase does not have an invoice attached so they include their ticket reference number.
- **Inline Status Transition:** Update claim states between `Pending`, `Submitted`, `In Progress`, `Resolved`, and `Rejected` directly from the table.

### 5. Summary & Reports (`/reports`)
- **Purchases by Category:** Tabular breakdown of item counts, total expenditure (₹), and percentage share.
- **CSS Bar Chart:** Pure HTML/CSS proportional bar visual showing volume distribution without heavy third-party libraries.
- **Upcoming Deadlines Table:** Filtered list of products whose return window closes within 7 days.
- **Expired Warranties Table:** Filtered list showing products past manufacturer coverage.

---

## 💡 Core Business Logic Rules

1. **Days Remaining Formula:**
   $$\text{Days Remaining} = \frac{\text{Target Date (midnight)} - \text{Today's Date (midnight)}}{1000 \times 60 \times 60 \times 24}$$
2. **Status Determination:**
   - $\text{Days} < 0 \implies \textbf{Expired}$
   - $0 \le \text{Days} \le 7 \implies \textbf{Expiring Soon}$
   - $\text{Days} > 7 \implies \textbf{Active}$
3. **Date Sequence Rule:**
   - $\text{Return Deadline} \ge \text{Purchase Date}$
   - $\text{Warranty Expiry} \ge \text{Purchase Date}$
4. **Relational Integrity:**
   - In MySQL, `claims.purchase_id` has a foreign key to `purchases.id` with `ON DELETE CASCADE`. If a purchase is removed, its dependent claims are automatically cleaned up.

---

## 🎓 College Viva Guide
Refer to [VIVA_GUIDE.md](./VIVA_GUIDE.md) for clear answers to likely viva examination questions asked by college examiners.
