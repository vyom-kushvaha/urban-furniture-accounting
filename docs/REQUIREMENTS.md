# Urban Furniture Accounting System
## Requirements Document

## 1. Project Overview

Urban Furniture Accounting System is an integrated accounting and business management
application for managing customers, vendors, products, sales, purchases, payments,
accounting entries, budgets and financial reports.

The system should connect the complete business workflow:

Master Data
→ Sales / Purchase
→ Invoice / Bill
→ Payment
→ Journal Entry
→ Financial Reports

The system should use real transaction data for accounting and reporting rather than
static or hardcoded values.

---

# 2. User Roles

## 2.1 Administrator

The Administrator has complete access to the system.

Permissions:

- Create, modify and archive master data
- Manage users
- Manage customers and vendors
- Manage products
- Manage Chart of Accounts
- Manage Journals
- Manage Analytic Accounts
- Manage Budgets
- Record sales and purchases
- Manage invoices and bills
- Record payments
- Create/manage journal entries
- View financial reports

---

## 2.2 Accountant / Invoicing User

The Accountant can:

- Create and manage master data
- Manage customers/vendors
- Manage products
- Record sales transactions
- Record purchase transactions
- Create and manage invoices/bills
- Record payments
- Access accounting dashboard
- Create/manage journal entries
- View financial reports
- Manage budgets where permitted

---

## 2.3 Contact User

A Contact User is a customer/vendor portal user.

The Contact User can:

- Login to the system
- View only their own invoices/bills
- See paid/unpaid status
- View amount due
- Pay outstanding dues
- Logout
- Reset password

A Contact User must not be able to access other customers' financial records.

---

# 3. Authentication & User Management

## 3.1 Login

The system must provide a login page with:

- Login ID
- Password
- Sign In
- Sign Up
- Forgot Password

Invalid credentials should show:

"Invalid Login Id or Password"

---

## 3.2 User Creation

Administrator can create users with:

- Name
- Login ID
- Email ID
- Role
- Password
- Re-enter Password

Supported roles:

- Administrator
- Accountant
- User / Contact User

---

## 3.3 Sign Up

Public Sign Up should create an Invoicing User / User account according to
the configured signup flow.

Validation:

- Login ID must be unique
- Login ID must contain 6–12 characters
- Email must be unique
- Password must be more than 8 characters
- Password must contain lowercase character
- Password must contain uppercase character
- Password must contain a special character

---

# 4. Contact Master

The system must allow users with appropriate permissions to create and manage contacts.

Fields:

- Contact Name
- Contact Type
  - Customer
  - Vendor
  - Both
- Email
- Phone / Mobile
- Profile Image
- Street
- City
- State
- Country
- Pincode

Requirements:

- Email must be unique
- Contact should be reusable in Sales, Purchase, Invoice, Bill and Payment
- Contact list should support search
- Contact list should open a form when a record is selected
- New button should open a blank contact form
- Contact records should support List View
- Contact records should support Kanban View

---

# 5. Product Master

The system must allow creation and management of products.

Fields:

- Product Name
- Category
- Sales Price
- Cost / Purchase Price
- Product Image
- Product Type

Product Types:

- Goods
- Service
- Combo

Requirements:

- Category can be created while creating a product
- Product must be selectable in Sales and Purchase transactions
- Product should support List View
- Product should support Kanban View
- Product details should be editable

---

# 6. Analytic Account

Analytic Accounts are used to track income and expenses for a specific
project, department or business area.

Fields:

- Analytic Account Name
- Type
  - Income
  - Expense

Requirements:

- Analytic Account should be selectable in transaction lines
- Sales invoice lines should support Income analytic accounts
- Purchase/vendor bill lines should support Expense analytic accounts
- Analytic information should be used in Budget calculations
- Analytic records should support List and Kanban views

---

# 7. Chart of Accounts

The system must maintain a Chart of Accounts for classifying financial transactions.

Account Types include:

### Balance Sheet Accounts

- Asset
- Liability
- Bank
- Cash
- Capital

### Profit & Loss Accounts

- Income
- Expense
- Other Expense

Important pre-configured accounts include:

- Bank Account
- Cash Account
- Debtors Account
- Creditors Account
- Sales Income Account
- Purchase Expense Account
- Capital Account

Each account must have an Account Type.

The Account Type determines how the account is treated and where it appears
in financial reports.

Transactions must be connected to the Chart of Accounts.

---

# 8. Journals

The system must provide journals for grouping accounting transactions.

Default journals:

| Journal | Type | Default Account |
|---|---|---|
| Sales | Sales | Sales Income Account |
| Purchase | Purchase | Purchase Expense Account |
| Bank | Bank | Bank Account |
| Cash | Cash | Cash Account |

Requirements:

- Journal Name
- Journal Type
- Default Account
- Journal Type should be selected from configured journal types
- Default Account should be selected from Chart of Accounts

---

# 9. Journal Entries

Journal Entries represent the actual accounting records generated from
financial transactions.

Fields:

- Accounting Date
- Journal
- Reference / Number
- Partner
- Account
- Debit
- Credit

Requirements:

- Journal Entry must contain Debit and Credit lines
- Debit and Credit totals must always match before posting
- System must block posting of an unbalanced journal entry
- Partner should be selectable from Contact Master
- Account should be selectable from Chart of Accounts
- Journal should be selectable from Journals
- Journal Entries should have statuses such as:
  - Draft
  - Posted
  - Cancelled

---

# 10. Purchase Order

The system must allow users to create Purchase Orders.

Fields:

- PO Number
- Vendor
- PO Date
- Payment Terms
- Product
- Budget Analytic
- Quantity
- Unit Price
- Total

Requirements:

- PO Number should be automatically generated sequentially
- Vendor must come from Contact Master
- Product must come from Product Master
- Budget Analytic must come from Analytic Accounts
- Total = Quantity × Unit Price
- Purchase Order should support confirmation
- Vendor Bill should be creatable from a confirmed Purchase Order

Example:

10 Chairs × ₹3,000 = ₹30,000

---

# 11. Vendor Bill

The system must support Vendor Bills.

Fields:

- Vendor Bill Number
- Vendor
- Bill Reference
- Status
- Bill Date
- Due Date
- Product
- Chart of Account
- Budget Analytic
- Quantity
- Unit Price
- Total

Requirements:

- Bill Number should be automatically generated sequentially
- Vendor should come from Contact Master
- Product and pricing should be fetched when Bill is created from Purchase Order
- Original Purchase Order should be accessible from the Bill when applicable
- Bill can also be created directly without a Purchase Order
- Total = Quantity × Unit Price
- Amount Due = Total - Amount Paid
- Payment can be made through Cash or Bank
- Bill should support confirmation
- Bill should support cancellation

---

# 12. Purchase Accounting

When a Vendor Bill is confirmed:

- A Purchase Journal Entry must be created
- Purchase Account should be used as the default Purchase account
- The Journal Entry should be visible in Journal Entries
- The Journal Entry must always be balanced

Example:

Purchase of ₹10,000:

Debit:
Purchase Account = ₹10,000

Credit:
Creditor Account = ₹10,000

---

# 13. Sales Order

The system must allow users to create Sales Orders.

Fields:

- SO Number
- Customer
- SO Date
- Product
- Chart of Account
- Budget Analytic
- Quantity
- Unit Price
- Total

Requirements:

- SO Number should be automatically generated sequentially
- Customer should come from Contact Master
- Product should come from Product Master
- Budget Analytic should come from Analytic Accounts
- Total = Quantity × Unit Price
- Customer Invoice should be creatable from Sales Order

---

# 14. Customer Invoice

The system must support Customer Invoices.

Fields:

- Invoice Number
- Customer
- Invoice Reference
- Status
- Invoice Date
- Due Date
- Product
- Chart of Account
- Budget Analytic
- Quantity
- Unit Price
- Total

Requirements:

- Invoice Number should be automatically generated sequentially
- Customer should come from Contact Master
- Product and pricing should be fetched when Invoice is created from Sales Order
- Original Sales Order should be accessible when applicable
- Invoice can also be created directly
- Total = Quantity × Unit Price
- Amount Due = Total - Amount Paid
- Payment can be received through Cash or Bank
- Invoice should support confirmation
- Invoice should support cancellation

---

# 15. Sales Accounting

When a Customer Invoice is confirmed:

- A Sales Journal Entry must be created
- Sales Account should be used as the default Sales account
- The Journal Entry should be visible in Journal Entries
- The Journal Entry must always be balanced

Example:

Sale of ₹10,000:

Debit:
Debtor Account = ₹10,000

Credit:
Sales Account = ₹10,000

---

# 16. Payment

The system must support payments for Vendor Bills and Customer Invoices.

Payment fields:

- Payment Type
  - Send
  - Receive
- Partner
- Amount
- Date
- Payment Via
  - Bank
  - Cash
- Note

Requirements:

- Partner should be automatically populated from the Invoice/Bill
- Amount should be automatically populated with Amount Due
- Date should default to the current date
- Payment Via should default to Bank
- User should be able to select Cash
- Payment should update the related Invoice/Bill
- Amount Due should be reduced after payment
- Fully paid Invoice/Bill should show Paid status
- Partial payment should show remaining due amount

---

# 17. Invoice/Bill Printing and Sending

The system should provide:

- Print Invoice/Bill
- Send Invoice/Bill
- PDF generation

---

# 18. Contact User Portal

Contact Users should have a restricted portal.

The portal should display:

- Invoice Number
- Invoice Date
- Due Date
- Amount Due
- Status

Requirements:

- Contact can view only their own invoices
- Paid invoices should show Paid
- Unpaid invoices should provide Pay Now
- Successful payment should update Invoice status to Paid
- Contact User should not access other customers' invoices

---

# 19. Budget Management

The system must support budget creation and management.

Budget fields:

- Budget Name
- Budget Period
- Start Date
- End Date
- Analytic Account
- Type
  - Income
  - Expense
- Committed Amount
- Responsible Person
- Revision Of
- Achieved Amount

---

## 19.1 Budget Status

Budget workflow:

- Draft
- Confirmed
- Revised
- Cancelled

Requirements:

- New Budget can be created
- Budget can be confirmed
- Confirmed Budget can be revised
- Budget can be cancelled/archived
- Revised Budget must link to the original Budget
- Original Budget must link to the revised Budget
- Revised budget name should retain the original name and add "Revised"

Example:

Project A

becomes:

Project A Revised

---

## 19.2 Budget Calculation

For confirmed budgets:

### Achieved Amount

For Income:

Total of relevant Sales Invoices using the same Analytic Account
within the Budget Period.

For Expense:

Total of relevant Vendor Bills using the same Analytic Account
within the Budget Period.

### Achieved %

Achieved Amount / Committed Amount × 100

### Amount To Achieve

Committed Amount - Achieved Amount

The Achieved Amount should be clickable and should open the related
Invoices/Bills used for the calculation.

---

# 20. Budget Reports

Budget Report should provide:

- Budget Name
- Start Date
- End Date
- Status
- Achieved Amount
- Remaining / Balance
- Pie Chart / visual representation

The Budget Report should support:

- List View
- Kanban View
- Opening the Budget Form from a record

Reports should use actual budget and transaction data.

---

# 21. Profit & Loss Report

The system must generate a Profit & Loss Report.

The report should display:

- Income
- Income from Sales
- Expenses
- Purchase Expense
- Other Expense
- Net Income

Calculations:

### Income

Total of accounts with Account Type = Income

### Income from Sales

Total of Sales Income Account

### Expenses

Total of Expense accounts

### Purchase Expense

Total of Purchase Expense Account

### Other Expense

Total of Other Expense accounts

### Net Income

Income - Expenses

Requirements:

- Report should be based on actual Journal Entries
- User should be able to select reporting period/year
- Report should be printable
- PDF download should be available

---

# 22. Balance Sheet

The system must generate a Balance Sheet.

Sections:

### Assets

- Bank
- Cash
- Debtors
- Other Assets

### Liabilities

- Creditors
- Other Liabilities

### Capital

- Capital Account

Requirements:

- Total Assets should match Total Liabilities + Capital
- Data should come from actual accounting records
- User should be able to select reporting period/year
- Report should be printable
- PDF download should be available

---

# 23. Dashboard

The system should provide an accounting dashboard.

Dashboard may display:

- Sales
- Purchase
- Accounts
- Reports
- Budget information
- Transaction status
- Draft/Confirmed records
- Budget status

The dashboard should use live data from the database.

---

# 24. Search & Views

Master and transaction modules should support appropriate views.

Required views:

- List View
- Form View
- Kanban View where specified

Requirements:

- New button opens a blank form
- Clicking an existing record opens its form
- Search should be available where required
- Records should be filterable where useful

---

# 25. Data Relationships

The system must maintain relationships between records.

Examples:

Contact
→ Sales Order
→ Customer Invoice
→ Payment
→ Journal Entry

Contact
→ Purchase Order
→ Vendor Bill
→ Payment
→ Journal Entry

Product
→ Sales/Purchase Lines

Analytic Account
→ Invoice/Bill Lines
→ Budget

Chart of Account
→ Journal Entry

Journal
→ Journal Entry

---

# 26. System Validation

The system must validate important business rules.

Examples:

- Duplicate Email should not be allowed
- Duplicate Login ID should not be allowed
- Invalid password should be rejected
- Required fields must be completed
- Quantity must be valid
- Amounts must be valid
- Debit and Credit must balance before posting
- Payment cannot exceed applicable amount due
- Correct Customer/Vendor must be linked
- Reports must use actual transaction data

---

# 27. Automatic Computations

The system should automatically calculate:

- Line Total = Quantity × Unit Price
- Invoice Total
- Bill Total
- Amount Due
- Paid Amount
- Budget Achieved Amount
- Budget Achieved Percentage
- Budget Amount To Achieve
- Profit / Net Income
- Financial report totals

---

# 28. Core End-to-End Workflows

## Purchase Workflow

Vendor
→ Purchase Order
→ Confirm
→ Vendor Bill
→ Confirm
→ Purchase Journal Entry
→ Payment
→ Updated Amount Due / Paid Status

---

## Sales Workflow

Customer
→ Sales Order
→ Confirm
→ Customer Invoice
→ Confirm
→ Sales Journal Entry
→ Receive Payment
→ Updated Amount Due / Paid Status

---

## Budget Workflow

Create Budget
→ Draft
→ Confirm
→ Track Transactions
→ Calculate Achieved Amount
→ Calculate Achieved %
→ Revise / Cancel if required
→ Generate Budget Report

---

# 29. MVP Priority for Hackathon

## P0 — Mandatory Working Demo

These must work reliably:

- Login
- User roles
- Contacts
- Products
- Chart of Accounts
- Journals
- Sales Order
- Customer Invoice
- Purchase Order
- Vendor Bill
- Payment
- Automatic Journal Entries
- Debit/Credit validation
- Profit & Loss
- Balance Sheet

## P1 — Important Differentiators

- Analytic Accounts
- Budget Management
- Budget calculations
- Budget revision
- Contact User Portal
- PDF generation
- Dashboard
- Search and filters
- Better role-based permissions

## P2 — Polish / If Time Allows

- Advanced dashboard visuals
- Kanban improvements
- Advanced filtering
- Email sending
- Additional UI polish
- Additional reports

---

# 30. Non-Functional Requirements

The system should be:

- Easy to use
- Reliable during the demo
- Consistent across modules
- Secure according to user roles
- Based on real database records
- Maintainable
- Responsive enough for normal business usage

---

# 31. Demo Goal

The final system should demonstrate at least two complete scenarios:

### Scenario 1 — Sales to Payment

Customer
→ Sales Order
→ Invoice
→ Payment
→ Journal Entry
→ Updated P&L / Balance Sheet

### Scenario 2 — Purchase to Payment

Vendor
→ Purchase Order
→ Vendor Bill
→ Payment
→ Journal Entry
→ Updated accounting reports

If time permits, demonstrate:

Budget
→ Analytic Account
→ Transactions
→ Achieved Amount
→ Budget Report
