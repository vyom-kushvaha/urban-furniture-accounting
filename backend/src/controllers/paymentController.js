const { pool } = require('../config/db');

// @desc    Register payment against a customer invoice with Auto Double-Entry Journal Posting
// @route   POST /api/payments
// @access  Private
const registerPayment = async (req, res) => {
  const { invoice_id, amount, payment_method, reference } = req.body;

  // Simple Input Validation
  if (!invoice_id || !amount || !payment_method) {
    return res.status(400).json({
      success: false,
      message: 'invoice_id, amount, and payment_method are required',
    });
  }

  const client = await pool.connect();

  try {
    // 1. Start Atomic Transaction
    await client.query('BEGIN');

    // 2. Verify Invoice exists
    const invoiceResult = await client.query('SELECT * FROM invoices WHERE id = $1', [invoice_id]);
    if (invoiceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: `Invoice with ID ${invoice_id} not found`,
      });
    }

    const invoice = invoiceResult.rows[0];
    const parsedAmount = parseFloat(amount);
    const totalAmount = parseFloat(invoice.total_amount || 0);
    const currentPaid = parseFloat(invoice.paid_amount || 0);
    const balanceDue = totalAmount - currentPaid;

    // Overpayment Validation
    if (parsedAmount > balanceDue + 0.01) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${parsedAmount.toLocaleString('en-IN')}) cannot exceed the remaining balance due of ₹${balanceDue.toLocaleString('en-IN')}.`,
      });
    }
    const uniqueSerial = Date.now().toString().slice(-4) + Math.floor(10 + Math.random() * 90);
    const payment_number = `PAY-2026-${uniqueSerial}`;

    // 4. Insert into Payments table
    const paymentQuery = `
      INSERT INTO payments (payment_number, invoice_id, contact_id, amount, payment_method, reference)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const paymentResult = await client.query(paymentQuery, [
      payment_number,
      invoice_id,
      invoice.contact_id,
      parsedAmount,
      payment_method.toLowerCase(),
      reference || `Payment for Invoice ${invoice.invoice_number}`,
    ]);
    const payment = paymentResult.rows[0];

    // 5. Update Invoice status & paid_amount
    const newPaid = parseFloat(invoice.paid_amount) + parsedAmount;
    const newStatus = newPaid >= parseFloat(invoice.total_amount) ? 'paid' : 'partially_paid';

    const updatedInvoiceResult = await client.query(
      `UPDATE invoices SET paid_amount = $1, status = $2 WHERE id = $3 RETURNING *`,
      [newPaid, newStatus, invoice_id]
    );
    const updatedInvoice = updatedInvoiceResult.rows[0];

    // 6. Double-Entry Accounting: Create Journal Entry
    // Account 1010 = Cash, Account 1020 = HDFC Bank, Account 1100 = Debtors
    const debitAccountCode = payment_method.toLowerCase() === 'bank' ? '1020' : '1010';
    const journalCode = payment_method.toLowerCase() === 'bank' ? 'BNK' : 'CSH';

    const journalResult = await client.query(`SELECT id FROM journals WHERE code = $1 LIMIT 1`, [journalCode]);
    const journalId = journalResult.rows[0] ? journalResult.rows[0].id : 3;

    const entry_number = `JE-2026-${uniqueSerial}`;
    const jeResult = await client.query(
      `INSERT INTO journal_entries (entry_number, journal_id, reference, status) VALUES ($1, $2, $3, 'posted') RETURNING *`,
      [entry_number, journalId, `Customer Payment ${payment_number}`]
    );
    const journalEntry = jeResult.rows[0];

    // Get Account IDs
    const accountsResult = await client.query(`SELECT id, account_code FROM accounts WHERE account_code IN ($1, '1100')`, [debitAccountCode]);
    let debitAccountId = 2; // Default Bank (1020)
    let creditAccountId = 3; // Default Debtors (1100)

    for (const acc of accountsResult.rows) {
      if (acc.account_code === debitAccountCode) debitAccountId = acc.id;
      if (acc.account_code === '1100') creditAccountId = acc.id;
    }

    // Insert 2 balanced lines: Debit Bank/Cash, Credit Debtors
    const debitLine = await client.query(
      `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, 0.00) RETURNING *`,
      [journalEntry.id, debitAccountId, parsedAmount]
    );
    const creditLine = await client.query(
      `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit) VALUES ($1, $2, 0.00, $3) RETURNING *`,
      [journalEntry.id, creditAccountId, parsedAmount]
    );

    // Commit Transaction
    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Payment registered and double-entry journal posted successfully',
      data: {
        payment,
        invoice: updatedInvoice,
        journal_entry: {
          ...journalEntry,
          lines: [debitLine.rows[0], creditLine.rows[0]],
        },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Error] registerPayment:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while registering payment',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// @desc    Get all payment transactions
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    const isContact = req.user && req.user.role === 'contact' && req.user.contact_id;
    let query = `
      SELECT 
        p.*,
        c.name AS contact_name,
        i.invoice_number,
        b.bill_number
      FROM payments p
      JOIN contacts c ON p.contact_id = c.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN bills b ON p.bill_id = b.id
    `;
    const params = [];
    if (isContact) {
      query += ` WHERE p.contact_id = $1`;
      params.push(req.user.contact_id);
    }
    query += ` ORDER BY p.id DESC`;

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(row => ({
        ...row,
        amount: parseFloat(row.amount || 0),
      })),
    });
  } catch (error) {
    console.error('[Error] getPayments:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching payments',
      error: error.message,
    });
  }
};

module.exports = { registerPayment, getPayments };
