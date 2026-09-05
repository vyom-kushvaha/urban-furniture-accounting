# Database Schema & Modular ER Diagrams — Urban Furniture

To ensure 100% readability and clarity, the database ER diagram is broken down into 5 focused core module diagrams below.

---

## 1. Master Data ERD (Core Entities)

Stores users, customer/vendor contacts, product catalog, chart of accounts, and accounting journals.

```mermaid
erDiagram
    USERS {
        int id PK
        string name
        string email UK
        string password_hash
        string role
        timestamp created_at
    }

    CONTACTS {
        int id PK
        string name
        string type
        string email
        string mobile
        int user_id FK,UK
        boolean is_active
    }

    PRODUCTS {
        int id PK
        string name
        string type
        decimal sales_price
        decimal purchase_price
        string category
    }

    ACCOUNTS {
        int id PK
        string account_code UK
        string account_name
        string type
    }

    JOURNALS {
        int id PK
        string code UK
        string name
        string type
        int default_account_id FK
    }

    USERS ||--o| CONTACTS : "user_id"
    ACCOUNTS ||--o{ JOURNALS : "default_account_id"
```

---

## 2. Sales & Invoicing Workflow ERD

Manages customer sales orders, line items, customer invoices, and invoice line items.

```mermaid
erDiagram
    CONTACTS {
        int id PK
        string name
        string type
    }

    PRODUCTS {
        int id PK
        string name
        decimal sales_price
    }

    SALES_ORDERS {
        int id PK
        string order_number UK
        int contact_id FK
        date order_date
        string status
        decimal total_amount
    }

    SALES_ORDER_ITEMS {
        int id PK
        int sales_order_id FK
        int product_id FK
        int quantity
        decimal unit_price
        decimal tax_amount
        decimal subtotal
    }

    INVOICES {
        int id PK
        string invoice_number UK
        int contact_id FK
        int sales_order_id FK
        date invoice_date
        date due_date
        decimal total_amount
        decimal paid_amount
        string status
    }

    INVOICE_ITEMS {
        int id PK
        int invoice_id FK
        int product_id FK
        int quantity
        decimal unit_price
        decimal tax_amount
        decimal subtotal
    }

    CONTACTS ||--o{ SALES_ORDERS : "contact_id"
    SALES_ORDERS ||--|{ SALES_ORDER_ITEMS : "sales_order_id"
    PRODUCTS ||--o{ SALES_ORDER_ITEMS : "product_id"

    CONTACTS ||--o{ INVOICES : "contact_id"
    SALES_ORDERS ||--o| INVOICES : "sales_order_id"
    INVOICES ||--|{ INVOICE_ITEMS : "invoice_id"
    PRODUCTS ||--o{ INVOICE_ITEMS : "product_id"
```

---

## 3. Purchase & Vendor Bills Workflow ERD

Manages vendor purchase orders, vendor bills, and line item breakdowns.

```mermaid
erDiagram
    CONTACTS {
        int id PK
        string name
        string type
    }

    PRODUCTS {
        int id PK
        string name
        decimal purchase_price
    }

    PURCHASE_ORDERS {
        int id PK
        string po_number UK
        int vendor_id FK
        date order_date
        string status
        decimal total_amount
    }

    PURCHASE_ORDER_ITEMS {
        int id PK
        int purchase_order_id FK
        int product_id FK
        int quantity
        decimal unit_price
        decimal subtotal
    }

    BILLS {
        int id PK
        string bill_number UK
        int vendor_id FK
        int purchase_order_id FK
        date bill_date
        date due_date
        decimal total_amount
        decimal paid_amount
        string status
    }

    BILL_ITEMS {
        int id PK
        int bill_id FK
        int product_id FK
        int quantity
        decimal unit_price
        decimal subtotal
    }

    CONTACTS ||--o{ PURCHASE_ORDERS : "vendor_id"
    PURCHASE_ORDERS ||--|{ PURCHASE_ORDER_ITEMS : "purchase_order_id"
    PRODUCTS ||--o{ PURCHASE_ORDER_ITEMS : "product_id"

    CONTACTS ||--o{ BILLS : "vendor_id"
    PURCHASE_ORDERS ||--o| BILLS : "purchase_order_id"
    BILLS ||--|{ BILL_ITEMS : "bill_id"
    PRODUCTS ||--o{ BILL_ITEMS : "product_id"
```

---

## 4. Payments & Double-Entry Accounting ERD

Manages payments against customer invoices or vendor bills, and links to automated journal entries and ledger lines.

```mermaid
erDiagram
    INVOICES {
        int id PK
        string invoice_number
        decimal total_amount
        string status
    }

    BILLS {
        int id PK
        string bill_number
        decimal total_amount
        string status
    }

    PAYMENTS {
        int id PK
        string payment_number UK
        int invoice_id FK
        int bill_id FK
        int contact_id FK
        decimal amount
        string payment_method
        date payment_date
    }

    JOURNALS {
        int id PK
        string code UK
        string name
        string type
    }

    JOURNAL_ENTRIES {
        int id PK
        string entry_number UK
        int journal_id FK
        string reference
        date entry_date
        string status
    }

    JOURNAL_ENTRY_LINES {
        int id PK
        int journal_entry_id FK
        int account_id FK
        decimal debit
        decimal credit
    }

    ACCOUNTS {
        int id PK
        string account_code UK
        string account_name
        string type
    }

    INVOICES ||--o{ PAYMENTS : "invoice_id"
    BILLS ||--o{ PAYMENTS : "bill_id"

    JOURNALS ||--o{ JOURNAL_ENTRIES : "journal_id"
    JOURNAL_ENTRIES ||--|{ JOURNAL_ENTRY_LINES : "journal_entry_id"
    ACCOUNTS ||--o{ JOURNAL_ENTRY_LINES : "account_id"
```

---

## 5. Budgets & Analytical Management ERD

Manages planned budget allocations linked to accounts and responsible users.

```mermaid
erDiagram
    USERS {
        int id PK
        string name
        string role
    }

    ACCOUNTS {
        int id PK
        string account_code UK
        string account_name
        string type
    }

    BUDGETS {
        int id PK
        string name
        date start_date
        date end_date
        int responsible_user_id FK
        int account_id FK
        decimal planned_amount
    }

    USERS ||--o{ BUDGETS : "responsible_user_id"
    ACCOUNTS ||--o{ BUDGETS : "account_id"
```
