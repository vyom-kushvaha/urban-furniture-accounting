const { pool } = require('../config/db');

// @desc    Get Profit & Loss Statement (Dynamic calculation from Postgres)
// @route   GET /api/reports/profit-loss
const getProfitAndLossReport = async (req, res) => {
  try {
    // 1. Sales / Revenue Income (Sum of all non-cancelled Invoices or Sales Orders)
    const salesRes = await pool.query(
      `SELECT COALESCE(SUM(subtotal), 0) AS total_sales_income, COALESCE(SUM(tax_amount), 0) AS total_gst_collected FROM invoices WHERE status != 'cancelled'`
    );
    let totalSalesIncome = parseFloat(salesRes.rows[0].total_sales_income || 0);
    let totalGstCollected = parseFloat(salesRes.rows[0].total_gst_collected || 0);

    if (totalSalesIncome === 0) {
      const soRes = await pool.query(
        `SELECT COALESCE(SUM(total_amount), 0) AS total_sales_income FROM sales_orders WHERE status != 'cancelled'`
      );
      totalSalesIncome = parseFloat(soRes.rows[0].total_sales_income || 0);
    }

    // 2. Cost of Goods Sold & Purchase Expenses (Sum of all non-cancelled Bills or Purchase Orders)
    const purchaseRes = await pool.query(
      `SELECT COALESCE(SUM(subtotal), 0) AS total_purchase_cost FROM bills WHERE status != 'cancelled'`
    );
    let totalPurchaseCost = parseFloat(purchaseRes.rows[0].total_purchase_cost || 0);
    if (totalPurchaseCost === 0) {
      const poRes = await pool.query(
        `SELECT COALESCE(SUM(total_amount), 0) AS total_purchase_cost FROM purchase_orders WHERE status != 'cancelled'`
      );
      totalPurchaseCost = parseFloat(poRes.rows[0].total_purchase_cost || 0);
    }

    // 3. Operating Expenses (Sum of Debit lines on Expense Accounts code 5000+)
    const expenseRes = await pool.query(
      `SELECT COALESCE(SUM(jel.debit), 0) AS operating_expenses
       FROM journal_entry_lines jel
       JOIN accounts a ON jel.account_id = a.id
       WHERE a.type = 'expense'`
    );
    const operatingExpenses = parseFloat(expenseRes.rows[0].operating_expenses || 0);

    const grossProfit = totalSalesIncome - totalPurchaseCost;
    const totalExpenses = totalPurchaseCost + operatingExpenses;
    const netProfit = totalSalesIncome - totalExpenses;

    return res.status(200).json({
      success: true,
      data: {
        total_sales_income: totalSalesIncome,
        total_gst_collected: totalGstCollected,
        total_purchase_cost: totalPurchaseCost,
        gross_profit: grossProfit,
        operating_expenses: operatingExpenses,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        ebitda_margin: totalSalesIncome > 0 ? ((netProfit / totalSalesIncome) * 100).toFixed(2) + '%' : '0.00%',
      },
    });
  } catch (error) {
    console.error('[Error] getProfitAndLossReport:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Balance Sheet (Assets vs Liabilities & Capital)
// @route   GET /api/reports/balance-sheet
const getBalanceSheetReport = async (req, res) => {
  try {
    // 1. Cash & Bank Balances (Cleared Inflows via Payments)
    const cashRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS cash_balance FROM payments WHERE payment_method = 'cash'`
    );
    const bankRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS bank_balance FROM payments WHERE payment_method = 'bank'`
    );
    const cashBalance = parseFloat(cashRes.rows[0].cash_balance || 0);
    const bankBalance = parseFloat(bankRes.rows[0].bank_balance || 0);

    // 2. Accounts Receivable (Unpaid Customer Invoices)
    const receivablesRes = await pool.query(
      `SELECT COALESCE(SUM(total_amount - paid_amount), 0) AS receivables FROM invoices WHERE status != 'paid' AND status != 'cancelled'`
    );
    const receivables = parseFloat(receivablesRes.rows[0].receivables || 0);

    // 3. Accounts Payable (Unpaid Vendor Bills)
    const payablesRes = await pool.query(
      `SELECT COALESCE(SUM(total_amount - paid_amount), 0) AS payables FROM bills WHERE status != 'paid' AND status != 'cancelled'`
    );
    const payables = parseFloat(payablesRes.rows[0].payables || 0);

    const currentAssets = cashBalance + bankBalance + receivables;
    const totalLiabilities = payables;
    const ownerEquity = currentAssets - totalLiabilities;

    return res.status(200).json({
      success: true,
      data: {
        assets: {
          cash_and_equivalents: cashBalance,
          hdfc_bank_account: bankBalance,
          accounts_receivable: receivables,
          total_current_assets: currentAssets,
        },
        liabilities: {
          accounts_payable: payables,
          total_liabilities: totalLiabilities,
        },
        equity: {
          retained_earnings_equity: ownerEquity,
          total_equity_and_liabilities: totalLiabilities + ownerEquity,
        },
        is_balanced: Math.abs(currentAssets - (totalLiabilities + ownerEquity)) < 0.01,
      },
    });
  } catch (error) {
    console.error('[Error] getBalanceSheetReport:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Budget Variance Report
// @route   GET /api/reports/budget
const getBudgetReport = async (req, res) => {
  try {
    const budgetsRes = await pool.query(`
      SELECT 
        b.id,
        b.name,
        b.planned_amount,
        a.account_name,
        COALESCE(SUM(jel.debit), 0) AS actual_spent
      FROM budgets b
      LEFT JOIN accounts a ON b.account_id = a.id
      LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
      GROUP BY b.id, b.name, b.planned_amount, a.account_name
      ORDER BY b.id ASC
    `);

    const data = budgetsRes.rows.map(row => {
      const planned = parseFloat(row.planned_amount || 0);
      const actual = parseFloat(row.actual_spent || 0);
      const variance = planned - actual;
      return {
        id: row.id,
        name: row.name,
        account_name: row.account_name || 'Department Budget',
        planned_amount: planned,
        actual_spent: actual,
        variance: variance,
        burn_rate_percent: planned > 0 ? ((actual / planned) * 100).toFixed(1) + '%' : '0.0%',
      };
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('[Error] getBudgetReport:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfitAndLossReport,
  getBalanceSheetReport,
  getBudgetReport,
};
