const { pool } = require('../config/db');

// @desc    Get all Purchase Orders
// @route   GET /api/purchase-orders
// @access  Private
// HINT / DEVELOPER NOTE:
// 1. In PostgreSQL schema, purchase_orders & bills tables use vendor_id (NOT contact_id).
// 2. If req.user.role === 'contact', we scope results to WHERE po.vendor_id = req.user.contact_id.
const getPurchaseOrders = async (req, res) => {
  try {
    const isContact = req.user && req.user.role === 'contact' && req.user.contact_id;
    let query = `
      SELECT 
        po.*,
        c.name AS vendor_name,
        b.bill_number,
        b.status AS bill_status
      FROM purchase_orders po
      JOIN contacts c ON po.vendor_id = c.id
      LEFT JOIN bills b ON b.purchase_order_id = po.id
    `;
    const params = [];
    if (isContact) {
      query += ` WHERE po.vendor_id = $1`;
      params.push(req.user.contact_id);
    }
    query += ` ORDER BY po.id DESC`;

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(row => ({
        ...row,
        total_amount: parseFloat(row.total_amount || 0),
      })),
    });
  } catch (error) {
    console.error('[Error] getPurchaseOrders:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching purchase orders',
      error: error.message,
    });
  }
};

// @desc    Create Purchase Order and Auto-Generate Vendor Bill
// @route   POST /api/purchase-orders
// @access  Private
const createPurchaseOrder = async (req, res) => {
  const { contact_id, items } = req.body;

  if (!contact_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Vendor ID (contact_id) and at least one line item are required',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.quantity * item.unit_price;
    }
    const tax_amount = subtotal * 0.18; // 18% GST
    const total_amount = subtotal + tax_amount;

    // 2. Generate Unique Numbers (PO-2026-XXXX and BILL-2026-XXXX)
    const uniqueSerial = Date.now().toString().slice(-4) + Math.floor(10 + Math.random() * 90);
    const po_number = `PO-2026-${uniqueSerial}`;
    const bill_number = `BILL-2026-${uniqueSerial}`;

    // 3. Insert Purchase Order
    const poResult = await client.query(
      `INSERT INTO purchase_orders (po_number, vendor_id, status, total_amount)
       VALUES ($1, $2, 'confirmed', $3) RETURNING *`,
      [po_number, contact_id, total_amount]
    );
    const purchaseOrder = poResult.rows[0];

    // 4. Insert PO Items
    for (const item of items) {
      const itemSubtotal = item.quantity * item.unit_price;
      await client.query(
        `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [purchaseOrder.id, item.product_id, item.quantity, item.unit_price, itemSubtotal]
      );
    }

    // 5. Auto-Generate Vendor Bill (due in 30 days)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const billResult = await client.query(
      `INSERT INTO bills (bill_number, vendor_id, purchase_order_id, due_date, subtotal, tax_amount, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'unpaid') RETURNING *`,
      [bill_number, contact_id, purchaseOrder.id, dueDate, subtotal, tax_amount, total_amount]
    );
    const bill = billResult.rows[0];

    // 6. Insert Bill Items
    for (const item of items) {
      const itemSubtotal = item.quantity * item.unit_price;
      await client.query(
        `INSERT INTO bill_items (bill_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [bill.id, item.product_id, item.quantity, item.unit_price, itemSubtotal]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Purchase Order and Vendor Bill generated successfully',
      data: {
        purchase_order: purchaseOrder,
        bill,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Error] createPurchaseOrder:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating purchase order',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// @desc    Get all Vendor Bills
// @route   GET /api/vendor-bills
// @access  Private
const getVendorBills = async (req, res) => {
  try {
    const isContact = req.user && req.user.role === 'contact' && req.user.contact_id;
    let query = `
      SELECT 
        b.id,
        b.bill_number,
        c.name AS vendor_name,
        po.po_number,
        b.bill_date,
        b.due_date,
        b.subtotal,
        b.tax_amount,
        b.total_amount,
        b.paid_amount,
        b.status
      FROM bills b
      JOIN contacts c ON b.vendor_id = c.id
      LEFT JOIN purchase_orders po ON b.purchase_order_id = po.id
    `;
    const params = [];
    if (isContact) {
      query += ` WHERE b.vendor_id = $1`;
      params.push(req.user.contact_id);
    }
    query += ` ORDER BY b.id DESC`;

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(row => ({
        ...row,
        subtotal: parseFloat(row.subtotal || 0),
        tax_amount: parseFloat(row.tax_amount || 0),
        total_amount: parseFloat(row.total_amount || 0),
        paid_amount: parseFloat(row.paid_amount || 0),
      })),
    });
  } catch (error) {
    console.error('[Error] getVendorBills:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching vendor bills',
      error: error.message,
    });
  }
};

// @desc    Get single Vendor Bill by ID with itemized line details
// @route   GET /api/vendor-bills/:id
// @access  Private
const getVendorBillById = async (req, res) => {
  const { id } = req.params;
  try {
    const billRes = await pool.query(`
      SELECT 
        b.*,
        c.name AS vendor_name,
        c.email AS vendor_email,
        c.mobile AS vendor_mobile,
        c.address AS vendor_address,
        c.city AS vendor_city,
        c.state AS vendor_state,
        c.pincode AS vendor_pincode,
        po.po_number
      FROM bills b
      JOIN contacts c ON b.vendor_id = c.id
      LEFT JOIN purchase_orders po ON b.purchase_order_id = po.id
      WHERE b.id = $1
    `, [id]);

    if (billRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor Bill not found' });
    }

    const bill = billRes.rows[0];

    const itemsRes = await pool.query(`
      SELECT 
        bi.*,
        p.name AS product_name
      FROM bill_items bi
      JOIN products p ON bi.product_id = p.id
      WHERE bi.bill_id = $1
    `, [id]);

    return res.status(200).json({
      success: true,
      data: {
        ...bill,
        subtotal: parseFloat(bill.subtotal || 0),
        tax_amount: parseFloat(bill.tax_amount || 0),
        total_amount: parseFloat(bill.total_amount || 0),
        paid_amount: parseFloat(bill.paid_amount || 0),
        items: itemsRes.rows.map(item => ({
          ...item,
          unit_price: parseFloat(item.unit_price || 0),
          subtotal: parseFloat(item.subtotal || 0),
        })),
      },
    });
  } catch (error) {
    console.error('[Error] getVendorBillById:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPurchaseOrders,
  createPurchaseOrder,
  getVendorBills,
  getVendorBillById,
};
