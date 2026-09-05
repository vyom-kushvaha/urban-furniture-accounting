# Urban Furniture Accounting System
## System Architecture

---

## 1. Architecture Overview

The Urban Furniture Accounting System is designed as a modular web application
that integrates master data, sales, purchases, payments, accounting, budgeting,
and financial reporting into a single system.

The architecture separates the presentation layer, application/business logic,
and data layer while keeping closely related accounting modules within the
same application.

### High-Level Flow

```text
User
 ↓
Frontend
 ↓
REST API
 ↓
Backend
 ↓
PostgreSQL Database
```

The system follows a **modular monolithic architecture**.

This allows modules such as Sales, Purchase, Payment, Accounting, Budget and
Reporting to remain logically separated while sharing common business data
and transactional operations.

---

# 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML5 | Application structure |
| Styling | CSS3 + Bootstrap | Responsive and consistent UI |
| Client-side Logic | JavaScript | UI interactions and API communication |
| Charts | Chart.js | Dashboard visualizations |
| Backend | Node.js | Server-side JavaScript runtime |
| Web Framework | Express.js | REST API and request handling |
| API | REST | Communication between frontend and backend |
| Database | PostgreSQL | Relational business and accounting data |
| Database Driver | pg | PostgreSQL communication from Node.js |
| Authentication | JWT | User authentication |
| Password Security | bcrypt | Password hashing |
| PDF Generation | PDFKit | Invoice and report PDF generation |

---

# 3. Why These Technologies Were Selected

## 3.1 Node.js + Express.js

The application contains multiple interconnected business operations exposed
through APIs.

Node.js provides the server-side runtime, while Express.js provides a
lightweight structure for creating REST APIs and organizing business modules.

This combination allows the backend to remain modular and easy to extend.

---

## 3.2 PostgreSQL

The system contains strongly related data such as:

- Contacts
- Products
- Sales Orders
- Purchase Orders
- Invoices
- Vendor Bills
- Payments
- Accounts
- Journal Entries
- Budgets

A relational database is appropriate for maintaining these relationships.

PostgreSQL also provides transaction support which is important for financial
operations where multiple database changes must succeed together.

---

## 3.3 REST API

REST APIs provide a clear separation between the frontend and backend.

The frontend is responsible for presenting information and collecting user
input, while the backend is responsible for processing requests and applying
business rules.

Example:

```text
Frontend
   ↓
POST /api/invoices
   ↓
Backend
   ↓
Database
```

---

## 3.4 JWT Authentication

JWT is used to authenticate users when accessing protected APIs.

After successful login, the server provides an authentication token.

Protected requests include the token so that the backend can identify the
authenticated user and apply role-based authorization.

---

## 3.5 bcrypt

Passwords must not be stored as plain text.

bcrypt is used to generate secure password hashes which are stored instead of
the original passwords.

---

## 3.6 Bootstrap

Bootstrap provides reusable UI components for:

* Navigation
* Forms
* Tables
* Cards
* Buttons
* Modals
* Responsive layouts

This helps maintain a consistent interface throughout the application.

---

## 3.7 Chart.js

Chart.js is used to represent business and accounting information visually.

Examples include:

* Sales overview
* Purchase overview
* Budget achievement
* Income and expense summaries

---

## 3.8 PDFKit

PDFKit is used for generating printable documents from actual application data.

Examples:

* Customer Invoices
* Vendor Bills
* Profit & Loss Reports
* Balance Sheet
* Budget Reports

---

# 4. Architectural Style

## Modular Monolith

The application will use a modular monolithic architecture.

```text
Urban Furniture Application
│
├── Authentication
├── Master Data
├── Sales
├── Purchase
├── Payments
├── Accounting
├── Budget
├── Reports
└── Dashboard
```

All modules run within one backend application but maintain separate
responsibilities.

### Why Modular Monolith?

The modules are highly interconnected.

For example:

```text
Sales
  ↓
Invoice
  ↓
Payment
  ↓
Journal Entry
  ↓
Financial Reports
```

Keeping these operations within one application simplifies communication
between modules while maintaining a clear internal structure.

The modular structure also allows additional functionality to be introduced
without redesigning the entire application.

---

# 5. Layered Architecture

The application is divided into three major layers.

```text
┌──────────────────────────────┐
│          FRONTEND            │
│ HTML / CSS / JavaScript      │
└──────────────┬───────────────┘
               │
            REST API
               │
┌──────────────▼───────────────┐
│           BACKEND            │
│ Node.js + Express            │
│                              │
│ Routes                       │
│ Controllers                  │
│ Business Logic               │
│ Authentication               │
│ Validation                   │
└──────────────┬───────────────┘
               │
          PostgreSQL
               │
┌──────────────▼───────────────┐
│          DATABASE            │
│ Business + Accounting Data   │
└──────────────────────────────┘
```

---

# 6. Frontend Architecture

The frontend provides the user interface.

```text
frontend/
│
├── pages/
├── css/
├── js/
└── assets/
```

## Responsibilities

The frontend will:

* Display application screens
* Collect user input
* Perform basic client-side validation
* Call REST APIs
* Display API responses
* Display tables and forms
* Display dashboard information
* Display reports
* Display charts
* Provide navigation between modules

The frontend will not be responsible for critical accounting decisions.

Financial business rules will be enforced by the backend.

---

# 7. Backend Architecture

The backend contains the application's business logic.

```text
backend/
│
├── config/
├── routes/
├── controllers/
├── models/
├── middleware/
└── utils/
```

### Routes

Routes define the API endpoints exposed by the application.

Example:

```text
GET  /api/contacts
POST /api/contacts

GET  /api/products
POST /api/products

POST /api/sales
POST /api/purchases

POST /api/invoices
POST /api/bills

POST /api/payments

GET  /api/reports/profit-loss
GET  /api/reports/balance-sheet
```

### Controllers

Controllers receive API requests and coordinate the required business
operations.

Example:

```text
Request
   ↓
Route
   ↓
Controller
   ↓
Business Logic
   ↓
Database
```

### Models

Models provide the data-access layer used to interact with PostgreSQL.

### Middleware

Middleware handles common operations such as:

* Authentication
* Authorization
* Request validation

### Utils

Utility functions contain reusable functionality such as:

* Accounting calculations
* PDF generation
* Validation helpers

---

# 8. Database Architecture

PostgreSQL will store the application's persistent data.

Major data groups include:

```text
Users
Contacts
Products
Chart of Accounts
Journals
Analytic Accounts
Budgets
Sales Orders
Purchase Orders
Invoices
Vendor Bills
Payments
Journal Entries
Journal Entry Lines
```

The database will use relationships between these entities rather than
duplicating the same information across multiple records.

---

# 9. Core Business Modules

## 9.1 Authentication

Responsible for:

* Login
* User authentication
* Password verification
* JWT generation
* Role-based authorization

---

## 9.2 Contact Management

Responsible for:

* Customers
* Vendors
* Customer/Vendor contacts
* Contact information
* Contact portal access

Contacts are reused by Sales, Purchase, Invoice, Bill and Payment modules.

---

## 9.3 Product Management

Responsible for:

* Product creation
* Product categories
* Product type
* Sales price
* Purchase price

Products are reused by Sales and Purchase transactions.

---

## 9.4 Accounting Configuration

Responsible for:

* Chart of Accounts
* Journals
* Analytic Accounts

These records provide the accounting configuration required by financial
transactions.

---

## 9.5 Sales

```text
Customer
   ↓
Sales Order
   ↓
Customer Invoice
   ↓
Payment
   ↓
Journal Entry
```

The Sales module handles sales orders, invoice generation and customer
payments.

---

## 9.6 Purchase

```text
Vendor
   ↓
Purchase Order
   ↓
Vendor Bill
   ↓
Payment
   ↓
Journal Entry
```

The Purchase module handles purchase orders, vendor bills and vendor payments.

---

## 9.7 Payments

Payments are linked to their corresponding invoices or bills.

The payment process updates:

* Paid amount
* Amount due
* Payment status
* Accounting entries

Supported payment methods:

* Cash
* Bank

---

# 10. Accounting Architecture

Accounting is integrated with business transactions.

The system follows double-entry accounting.

Every posted journal entry must satisfy:

```text
Total Debit = Total Credit
```

---

## 10.1 Sales Accounting

When a customer invoice is confirmed:

```text
Customer Invoice
       ↓
Journal Entry

Debit  → Debtor Account
Credit → Sales Income Account
```

---

## 10.2 Purchase Accounting

When a vendor bill is confirmed:

```text
Vendor Bill
       ↓
Journal Entry

Debit  → Purchase Expense Account
Credit → Creditor Account
```

---

## 10.3 Customer Payment

When payment is received:

```text
Customer Payment
       ↓
Journal Entry

Debit  → Cash / Bank
Credit → Debtor Account
```

---

## 10.4 Vendor Payment

When payment is made to a vendor:

```text
Vendor Payment
       ↓
Journal Entry

Debit  → Creditor Account
Credit → Cash / Bank
```

---

# 11. Transaction Processing

Financial operations that require multiple related database changes will use
database transactions.

Example:

```text
Create Invoice
      ↓
Create Invoice Items
      ↓
Create Journal Entry
      ↓
Create Journal Entry Lines
      ↓
Commit Transaction
```

If a critical operation fails:

```text
Rollback
```

This helps prevent incomplete accounting records.

---

# 12. Budget Architecture

Budget management is connected with Analytic Accounts and financial
transactions.

```text
Analytic Account
       ↓
Budget
       ↓
Sales / Purchase Transactions
       ↓
Achieved Amount
       ↓
Budget Report
```

The system calculates budget achievement from actual transactions within the
defined budget period.

---

# 13. Reporting Architecture

Reports are generated from actual accounting and transaction records.

```text
PostgreSQL
     ↓
Journal Entries / Transactions
     ↓
Report Calculation
     ↓
Backend API
     ↓
Frontend
```

Supported reports:

* Profit & Loss
* Balance Sheet
* Budget Report

---

## 13.1 Profit & Loss

The P&L report uses Income and Expense accounts.

```text
Net Income = Total Income - Total Expenses
```

---

## 13.2 Balance Sheet

The Balance Sheet groups financial information into:

* Assets
* Liabilities
* Capital

The system maintains the accounting relationship:

```text
Assets = Liabilities + Capital
```

---

## 13.3 Budget Report

The Budget Report uses:

* Budget
* Analytic Account
* Committed Amount
* Achieved Amount
* Remaining Amount
* Achievement Percentage

---

# 14. Dashboard Architecture

The dashboard retrieves live information through backend APIs.

```text
PostgreSQL
     ↓
Backend
     ↓
Dashboard APIs
     ↓
JavaScript
     ↓
Chart.js / KPI Cards
```

Dashboard information may include:

* Sales
* Purchases
* Income
* Expenses
* Budget achievement
* Outstanding payments
* Transaction statuses

The dashboard will be based on current database records rather than
hardcoded statistics.

---

# 15. Authentication & Authorization

The system uses two levels of access control.

### Authentication

Determines:

> Who is the user?

### Authorization

Determines:

> What is the user allowed to do?

Example:

```text
Login
  ↓
JWT
  ↓
Authentication Middleware
  ↓
Role Check
  ↓
Requested API
```

Roles include:

```text
Administrator
Accountant
Contact User
```

Authorization checks will be performed on the backend.

---

# 16. Data Integrity

Data integrity is important because the system manages financial information.

The application will use:

* Required fields
* Unique constraints
* Foreign key relationships
* Input validation
* Debit/Credit validation
* Payment amount validation
* Database transactions
* Status validation

Example:

```text
Payment Amount > Amount Due
             ↓
          Reject
```

Another example:

```text
Debit ≠ Credit
     ↓
Cannot Post
```

---

# 17. Error Handling

The backend will return structured responses for successful and failed
operations.

Example:

```json
{
  "success": false,
  "message": "Payment amount cannot exceed amount due"
}
```

The frontend will display an appropriate message to the user.

Errors should not expose sensitive implementation details.

---

# 18. API Communication Pattern

A consistent REST API structure will be used.

Example:

```text
GET     /api/contacts
POST    /api/contacts
PUT     /api/contacts/:id
DELETE  /api/contacts/:id

GET     /api/products
POST    /api/products
PUT     /api/products/:id

POST    /api/sales
POST    /api/purchases

POST    /api/invoices
POST    /api/bills

POST    /api/payments

GET     /api/reports/profit-loss
GET     /api/reports/balance-sheet
GET     /api/reports/budget
```

The exact endpoints may be refined during implementation.

---

# 19. Security Architecture

Security controls include:

* Password hashing using bcrypt
* JWT-based authentication
* Backend authorization
* Role-based access control
* Protected APIs
* Input validation
* Parameterized SQL queries
* Environment variables for sensitive configuration

Sensitive information such as database credentials and JWT secrets will not
be stored directly in source code.

---

# 20. Maintainability

The system separates responsibilities between modules.

For example:

```text
Sales
Purchase
Payment
Accounting
Budget
Reports
```

Each module has its own routes, controllers and data-access logic.

This makes it easier to:

* Debug individual modules
* Add new features
* Modify business rules
* Reuse existing APIs
* Maintain the application

---

# 21. Requirement-to-Architecture Mapping

| Requirement | Architectural Solution |
|---|---|
| Contact Management | Contact module + PostgreSQL |
| Product Management | Product module + PostgreSQL |
| Sales Workflow | Sales + Invoice + Payment modules |
| Purchase Workflow | Purchase + Bill + Payment modules |
| Accounting | Journal Entry + Account modules |
| Double-entry validation | Backend accounting logic |
| Budget Management | Budget + Analytic Account modules |
| Financial Reports | Backend report calculation |
| User Roles | JWT + Role Authorization |
| Invoice/Bill PDF | PDFKit |
| Dashboard | REST APIs + Chart.js |
| Data Integrity | PostgreSQL constraints + validation + transactions |
| Secure Passwords | bcrypt |
| Frontend/Backend separation | REST API |

---

# 22. Technology Decision Summary

The selected technologies directly support the functional requirements of the
system.

```text
HTML/CSS/JavaScript
        ↓
     Bootstrap
        ↓
     REST API
        ↓
Node.js + Express
        ↓
   PostgreSQL
```

Additional technologies:

```text
JWT + bcrypt  → Authentication & Security
Chart.js      → Dashboard Visualization
PDFKit        → Document Generation
pg            → PostgreSQL Connectivity
```

The architecture focuses on clear separation of responsibilities, reliable
financial data processing, maintainable modules, and real-time reporting from
actual system data.
