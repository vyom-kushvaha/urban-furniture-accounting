-- ====================================================================
-- Urban Furniture Accounting & ERP System
-- PostgreSQL Sample Seed Data Script
-- ====================================================================

-- Truncate all tables in cascade order to ensure a clean re-run environment
TRUNCATE TABLE 
    budgets,
    journal_entry_lines,
    journal_entries,
    journals,
    accounts,
    payments,
    bill_items,
    bills,
    purchase_order_items,
    purchase_orders,
    invoice_items,
    invoices,
    sales_order_items,
    sales_orders,
    products,
    contacts,
    users
RESTART IDENTITY CASCADE;

-- ====================================================================
-- 1. USERS
-- Note: Passwords are stored as BCrypt hashes for 'password123'
-- ====================================================================
INSERT INTO users (id, name, email, password_hash, role) VALUES
(1, 'Admin Business Owner', 'admin@urbanfurniture.com', '$2b$10$5LGbEjnVg.GFDnHRTTo.mOskJDOKWzJDuwJlTcgVrxEuQvDqDQjyC', 'admin'),
(2, 'Rajesh Accountant', 'accountant@urbanfurniture.com', '$2b$10$5LGbEjnVg.GFDnHRTTo.mOskJDOKWzJDuwJlTcgVrxEuQvDqDQjyC', 'accountant'),
(3, 'Nimesh Kumar', 'nimesh@gmail.com', '$2b$10$5LGbEjnVg.GFDnHRTTo.mOskJDOKWzJDuwJlTcgVrxEuQvDqDQjyC', 'contact');


-- ====================================================================
-- 2. CONTACTS (Customers & Vendors)
-- ====================================================================
INSERT INTO contacts (id, name, type, email, mobile, address, city, state, pincode, user_id, is_active) VALUES
(1, 'Nimesh Kumar', 'customer', 'nimesh@gmail.com', '+91 9876543210', '42, Sunset Boulevard, Drive-in Road', 'Ahmedabad', 'Gujarat', '380054', 3, TRUE),
(2, 'Acme Corporate Offices', 'customer', 'procurement@acme.co.in', '+91 9811223344', 'Tower B, Infocity Business Park', 'Gandhinagar', 'Gujarat', '382007', NULL, TRUE),
(3, 'Rahul Teak Wood Suppliers', 'vendor', 'rahul@teakwood.com', '+91 9123456789', 'Plot 18, Industrial Timber Zone', 'Surat', 'Gujarat', '395003', NULL, TRUE),
(4, 'SteelCraft Hardware Pvt Ltd', 'vendor', 'sales@steelcraft.in', '+91 9445566778', 'GIDC Phase II', 'Vapi', 'Gujarat', '396195', NULL, TRUE);


-- ====================================================================
-- 3. PRODUCTS (Goods & Services Catalog)
-- ====================================================================
INSERT INTO products (id, name, type, sales_price, purchase_price, category, is_active) VALUES
(1, 'Executive Ergonomic Chair', 'goods', 2000.00, 1200.00, 'Office Chairs', TRUE),
(2, 'Solid Teak Conference Table', 'goods', 25000.00, 15000.00, 'Tables', TRUE),
(3, 'Modular Workstation Desk', 'goods', 8500.00, 5000.00, 'Workstations', TRUE),
(4, 'Onsite Furniture Assembly Service', 'service', 1500.00, 0.00, 'Services', TRUE);


-- ====================================================================
-- 4. CHART OF ACCOUNTS
-- Ledger accounts for Assets, Liabilities, Income, Expenses & Capital
-- ====================================================================
INSERT INTO accounts (id, account_code, account_name, type) VALUES
(1, '1010', 'Cash Account', 'asset'),
(2, '1020', 'HDFC Bank Account', 'asset'),
(3, '1100', 'Accounts Receivable (Debtors)', 'asset'),
(4, '2100', 'Accounts Payable (Creditors)', 'liability'),
(5, '2200', 'Output GST Payable', 'liability'),
(6, '2210', 'Input GST Credit', 'asset'),
(7, '3000', 'Owner Capital Account', 'capital'),
(8, '4000', 'Sales Income Account', 'income'),
(9, '5000', 'Furniture Procurement Expense', 'expense'),
(10, '5100', 'Operating & Logistics Expense', 'expense');


-- ====================================================================
-- 5. JOURNALS
-- ====================================================================
INSERT INTO journals (id, code, name, type, default_account_id) VALUES
(1, 'SJ', 'Sales Journal', 'sales', 8),
(2, 'PJ', 'Purchase Journal', 'purchase', 9),
(3, 'BNK', 'Bank Journal', 'bank', 2),
(4, 'CSH', 'Cash Journal', 'cash', 1),
(5, 'GEN', 'General Journal', 'general', NULL);


-- ====================================================================
-- 6. SALES ORDERS & LINE ITEMS
-- ====================================================================
-- Sales Order 1: Nimesh Kumar buys 5 Chairs (Total = 10,000 + 1,800 Tax = 11,800)
INSERT INTO sales_orders (id, order_number, contact_id, order_date, status, total_amount) VALUES
(1, 'SO-2026-001', 1, '2026-09-01', 'invoiced', 11800.00),
(2, 'SO-2026-002', 2, '2026-09-03', 'confirmed', 29500.00);

INSERT INTO sales_order_items (id, sales_order_id, product_id, quantity, unit_price, tax_amount, subtotal) VALUES
(1, 1, 1, 5, 2000.00, 1800.00, 10000.00),
(2, 2, 2, 1, 25000.00, 4500.00, 25000.00);


-- ====================================================================
-- 7. CUSTOMER INVOICES & LINE ITEMS
-- ====================================================================
-- Customer Invoice 1 generated for SO-2026-001 (Fully Paid)
INSERT INTO invoices (id, invoice_number, contact_id, sales_order_id, invoice_date, due_date, subtotal, tax_amount, total_amount, paid_amount, status) VALUES
(1, 'INV-2026-001', 1, 1, '2026-09-01', '2026-09-15', 10000.00, 1800.00, 11800.00, 11800.00, 'paid');

INSERT INTO invoice_items (id, invoice_id, product_id, quantity, unit_price, tax_amount, subtotal) VALUES
(1, 1, 1, 5, 2000.00, 1800.00, 10000.00);


-- ====================================================================
-- 8. PURCHASE ORDERS & LINE ITEMS
-- ====================================================================
-- Purchase Order 1 placed with Rahul Teak Wood Suppliers for 1 Teak Table
INSERT INTO purchase_orders (id, po_number, vendor_id, order_date, status, total_amount) VALUES
(1, 'PO-2026-001', 3, '2026-08-25', 'billed', 15000.00);

INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity, unit_price, subtotal) VALUES
(1, 1, 2, 1, 15000.00, 15000.00);


-- ====================================================================
-- 9. VENDOR BILLS & LINE ITEMS
-- ====================================================================
-- Vendor Bill 1 generated for PO-2026-001 (Fully Paid)
INSERT INTO bills (id, bill_number, vendor_id, purchase_order_id, bill_date, due_date, subtotal, tax_amount, total_amount, paid_amount, status) VALUES
(1, 'BILL-2026-001', 3, 1, '2026-08-26', '2026-09-10', 15000.00, 2700.00, 17700.00, 17700.00, 'paid');

INSERT INTO bill_items (id, bill_id, product_id, quantity, unit_price, subtotal) VALUES
(1, 1, 2, 1, 15000.00, 15000.00);


-- ====================================================================
-- 10. PAYMENTS
-- ====================================================================
-- Payment 1: Customer Nimesh pays INV-2026-001 via HDFC Bank
INSERT INTO payments (id, payment_number, invoice_id, bill_id, contact_id, amount, payment_method, payment_date, reference) VALUES
(1, 'PAY-2026-001', 1, NULL, 1, 11800.00, 'bank', '2026-09-02', 'UPI/HDFC/9876543210'),
-- Payment 2: Vendor Bill BILL-2026-001 paid to Rahul Teak Wood via HDFC Bank
(2, 'PAY-2026-002', NULL, 1, 3, 17700.00, 'bank', '2026-08-28', 'NEFT/HDFC/1122334455');


-- ====================================================================
-- 11. JOURNAL ENTRIES & DOUBLE-ENTRY LINES
-- ====================================================================

-- Entry 1: Sales Invoice INV-2026-001 Entry
-- Debit: Debtors (11,800), Credit: Sales Income (10,000), Credit: Output GST (1,800) [Balanced: 11,800 = 11,800]
INSERT INTO journal_entries (id, entry_number, journal_id, reference, entry_date, status) VALUES
(1, 'JE-2026-001', 1, 'Customer Invoice INV-2026-001', '2026-09-01', 'posted');

INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES
(1, 1, 3, 11800.00, 0.00),
(2, 1, 8, 0.00, 10000.00),
(3, 1, 5, 0.00, 1800.00);


-- Entry 2: Customer Payment Received PAY-2026-001 Entry
-- Debit: Bank (11,800), Credit: Debtors (11,800) [Balanced: 11,800 = 11,800]
INSERT INTO journal_entries (id, entry_number, journal_id, reference, entry_date, status) VALUES
(2, 'JE-2026-002', 3, 'Customer Payment PAY-2026-001', '2026-09-02', 'posted');

INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES
(4, 2, 2, 11800.00, 0.00),
(5, 2, 3, 0.00, 11800.00);


-- Entry 3: Vendor Bill Received BILL-2026-001 Entry
-- Debit: Procurement Expense (15,000), Debit: Input GST (2,700), Credit: Creditors (17,700) [Balanced: 17,700 = 17,700]
INSERT INTO journal_entries (id, entry_number, journal_id, reference, entry_date, status) VALUES
(3, 'JE-2026-003', 2, 'Vendor Bill BILL-2026-001', '2026-08-26', 'posted');

INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES
(6, 3, 9, 15000.00, 0.00),
(7, 3, 6, 2700.00, 0.00),
(8, 3, 4, 0.00, 17700.00);


-- Entry 4: Vendor Payment Made PAY-2026-002 Entry
-- Debit: Creditors (17,700), Credit: Bank (17,700) [Balanced: 17,700 = 17,700]
INSERT INTO journal_entries (id, entry_number, journal_id, reference, entry_date, status) VALUES
(4, 'JE-2026-004', 3, 'Vendor Payment PAY-2026-002', '2026-08-28', 'posted');

INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES
(9, 4, 4, 17700.00, 0.00),
(10, 4, 2, 0.00, 17700.00);


-- ====================================================================
-- 12. BUDGETS
-- ====================================================================
INSERT INTO budgets (id, name, start_date, end_date, responsible_user_id, account_id, planned_amount) VALUES
(1, 'Q3 Furniture Procurement & Manufacturing Budget', '2026-07-01', '2026-09-30', 2, 9, 100000.00);


-- Reset sequences so subsequent auto-increment IDs start correctly after seed
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('contacts', 'id'), (SELECT MAX(id) FROM contacts));
SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT MAX(id) FROM products));
SELECT setval(pg_get_serial_sequence('accounts', 'id'), (SELECT MAX(id) FROM accounts));
SELECT setval(pg_get_serial_sequence('journals', 'id'), (SELECT MAX(id) FROM journals));
SELECT setval(pg_get_serial_sequence('sales_orders', 'id'), (SELECT MAX(id) FROM sales_orders));
SELECT setval(pg_get_serial_sequence('sales_order_items', 'id'), (SELECT MAX(id) FROM sales_order_items));
SELECT setval(pg_get_serial_sequence('invoices', 'id'), (SELECT MAX(id) FROM invoices));
SELECT setval(pg_get_serial_sequence('invoice_items', 'id'), (SELECT MAX(id) FROM invoice_items));
SELECT setval(pg_get_serial_sequence('purchase_orders', 'id'), (SELECT MAX(id) FROM purchase_orders));
SELECT setval(pg_get_serial_sequence('purchase_order_items', 'id'), (SELECT MAX(id) FROM purchase_order_items));
SELECT setval(pg_get_serial_sequence('bills', 'id'), (SELECT MAX(id) FROM bills));
SELECT setval(pg_get_serial_sequence('bill_items', 'id'), (SELECT MAX(id) FROM bill_items));
SELECT setval(pg_get_serial_sequence('payments', 'id'), (SELECT MAX(id) FROM payments));
SELECT setval(pg_get_serial_sequence('journal_entries', 'id'), (SELECT MAX(id) FROM journal_entries));
SELECT setval(pg_get_serial_sequence('journal_entry_lines', 'id'), (SELECT MAX(id) FROM journal_entry_lines));
SELECT setval(pg_get_serial_sequence('budgets', 'id'), (SELECT MAX(id) FROM budgets));
