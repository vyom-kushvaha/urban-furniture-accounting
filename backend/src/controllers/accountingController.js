const { pool } = require('../config/db');

// ====================================================================
// 1. CHART OF ACCOUNTS (accounts)
// ====================================================================

// @desc    Get Chart of Accounts
// @route   GET /api/accounts
const getAccounts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accounts ORDER BY account_code ASC');
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('[Error] getAccounts:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Ledger Account
// @route   POST /api/accounts
const createAccount = async (req, res) => {
  const { account_code, account_name, type } = req.body;
  if (!account_code || !account_name || !type) {
    return res.status(400).json({ success: false, message: 'account_code, account_name, and type are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO accounts (account_code, account_name, type) VALUES ($1, $2, $3) RETURNING *',
      [account_code.trim(), account_name.trim(), type.toLowerCase()]
    );
    return res.status(201).json({ success: true, message: 'Account created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('[Error] createAccount:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================================================================
// 2. JOURNALS (journals)
// ====================================================================

// @desc    Get Journals
// @route   GET /api/journals
const getJournals = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT j.*, a.account_name AS default_account_name 
      FROM journals j 
      LEFT JOIN accounts a ON j.default_account_id = a.id 
      ORDER BY j.id ASC
    `);
    return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[Error] getJournals:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Journal
// @route   POST /api/journals
const createJournal = async (req, res) => {
  const { code, name, type, default_account_id } = req.body;
  if (!code || !name || !type) {
    return res.status(400).json({ success: false, message: 'code, name, and type are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO journals (code, name, type, default_account_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [code.trim(), name.trim(), type.toLowerCase(), default_account_id || null]
    );
    return res.status(201).json({ success: true, message: 'Journal created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('[Error] createJournal:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================================================================
// 3. JOURNAL ENTRIES & LINES (journal_entries, journal_entry_lines)
// ====================================================================

// @desc    Get Journal Entries with line items
// @route   GET /api/journal-entries
const getJournalEntries = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        je.id,
        je.entry_number,
        j.name AS journal_name,
        je.reference,
        je.entry_date,
        je.status,
        COALESCE(SUM(jel.debit), 0) AS total_debit,
        COALESCE(SUM(jel.credit), 0) AS total_credit
      FROM journal_entries je
      JOIN journals j ON je.journal_id = j.id
      LEFT JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
      GROUP BY je.id, je.entry_number, j.name, je.reference, je.entry_date, je.status
      ORDER BY je.id DESC
    `);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(row => ({
        ...row,
        total_debit: parseFloat(row.total_debit),
        total_credit: parseFloat(row.total_credit),
      })),
    });
  } catch (error) {
    console.error('[Error] getJournalEntries:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Manual Journal Entry with Double-Entry Balance Check
// @route   POST /api/journal-entries
const createJournalEntry = async (req, res) => {
  const { journal_id, reference, lines } = req.body;

  if (!journal_id || !lines || !Array.isArray(lines) || lines.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'journal_id and at least two balanced lines (1 Debit, 1 Credit) are required',
    });
  }

  // Double-Entry Validation: Sum(Debit) MUST EQUAL Sum(Credit)
  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    totalDebit += parseFloat(line.debit || 0);
    totalCredit += parseFloat(line.credit || 0);
  }

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return res.status(400).json({
      success: false,
      message: `Double-Entry Balance Error: Total Debit (₹${totalDebit.toFixed(2)}) does not equal Total Credit (₹${totalCredit.toFixed(2)}). Entry must balance!`,
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const uniqueSerial = Date.now().toString().slice(-4) + Math.floor(10 + Math.random() * 90);
    const entry_number = `JE-2026-${uniqueSerial}`;

    const jeResult = await client.query(
      `INSERT INTO journal_entries (entry_number, journal_id, reference, status) VALUES ($1, $2, $3, 'posted') RETURNING *`,
      [entry_number, journal_id, reference || 'Manual Entry']
    );
    const journalEntry = jeResult.rows[0];

    const createdLines = [];
    for (const line of lines) {
      const lineRes = await client.query(
        `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4) RETURNING *`,
        [journalEntry.id, line.account_id, parseFloat(line.debit || 0), parseFloat(line.credit || 0)]
      );
      createdLines.push(lineRes.rows[0]);
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Journal Entry posted successfully with double-entry validation',
      data: {
        ...journalEntry,
        lines: createdLines,
        total_debit: totalDebit,
        total_credit: totalCredit,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Error] createJournalEntry:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

// ====================================================================
// 4. BUDGETS & ANALYTIC COST CENTERS (budgets)
// ====================================================================

// @desc    Get Budgets
// @route   GET /api/budgets
const getBudgets = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.*,
        a.account_name,
        u.name AS responsible_name
      FROM budgets b
      LEFT JOIN accounts a ON b.account_id = a.id
      LEFT JOIN users u ON b.responsible_user_id = u.id
      ORDER BY b.id DESC
    `);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(row => ({
        ...row,
        planned_amount: parseFloat(row.planned_amount || 0),
      })),
    });
  } catch (error) {
    console.error('[Error] getBudgets:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Budget
// @route   POST /api/budgets
const createBudget = async (req, res) => {
  const { name, start_date, end_date, account_id, planned_amount } = req.body;
  if (!name || !start_date || !end_date || !planned_amount) {
    return res.status(400).json({ success: false, message: 'name, start_date, end_date, and planned_amount are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO budgets (name, start_date, end_date, account_id, planned_amount)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), start_date, end_date, account_id || null, parseFloat(planned_amount)]
    );
    return res.status(201).json({ success: true, message: 'Budget created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('[Error] createBudget:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAccounts,
  createAccount,
  getJournals,
  createJournal,
  getJournalEntries,
  createJournalEntry,
  getBudgets,
  createBudget,
};
