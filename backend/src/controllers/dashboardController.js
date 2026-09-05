const { pool } = require('../config/db');

// @desc    Get Live Dashboard Metrics & KPIs
// @route   GET /api/dashboard
// @access  Private
const getDashboardMetrics = async (req, res) => {
  try {
    const isContact = req.user && req.user.role === 'contact' && req.user.contact_id;
    const contactId = isContact ? req.user.contact_id : null;

    // 1. Total Sales (excluding cancelled orders)
    const salesQuery = isContact
      ? `SELECT COALESCE(SUM(total_amount), 0) AS total_sales FROM sales_orders WHERE status != 'cancelled' AND contact_id = $1`
      : `SELECT COALESCE(SUM(total_amount), 0) AS total_sales FROM sales_orders WHERE status != 'cancelled'`;
    const salesParams = isContact ? [contactId] : [];
    const salesResult = await pool.query(salesQuery, salesParams);

    // 2. Total Payments Collected
    const paymentsQuery = isContact
      ? `SELECT COALESCE(SUM(amount), 0) AS payments_collected FROM payments WHERE contact_id = $1`
      : `SELECT COALESCE(SUM(amount), 0) AS payments_collected FROM payments`;
    const paymentsParams = isContact ? [contactId] : [];
    const paymentsResult = await pool.query(paymentsQuery, paymentsParams);

    // 3. Receivables Due (Unpaid / Partially Paid Invoices balance)
    const receivablesQuery = isContact
      ? `SELECT COALESCE(SUM(total_amount - paid_amount), 0) AS receivables_due FROM invoices WHERE status != 'paid' AND status != 'cancelled' AND contact_id = $1`
      : `SELECT COALESCE(SUM(total_amount - paid_amount), 0) AS receivables_due FROM invoices WHERE status != 'paid' AND status != 'cancelled'`;
    const receivablesParams = isContact ? [contactId] : [];
    const receivablesResult = await pool.query(receivablesQuery, receivablesParams);

    // 4. Recent Transactions (Top 5 Sales Orders with Customer Name)
    const recentQuery = isContact
      ? `SELECT 
          so.id,
          so.order_number,
          c.name AS contact_name,
          so.order_date,
          so.status,
          so.total_amount
         FROM sales_orders so
         JOIN contacts c ON so.contact_id = c.id
         WHERE so.contact_id = $1
         ORDER BY so.id DESC
         LIMIT 5`
      : `SELECT 
          so.id,
          so.order_number,
          c.name AS contact_name,
          so.order_date,
          so.status,
          so.total_amount
         FROM sales_orders so
         JOIN contacts c ON so.contact_id = c.id
         ORDER BY so.id DESC
         LIMIT 5`;
    const recentParams = isContact ? [contactId] : [];
    const recentResult = await pool.query(recentQuery, recentParams);

    return res.status(200).json({
      success: true,
      data: {
        total_sales: parseFloat(salesResult.rows[0].total_sales),
        payments_collected: parseFloat(paymentsResult.rows[0].payments_collected),
        receivables_due: parseFloat(receivablesResult.rows[0].receivables_due),
        recent_transactions: recentResult.rows,
      },
    });
  } catch (error) {
    console.error('[Error] getDashboardMetrics:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching dashboard metrics',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardMetrics,
};
