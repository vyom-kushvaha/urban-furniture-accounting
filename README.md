# 🏢 Urban Furniture Accounting System

> **An Integrated Odoo-style Double-Entry Accounting & ERP System for Urban Furniture**  
> Developed for the **Odoo Hackathon 2026** at Infocity, Gandhinagar.

---

## 📌 Problem Statement Overview

Urban Furniture requires a single connected accounting workflow system to replace fragmented spreadsheets. The system handles end-to-end financial operations:

**Master Data ➔ Purchase / Sales Orders ➔ Vendor Bills / Invoices ➔ Payments ➔ Auto Journal Entries ➔ Financial Reports**

---

## 📚 Technical Documentation Index

All architectural and system design specifications are standardized in the [`docs/`](file:///v:/odoo/urban-furniture-accounting/docs) directory:

| Document | Description | Path |
|---|---|---|
| 📋 **Requirements** | Functional & non-functional requirements | [`docs/REQUIREMENTS.md`](file:///v:/odoo/urban-furniture-accounting/docs/REQUIREMENTS.md) |
| 🏗️ **Architecture** | System components, module decomposition, & tech stack | [`docs/ARCHITECTURE.md`](file:///v:/odoo/urban-furniture-accounting/docs/ARCHITECTURE.md) |
| 🗄️ **Database Schema** | PostgreSQL tables, ERD, indexes, & constraints | [`docs/DATABASE.md`](file:///v:/odoo/urban-furniture-accounting/docs/DATABASE.md) |
| 🔌 **API Design** | RESTful endpoints, payloads, & status codes | [`docs/API.md`](file:///v:/odoo/urban-furniture-accounting/docs/API.md) |
| ⚡ **Business Logic** | Workflows, double-entry validation (`Debit = Credit`), RBAC | [`docs/BUSINESS_LOGIC.md`](file:///v:/odoo/urban-furniture-accounting/docs/BUSINESS_LOGIC.md) |
| 🔒 **Security Architecture** | JWT authentication, bcrypt hashing, & scope checks | [`docs/SECURITY.md`](file:///v:/odoo/urban-furniture-accounting/docs/SECURITY.md) |
| 🎨 **UI Flow & Wireframes** | Screen hierarchy, ASCII mockups, & user navigation | [`docs/UI_FLOW.md`](file:///v:/odoo/urban-furniture-accounting/docs/UI_FLOW.md) |

---

## ⚡ Core Modules & Features

* 📇 **Master Data Management**: Contacts (Customers/Vendors), Products/Services, Chart of Accounts, Journals, Budgets.
* 🧾 **Sales & Purchase Workflows**:
  * Sales Order ➔ Customer Invoice ➔ Payment Collection
  * Purchase Order ➔ Vendor Bill ➔ Payment Disbursal
* ⚖️ **Double-Entry Accounting Engine**:
  * Automatic Journal Entries (Draft ➔ Posted)
  * Real-time Debit/Credit Ledger Balance Validation ($\text{Total Debit} = \text{Total Credit}$)
* 📊 **Financial Reporting**:
  * Profit & Loss (P&L) Statement
  * Balance Sheet ($\text{Assets} = \text{Liabilities} + \text{Capital}$)
  * Budget vs Actual Spending Analysis
* 🔐 **Role-Based Access Control (RBAC)**: Admin, Accountant, Contact User.
* 👁️ **Reticle Performance Verification**: Integrated runtime perception and performance auditing.

---

## 🚀 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Relational DB with foreign key constraints)
- **Authentication**: JWT (JSON Web Tokens) & bcrypt password hashing
- **Testing & Verification**: Reticle (`@reticlehq/server`, `@reticlehq/react`)

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

### Environment Setup
1. Copy environment template:
   ```bash
   cp .env.example .env
   ```
2. Configure database credentials in `.env`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
