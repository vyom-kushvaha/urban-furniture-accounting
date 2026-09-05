# Business Logic & Workflows — Urban Furniture Accounting

## Overview

Business Logic defines the core system rules. While CRUD operations manage data insertion and updates, business logic governs automated calculations, status transitions, double-entry validation, role-based security, and financial reporting across the system workflow.

---

## 1. Sales Workflow & Logic

Example: Sale of **5 chairs × ₹2,000 = ₹10,000**.

```text
Sales Order
   ↓
Customer + Product + Qty + Price
   ↓
Total Calculation
   ↓
Invoice Generation
```

### Business Rules:
- Quantity must be strictly greater than 0 (`quantity > 0`).
- Product must exist in the database.
- Customer contact must exist.
- Order totals are automatically calculated by the system.

---

## 2. Invoice Calculation Logic

Invoice Example:
```text
Subtotal (5 × ₹2,000) = ₹10,000
Tax                   = ₹1,800
Total                 = ₹11,800
```

### Business Rules:
```text
Subtotal + Tax = Total
```
- The backend automatically calculates Subtotal, Tax, and Total amount.
- Users do not manually input final calculated amounts, preventing manual accounting errors.

---

## 3. Payment Processing Logic

Example: Customer pays against an invoice of ₹11,800.

### Case A: Full Payment (₹11,800 received)
```text
Invoice Total = ₹11,800
Payment       = ₹11,800

Status → PAID
```

### Case B: Partial Payment (₹5,000 received)
```text
Invoice Total = ₹11,800
Paid Amount   = ₹5,000
Remaining     = ₹6,800

Status → PARTIALLY PAID
```

### Business Rules:
- Payment amount cannot exceed remaining invoice balance.
- Invoice status automatically updates upon payment registration (`PAID`, `PARTIALLY PAID`, `UNPAID`).

---

## 4. Purchase Workflow & Logic

Urban Furniture purchases goods from vendor:

```text
Vendor
  ↓
Purchase Order
  ↓
Goods Received
  ↓
Vendor Bill
  ↓
Payment
```

Example: **10 chairs × ₹1,500 = ₹15,000**.
Vendor Bill = ₹15,000. Upon complete payment, Vendor Bill status updates to `PAID`.

---

## 5. Accounting Entry Logic ⭐ (Double-Entry Core)

When payment of ₹11,800 is received for customer invoice:

```text
Debit   Cash / Bank      ₹11,800
Credit  Sales / Income   ₹10,000
Credit  Tax              ₹1,800
```

### Strict Validation Rule:
```text
Total Debit = Total Credit
```
- Total Debit (₹11,800) must equal Total Credit (₹10,000 + ₹1,800).
- If Total Debit ≠ Total Credit, the system **rejects** the Journal Entry.

---

## 6. Profit & Loss (P&L) Calculation Logic

```text
Net Profit = Total Income - Total Expenses
```

Example:
```text
Sales Revenue      ₹1,00,000
Purchases            ₹60,000
Operating Expenses   ₹10,000
----------------------------
Net Profit           ₹30,000
```
- Values are aggregated directly from posted transaction and accounting records.

---

## 7. Balance Sheet Logic

```text
Assets = Liabilities + Capital
```

Example:
```text
Assets      ₹5,00,000
Liabilities ₹2,00,000
Capital     ₹3,00,000

Equation: ₹5,00,000 = ₹2,00,000 + ₹3,00,000
```
- Maintains double-entry accounting integrity across Assets, Liabilities, and Equity.

---

## 8. Budget Tracking Logic

Example:
```text
Planned Budget  = ₹1,00,000
Actual Expense  = ₹75,000
Remaining       = ₹25,000
```
- Tracks actual spent amounts against analytic accounts and planned budget limits in real time.

---

## 9. Role-Based Access Control (RBAC) Logic

### Roles & Permissions:
- **Admin / Owner**: Full access to create, modify, archive, view all transactions, master data, and financial reports.
- **Accountant**: Access to master data, sales/purchase transactions, journal entries, and financial reports.
- **Contact User**: Access strictly limited to their own invoices/bills and payment details.

### RBAC Enforcement Rule:
If a `Contact User` attempts to call restricted APIs (e.g., `GET /api/reports/profit-loss`):
```text
❌ 403 Forbidden - Access Denied
```

---

## 10. CRUD vs Business Logic Summary

| Aspect | CRUD Operations | Business Logic |
|---|---|---|
| **Focus** | How data is stored & retrieved | Business rules & workflow enforcement |
| **Examples** | Create/Update contact, fetch product list | Tax calculation, payment status, journal entry balance |
| **Integrity** | Data formatting & schema constraints | Double-entry accounting (`Debit = Credit`), RBAC, financial formulas |

> **Evaluation Note:**
> Master data uses CRUD operations, while business transactions strictly follow core business rules—including automated tax and total calculations, payment status updates, double-entry journal balance checks, and real-time report aggregation.
