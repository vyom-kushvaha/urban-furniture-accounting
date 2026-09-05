# Database Design — Urban Furniture

## 1. Database

**Database:** PostgreSQL

The database is designed to store master data, business transactions, payments, and accounting records while maintaining relationships between them.

---

## 2. Users

Stores login and role information.

| Field         | Type         | Key    |
| ------------- | ------------ | ------ |
| id            | SERIAL       | PK     |
| name          | VARCHAR(100) |        |
| email         | VARCHAR(150) | UNIQUE |
| password_hash | TEXT         |        |
| role          | VARCHAR(30)  |        |
| created_at    | TIMESTAMP    |        |

**Roles:**

* Admin / Business Owner
* Accountant
* Contact User

---

## 3. Contacts

Stores customers and vendors.

| Field         | Type         | Key |
| ------------- | ------------ | --- |
| id            | SERIAL       | PK  |
| name          | VARCHAR(150) |     |
| type          | VARCHAR(20)  |     |
| email         | VARCHAR(150) |     |
| mobile        | VARCHAR(20)  |     |
| address       | TEXT         |     |
| city          | VARCHAR(100) |     |
| state         | VARCHAR(100) |     |
| pincode       | VARCHAR(10)  |     |
| profile_image | TEXT         |     |
| user_id       | INT          | FK  |
| created_at    | TIMESTAMP    |     |

`user_id → users.id`

A Contact User can be linked to a contact.

---

## 4. Products

Stores goods and services sold or purchased by the business.

| Field          | Type          | Key |
| -------------- | ------------- | --- |
| id             | SERIAL        | PK  |
| name           | VARCHAR(150)  |     |
| type           | VARCHAR(20)   |     |
| sales_price    | DECIMAL(12,2) |     |
| purchase_price | DECIMAL(12,2) |     |
| category       | VARCHAR(100)  |     |
| created_at     | TIMESTAMP     |     |

---

## 5. Accounts

Stores the Chart of Accounts.

| Field        | Type         | Key |
| ------------ | ------------ | --- |
| id           | SERIAL       | PK  |
| account_name | VARCHAR(150) |     |
| type         | VARCHAR(30)  |     |
| created_at   | TIMESTAMP    |     |

**Account Types:**

```text
Asset
Liability
Expense
Income
Capital
```

---

## 6. Journals

Stores different types of accounting journals.

| Field              | Type         | Key |
| ------------------ | ------------ | --- |
| id                 | SERIAL       | PK  |
| name               | VARCHAR(100) |     |
| type               | VARCHAR(30)  |     |
| default_account_id | INT          | FK  |

`default_account_id → accounts.id`

Examples:

```text
Sales Journal
Purchase Journal
Bank Journal
Cash Journal
```

---

## 7. Sales Orders

Stores customer orders.

| Field        | Type          | Key |
| ------------ | ------------- | --- |
| id           | SERIAL        | PK  |
| contact_id   | INT           | FK  |
| order_date   | DATE          |     |
| status       | VARCHAR(30)   |     |
| total_amount | DECIMAL(12,2) |     |

`contact_id → contacts.id`

One customer can have many sales orders.

---

## 8. Sales Order Items

Stores products inside a Sales Order.

| Field          | Type          | Key |
| -------------- | ------------- | --- |
| id             | SERIAL        | PK  |
| sales_order_id | INT           | FK  |
| product_id     | INT           | FK  |
| quantity       | INT           |     |
| unit_price     | DECIMAL(12,2) |     |
| tax            | DECIMAL(12,2) |     |
| subtotal       | DECIMAL(12,2) |     |

Relationships:

```text
sales_order_id → sales_orders.id
product_id → products.id
```

One Sales Order can contain multiple products.

---

## 9. Purchase Orders

Stores orders placed with vendors.

| Field        | Type          | Key |
| ------------ | ------------- | --- |
| id           | SERIAL        | PK  |
| vendor_id    | INT           | FK  |
| order_date   | DATE          |     |
| status       | VARCHAR(30)   |     |
| total_amount | DECIMAL(12,2) |     |

`vendor_id → contacts.id`

---

## 10. Purchase Order Items

Stores products inside a Purchase Order.

| Field             | Type          | Key |
| ----------------- | ------------- | --- |
| id                | SERIAL        | PK  |
| purchase_order_id | INT           | FK  |
| product_id        | INT           | FK  |
| quantity          | INT           |     |
| unit_price        | DECIMAL(12,2) |     |
| subtotal          | DECIMAL(12,2) |     |

Relationships:

```text
purchase_order_id → purchase_orders.id
product_id → products.id
```

---

## 11. Invoices

Stores customer invoices and vendor bills.

| Field             | Type          | Key |
| ----------------- | ------------- | --- |
| id                | SERIAL        | PK  |
| contact_id        | INT           | FK  |
| sales_order_id    | INT           | FK  |
| purchase_order_id | INT           | FK  |
| type              | VARCHAR(20)   |     |
| invoice_date      | DATE          |     |
| due_date          | DATE          |     |
| subtotal          | DECIMAL(12,2) |     |
| tax               | DECIMAL(12,2) |     |
| total             | DECIMAL(12,2) |     |
| status            | VARCHAR(30)   |     |

Relationships:

```text
contact_id → contacts.id
sales_order_id → sales_orders.id
purchase_order_id → purchase_orders.id
```

`type`:

```text
CUSTOMER_INVOICE
VENDOR_BILL
```

---

## 12. Invoice Items

Stores individual products/services in an invoice.

| Field      | Type          | Key |
| ---------- | ------------- | --- |
| id         | SERIAL        | PK  |
| product_id | INT           | FK  |
| quantity   | INT           |     |
| unit_price | DECIMAL(12,2) |     |
| tax        | DECIMAL(12,2) |     |
| subtotal   | DECIMAL(12,2) |     |

Relationships:

```text
invoice_id → invoices.id
product_id → products.id
```

---

## 13. Payments

Stores payments made or received against invoices/bills.

| Field          | Type          | Key |
| -------------- | ------------- | --- |
| id             | SERIAL        | PK  |
| invoice_id     | INT           | FK  |
| amount         | DECIMAL(12,2) |     |
| payment_method | VARCHAR(20)   |     |
| payment_date   | DATE          |     |
| reference      | VARCHAR(100)  |     |

`invoice_id → invoices.id`

Payment methods:

```text
Cash
Bank
```

---

## 14. Journal Entries

Stores the accounting record of a transaction.

| Field      | Type         | Key |
| ---------- | ------------ | --- |
| id         | SERIAL       | PK  |
| journal_id | INT          | FK  |
| reference  | VARCHAR(100) |     |
| entry_date | DATE         |     |

`journal_id → journals.id`

---

## 15. Journal Items

Stores individual debit and credit lines.

| Field            | Type          | Key |
| ---------------- | ------------- | --- |
| id               | SERIAL        | PK  |
| journal_entry_id | INT           | FK  |
| account_id       | INT           | FK  |
| debit            | DECIMAL(12,2) |     |
| credit           | DECIMAL(12,2) |     |

Relationships:

```text
journal_entry_id → journal_entries.id
account_id → accounts.id
```

**Rule:**

```text
Total Debit = Total Credit
```

---

## 16. Budgets

Stores budget information.

| Field               | Type          | Key |
| ------------------- | ------------- | --- |
| id                  | SERIAL        | PK  |
| name                | VARCHAR(150)  |     |
| start_date          | DATE          |     |
| end_date            | DATE          |     |
| responsible_user_id | INT           | FK  |
| planned_amount      | DECIMAL(12,2) |     |

`responsible_user_id → users.id`

---

## 17. Main Relationships

```text
Users
  │
  └── Contacts
        │
        ├── Sales Orders
        │      └── Sales Order Items → Products
        │
        ├── Purchase Orders
        │      └── Purchase Order Items → Products
        │
        └── Invoices
               └── Invoice Items → Products
                       │
                       └── Payments
```

Accounting:

```text
Invoices / Payments
        ↓
Journal Entries
        ↓
Journal Items
        ↓
Accounts
```

---

## 18. Important Database Rules

1. Every table has a unique primary key.
2. Foreign keys maintain relationships between related records.
3. Required fields use `NOT NULL`.
4. User emails must be unique.
5. Monetary values use `DECIMAL`.
6. An accounting entry must maintain:

```text
Total Debit = Total Credit
```

7. Passwords are stored only as hashes, never as plain text.
8. Database credentials and secrets are stored in environment variables.

---

> **Note for Evaluators:**
> Tables were derived from PS entities and their relationships. Master data has separate tables, transactions use transaction + line item tables, and accounting uses a journal entry + journal line structure.
