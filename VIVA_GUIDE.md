# ClaimNest — College Viva & Project Defense Guide

This document contains expected questions from external examiners, professors, and lab evaluators for the **ClaimNest** project, along with simple and clear answers organized by the five units of the Web Programming syllabus.

---

## 🎯 High-Level Project Overview (Elevator Pitch)

> **Question: Can you briefly explain what your project ClaimNest does?**
>
> **Answer:**  
> "ClaimNest is a purchase return and warranty tracker web application. When a user buys a product, they enter the purchase date, return deadline, and warranty expiry date. ClaimNest automatically calculates the remaining days and classifies items as **Active**, **Expiring Soon** (within 7 days), or **Expired**. It also allows users to file and track service, replacement, or return claims with real-time status transitions. The frontend is built in **ReactJS (Vite)** with Bootstrap for responsive layout, while the backend uses **PHP** and **MySQL** with PDO and prepared statements for secure data storage."

---

## 📑 Unit I: Web Basics, HTML5 & CSS3

### Q1: Which semantic HTML5 elements did you use in your project and why?
**Answer:**  
We used semantic elements instead of plain `<div>` tags to improve accessibility, maintainability, and search engine readability:
- `<header>`: Encapsulates the top branding and navigation bar.
- `<nav>`: Wraps the application navigation links (`NavLink`).
- `<main>`: Contains the primary route page content (`Dashboard`, `My Purchases`, etc.).
- `<footer>`: Encapsulates copyright and college lab details.
- `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`: Renders structured tabular data for purchases and claims.
- `<form>`, `<input>`, `<select>`, `<textarea>`: Captures user input cleanly.

### Q2: What is the CSS Box Model, and where is it visible in ClaimNest?
**Answer:**  
The CSS Box Model consists of:
1. **Content:** The actual text or element (e.g., product title or price).
2. **Padding:** Clear area inside the border (e.g., `padding: 20px;` inside `.app-card`).
3. **Border:** Line surrounding the padding (e.g., `border: 1px solid #cbd5e1;` on cards and tables).
4. **Margin:** Space outside the border separating adjacent elements (e.g., `margin-bottom: 24px;` on page headers).
We use `box-sizing: border-box;` globally in `index.css` so that padding and borders are included in the element's total width and height, preventing unexpected horizontal overflow.

### Q3: How did you implement the Category Distribution Bar Chart on the Reports page without external libraries?
**Answer:**  
We created a lightweight CSS bar chart:
1. In `Reports.jsx`, we compute the maximum count among categories.
2. For each category, we calculate its percentage:  
   $$\text{widthPercent} = \text{Math.round}\left(\frac{\text{count}}{\text{maxCount}} \times 100\right)$$
3. We render a background container `div` (`.chart-bar-bg`) and an inner filled `div` (`.chart-bar-fill`) with an inline style: `style={{ width: `${widthPercent}%` }}`.
4. CSS handles the rounded borders and smooth transitions. This avoids loading heavy chart libraries and keeps the application fast and easy to explain.

---

## ⚡ Unit II: Client-Side JavaScript

### Q4: How is the number of days remaining calculated in JavaScript?
**Answer:**  
In `frontend/src/utils/dateUtils.js`:
```javascript
export function calculateDaysRemaining(targetDateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset today's time to midnight

  const target = new Date(targetDateString);
  target.setHours(0, 0, 0, 0); // Reset target time to midnight

  const diffInMs = target.getTime() - today.getTime();
  const msInOneDay = 1000 * 60 * 60 * 24; // 86,400,000 ms
  return Math.round(diffInMs / msInOneDay);
}
```
**Key Point for Viva:** Resetting hours, minutes, and seconds to `0, 0, 0, 0` ensures the calculation only compares whole calendar days and avoids timezone and partial-day boundary bugs.

### Q5: What client-side validation rules are implemented before sending data to PHP?
**Answer:**  
In `AddPurchase.jsx`, before sending an HTTP request:
1. Checks that required fields (`product_name`, `category`, `seller_name`) are not blank.
2. Validates that `purchase_price` is a valid positive number using `parseFloat()` and `!isNaN()`.
3. Date sequencing check:  
   - `return_deadline` cannot be earlier than `purchase_date`.  
   - `warranty_expiry` cannot be earlier than `purchase_date`.
If any check fails, a descriptive error message is shown and the `fetch()` call is prevented.

### Q6: How does the search and filter mechanism work on the "My Purchases" page?
**Answer:**  
In `PurchasesList.jsx`:
- The server returns all or category-filtered purchases.
- As the user types in the search input, React triggers `onChange={(e) => setSearchTerm(e.target.value)}`.
- We use the JavaScript `.filter()` array method to check if `product_name.toLowerCase()` or `seller_name.toLowerCase()` includes the search query in real time.

---

## 🐘 Unit III: PHP Backend & MySQL Connectivity

### Q7: Why did you use PHP PDO instead of `mysqli` or standard SQL queries?
**Answer:**  
1. **Database Portability:** PDO (PHP Data Objects) works across multiple databases (MySQL, PostgreSQL, SQLite) with the same method calls.
2. **Prepared Statements:** PDO separates SQL query structure from user data, preventing SQL Injection vulnerabilities.
3. **Exception Handling:** PDO provides `PDO::ERRMODE_EXCEPTION`, enabling clean `try-catch` blocks and structured JSON error responses.

### Q8: How do prepared statements prevent SQL Injection in your PHP API?
**Answer:**  
In `backend/api/purchases.php`:
```php
$stmt = $pdo->prepare("SELECT * FROM purchases WHERE id = :id");
$stmt->execute([':id' => $id]);
```
Instead of concatenating user input directly into the SQL string (`"WHERE id = " . $_GET['id']`), the query template is compiled first by the database engine. User input is sent separately as a parameterized value `:id`. Even if a user enters malicious SQL syntax like `' OR 1=1 --`, it is treated strictly as plain literal text and cannot alter the query structure.

### Q9: What is CORS and why is `backend/config/cors.php` necessary?
**Answer:**  
**CORS** stands for **Cross-Origin Resource Sharing**.  
- The React frontend runs on `http://localhost:5173`.  
- The PHP backend API runs on `http://localhost:8000`.  
Because the ports are different, web browsers enforce the Same-Origin Policy and block API requests unless the server explicitly permits them.  
In `cors.php`, we send:
```php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
```
It also responds with HTTP `200` to browser pre-flight `OPTIONS` requests.

### Q10: Explain the MySQL database schema and relationships.
**Answer:**  
Our database is named `claimnest_db` with two normalized tables:
1. `purchases`: Stores `id` (Primary Key), `product_name`, `category`, `purchase_date`, `purchase_price`, `seller_name`, `return_deadline`, `warranty_expiry`, `receipt_filename`, `notes`.
2. `claims`: Stores `id` (Primary Key), `purchase_id` (Foreign Key referencing `purchases.id`), `request_type` (`Return`, `Replacement`, `Repair`), `problem_description`, `request_date`, `evidence_notes`, `claim_status`.
- We configured `CONSTRAINT fk_purchase_claim FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE`. If a purchase is deleted, its related claim records are automatically deleted by MySQL to preserve referential integrity.

---

## ⚛️ Unit IV: ReactJS Components, Props & Hooks

### Q11: What is a Functional Component and how do you pass data using Props?
**Answer:**  
A Functional Component is a JavaScript function that accepts an object argument called `props` and returns JSX representing the user interface.  
For example, our `StatusBadge.jsx`:
```jsx
export default function StatusBadge({ status, customText }) {
  const badgeClass = status.toLowerCase().replace(/\s+/g, '-');
  return <span className={`status-badge ${badgeClass}`}>{customText || status}</span>;
}
```
Here, `status` and `customText` are destructured props passed from parent components like `Dashboard.jsx` or `PurchasesList.jsx`.

### Q12: What is the difference between State and Props?
**Answer:**  
- **Props (Properties):** Immutable data passed from a parent component down to a child component (read-only).
- **State:** Mutable data managed inside the component itself using `useState()`. When state changes, React re-renders the component to reflect the new data.

---

## 🔄 Unit V: React Dataflow, Lifecycle & Routing

### Q13: How does `useEffect` work and what does the empty dependency array `[]` mean?
**Answer:**  
`useEffect` lets components perform side-effects, such as fetching data from an external API or setting timers:
```jsx
useEffect(() => {
  loadPurchases();
}, []);
```
- The second argument `[]` is the **dependency array**.  
- When given an empty array `[]`, the effect runs **only once** after the component is first mounted into the DOM (equivalent to `componentDidMount` in older class components).  
- If dependencies are passed, like `[selectedCategory]`, the effect re-runs whenever `selectedCategory` changes.

### Q14: How does React Router handle navigation without reloading the entire page?
**Answer:**  
In `App.jsx`, we wrap routes with `<BrowserRouter>`.  
When a user clicks a `<NavLink to="/claims">`, React Router uses the HTML5 `History API` (`window.history.pushState`) to update the browser URL in the address bar without triggering a full page reload. It then renders the matching route component (`<ClaimTracker />`) instantly inside `<main>`.

### Q15: How does the React frontend communicate with the PHP backend?
**Answer:**  
We use the native browser `fetch()` API configured in `frontend/src/config/api.js`:
1. React makes an asynchronous HTTP request (e.g., `fetch('http://localhost:8000/api/purchases.php')`).
2. The PHP backend receives the request, queries MySQL using PDO, formats the result into an associative array, and calls `json_encode($data)`.
3. React receives the JSON stream, parses it via `await response.json()`, and updates component state with `setPurchases(result.data)`.
4. React automatically updates the DOM to display the new data.

---

## 🏆 Summary Checklist for Viva Demonstration

When presenting to the examiner:
1. **Show Dashboard:** Point out the 4 metric cards (Total Purchases, Deadlines Approaching, Open Claims, Expired Warranties). Explain that these numbers come from `backend/api/dashboard.php` via real SQL queries.
2. **Add a Product:** Fill the form, click the `+15 days` and `+1 Year` preset buttons to demonstrate client-side date helpers, and click **Save Purchase**. Show the immediate redirect and the new row appearing in **My Purchases**.
3. **Filter & Search:** Type the product name in the search bar and filter by status. Click **View** to open the modal.
4. **File a Claim:** File a claim for an existing item and demonstrate changing the status (e.g., from `Pending` to `In Progress`) via the inline dropdown.
5. **Open Reports:** Show the category expenditure table, the pure CSS bar chart, and upcoming return deadlines (&le; 7 days).
6. **Show MySQL:** Open phpMyAdmin or terminal to prove data is permanently saved in the `purchases` and `claims` tables in MySQL.
