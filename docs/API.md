# API Design — Urban Furniture

## 1. Overview

The backend exposes REST APIs for authentication, master data, transactions,
payments, accounting, and reports.

Base URL:

```text
/api
```

All protected APIs require a valid JWT token.

---

# 2. Authentication APIs

## Login

```text
POST /api/auth/login
```

Purpose:
Authenticates a user and returns a JWT token.

Request:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Response:

```json
{
  "token": "jwt_token",
  "user": {
    "id": 1,
    "name": "Admin",
    "role": "admin"
  }
}
```

---

# 3. Contact APIs

## Get Contacts

```text
GET /api/contacts
```

Returns the list of contacts.

## Get Contact

```text
GET /api/contacts/:id
```

Returns one contact using its ID. *(Note: `:id` is a URL parameter, e.g., `/api/contacts/5` where `5` is the contact's primary key ID).*

## Create Contact

```text
POST /api/contacts
```

Creates a new customer/vendor contact.

## Update Contact

```text
PUT /api/contacts/:id
```

Updates an existing contact.

## Archive Contact

```text
DELETE /api/contacts/:id
```

Archives/removes a contact from active records.

---

# 4. Product APIs

```text
GET /api/products
GET /api/products/:id
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id
```

These APIs manage product master data.

---

# 5. Account APIs

```text
GET /api/accounts
GET /api/accounts/:id
POST /api/accounts
PUT /api/accounts/:id
DELETE /api/accounts/:id
```

These APIs manage the Chart of Accounts.

---

# 6. Journal APIs

```text
GET /api/journals
GET /api/journals/:id
POST /api/journals
PUT /api/journals/:id
DELETE /api/journals/:id
```

These APIs manage accounting journals.

---

# 7. Sales Order APIs

```text
GET /api/sales-orders
GET /api/sales-orders/:id
POST /api/sales-orders
PUT /api/sales-orders/:id
```

Purpose:

Creates and manages customer sales orders.

A Sales Order contains:

- Customer
- Products
- Quantity
- Unit Price
- Tax
- Total

---

# 8. Purchase Order APIs

```text
GET /api/purchase-orders
GET /api/purchase-orders/:id
POST /api/purchase-orders
PUT /api/purchase-orders/:id
```

Purpose:

Creates and manages purchase orders placed with vendors.

---

# 9. Invoice APIs

```text
GET /api/invoices
GET /api/invoices/:id
POST /api/invoices
PUT /api/invoices/:id
```

Purpose:

Manages customer invoices and vendor bills.

Invoice type:

- `CUSTOMER_INVOICE`
- `VENDOR_BILL`

---

# 10. Payment APIs

```text
GET /api/payments
GET /api/payments/:id
POST /api/payments
```

Purpose:

Records payments made to vendors or received from customers.

Payment methods:

- Cash
- Bank

When a payment is recorded, the system updates the related invoice/bill
status and creates the required accounting entry.

---

# 11. Journal Entry APIs

```text
GET /api/journal-entries
GET /api/journal-entries/:id
POST /api/journal-entries
```

Purpose:

Creates and retrieves accounting journal entries.

Each journal entry contains debit and credit lines.

Business Rule:

`Total Debit must equal Total Credit.`

---

# 12. Budget APIs

```text
GET /api/budgets
GET /api/budgets/:id
POST /api/budgets
PUT /api/budgets/:id
DELETE /api/budgets/:id
```

Purpose:

Creates and manages business budgets.

---

# 13. Report APIs

## Profit & Loss

```text
GET /api/reports/profit-loss
```

Returns income, expenses and calculated profit/loss.

## Balance Sheet

```text
GET /api/reports/balance-sheet
```

Returns:

- Assets
- Liabilities
- Capital

The accounting relationship must remain:

`Assets = Liabilities + Capital`

## Budget Report

```text
GET /api/reports/budget
```

Returns planned and actual budget information.

---

# 14. Dashboard API

```text
GET /api/dashboard
```

Returns summarized business information for the dashboard.

Possible metrics include:

- Total Sales
- Total Purchases
- Total Receivables
- Total Payables
- Total Payments
- Profit/Loss

---

# 15. Authentication and Authorization

Protected APIs require:

```text
Authorization: Bearer <JWT_TOKEN>
```

The backend verifies the JWT before processing protected requests.

Access is controlled according to user role.

### Admin / Business Owner

Full access to business operations and reports.

### Accountant

Access to master data, transactions and reports according to the
requirements.

### Contact User

Can access only their own invoices/bills and payment functionality.

---

# 16. API Request Flow

```text
Frontend
   ↓
REST API
   ↓
Express Route
   ↓
Authentication / Authorization
   ↓
Controller
   ↓
Business Logic
   ↓
PostgreSQL
   ↓
Response
```

---

# 17. API Error Handling

The API should return appropriate HTTP status codes.

Examples:

- `200` → Successful request
- `201` → Resource created
- `400` → Invalid request/data
- `401` → Authentication required/invalid token
- `403` → User does not have permission
- `404` → Resource not found
- `500` → Internal server error

Errors should return a clear message without exposing sensitive information.
