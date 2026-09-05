-- ====================================================================
-- Urban Furniture Accounting & ERP System
-- PostgreSQL Relational Database Schema Definition
-- ====================================================================

-- Drop existing tables in reverse dependency order if needed
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS journal_entry_lines CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS journals CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bill_items CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS sales_order_items CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- ====================================================================
-- 1. USERS TABLE
-- Purpose: Stores login credentials and authorization roles for the system.
-- ====================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'contact' CHECK (role IN ('admin', 'accountant', 'contact')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Stores login authentication credentials and system role permissions.';
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password string.';


-- ====================================================================
-- 2. CONTACTS TABLE
-- Purpose: Stores customers and vendors. Optionally linked to a user account.
-- ====================================================================
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('customer', 'vendor', 'both')),
    email VARCHAR(150),
    mobile VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    profile_image TEXT,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE contacts IS 'Master data for customers and vendors. user_id links a contact to login credentials.';


-- ====================================================================
-- 3. PRODUCTS TABLE
-- Purpose: Master catalog of goods and services bought or sold by Urban Furniture.
-- ====================================================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('goods', 'service', 'combo')),
    sales_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (sales_price >= 0),
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (purchase_price >= 0),
    category VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE products IS 'Master catalog of physical furniture items and services.';


-- ====================================================================
-- 4. SALES ORDERS TABLE
-- Purpose: Customer orders header record.
-- ====================================================================
CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    contact_id INT NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled', 'invoiced')),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sales_orders IS 'Sales order header referencing customer contact.';


-- ====================================================================
-- 5. SALES ORDER ITEMS TABLE
-- Purpose: Line items inside a customer sales order.
-- ====================================================================
CREATE TABLE sales_order_items (
    id SERIAL PRIMARY KEY,
    sales_order_id INT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0)
);

COMMENT ON TABLE sales_order_items IS 'Line items linking sales orders with products and quantities.';


-- ====================================================================
-- 6. INVOICES TABLE
-- Purpose: Customer invoices generated from confirmed sales orders or direct billing.
-- ====================================================================
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    contact_id INT NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    sales_order_id INT REFERENCES sales_orders(id) ON DELETE SET NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE invoices IS 'Customer invoices recording receivable accounts.';


-- ====================================================================
-- 7. INVOICE ITEMS TABLE
-- Purpose: Individual line items recorded on customer invoices.
-- ====================================================================
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0)
);

COMMENT ON TABLE invoice_items IS 'Individual product line items billed on a customer invoice.';


-- ====================================================================
-- 8. PURCHASE ORDERS TABLE
-- Purpose: Orders placed with vendors to procure raw materials or finished furniture.
-- ====================================================================
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id INT NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled', 'billed')),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE purchase_orders IS 'Purchase order headers placed with vendors.';


-- ====================================================================
-- 9. PURCHASE ORDER ITEMS TABLE
-- Purpose: Line items inside a purchase order.
-- ====================================================================
CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0)
);

COMMENT ON TABLE purchase_order_items IS 'Individual product line items requested from a vendor.';


-- ====================================================================
-- 10. BILLS TABLE
-- Purpose: Vendor bills payable for goods/services received.
-- ====================================================================
CREATE TABLE bills (
    id SERIAL PRIMARY KEY,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id INT NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    purchase_order_id INT REFERENCES purchase_orders(id) ON DELETE SET NULL,
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE bills IS 'Vendor bills recording payable liabilities.';


-- ====================================================================
-- 11. BILL ITEMS TABLE
-- Purpose: Individual line items on a vendor bill.
-- ====================================================================
CREATE TABLE bill_items (
    id SERIAL PRIMARY KEY,
    bill_id INT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0)
);

COMMENT ON TABLE bill_items IS 'Line items billed by vendors.';


-- ====================================================================
-- 12. PAYMENTS TABLE
-- Purpose: Records financial payments made or received against invoices or bills.
-- ====================================================================
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id INT REFERENCES invoices(id) ON DELETE SET NULL,
    bill_id INT REFERENCES bills(id) ON DELETE SET NULL,
    contact_id INT NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'bank')),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_payment_target CHECK (
        (invoice_id IS NOT NULL AND bill_id IS NULL) OR 
        (invoice_id IS NULL AND bill_id IS NOT NULL)
    )
);

COMMENT ON TABLE payments IS 'Payment transactions linked to either a customer invoice or a vendor bill.';


-- ====================================================================
-- 13. ACCOUNTS TABLE
-- Purpose: Chart of Accounts storing Asset, Liability, Expense, Income & Capital ledgers.
-- ====================================================================
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    account_code VARCHAR(30) UNIQUE NOT NULL,
    account_name VARCHAR(150) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('asset', 'liability', 'expense', 'income', 'capital')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE accounts IS 'Master Chart of Accounts used in double-entry accounting entries.';


-- ====================================================================
-- 14. JOURNALS TABLE
-- Purpose: Specific accounting journals (Sales, Purchase, Bank, Cash, General).
-- ====================================================================
CREATE TABLE journals (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('sales', 'purchase', 'bank', 'cash', 'general')),
    default_account_id INT REFERENCES accounts(id) ON DELETE SET NULL
);

COMMENT ON TABLE journals IS 'Accounting journals with default clearing/ledger accounts.';


-- ====================================================================
-- 15. JOURNAL ENTRIES TABLE
-- Purpose: Journal Entry headers recording accounting financial transactions.
-- ====================================================================
CREATE TABLE journal_entries (
    id SERIAL PRIMARY KEY,
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    journal_id INT NOT NULL REFERENCES journals(id) ON DELETE RESTRICT,
    reference VARCHAR(100),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE journal_entries IS 'Journal entry headers linking to accounting journals.';


-- ====================================================================
-- 16. JOURNAL ENTRY LINES TABLE
-- Purpose: Individual debit and credit lines for each journal entry.
-- Rule: Sum(debit) MUST equal Sum(credit) across lines for a given entry.
-- ====================================================================
CREATE TABLE journal_entry_lines (
    id SERIAL PRIMARY KEY,
    journal_entry_id INT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id INT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    debit DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (debit >= 0),
    credit DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (credit >= 0),
    CONSTRAINT chk_debit_or_credit CHECK (debit > 0 OR credit > 0)
);

COMMENT ON TABLE journal_entry_lines IS 'Individual debit and credit lines enforcing double-entry balancing.';


-- ====================================================================
-- 17. BUDGETS TABLE
-- Purpose: Stores planned business budgets per account and period.
-- ====================================================================
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    responsible_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    account_id INT REFERENCES accounts(id) ON DELETE RESTRICT,
    planned_amount DECIMAL(12,2) NOT NULL CHECK (planned_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_budget_dates CHECK (end_date >= start_date)
);

COMMENT ON TABLE budgets IS 'Planned financial budgets per account for tracking actual vs planned performance.';
