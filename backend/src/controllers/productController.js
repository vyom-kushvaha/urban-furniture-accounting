const { pool } = require('../config/db');

// @desc    Get all active products
// @route   GET /api/products
// @access  Public / Private
const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, type, sales_price, purchase_price, category, is_active, created_at FROM products WHERE is_active = TRUE ORDER BY id ASC'
    );
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(row => ({
        ...row,
        sales_price: parseFloat(row.sales_price),
        purchase_price: parseFloat(row.purchase_price),
      })),
    });
  } catch (error) {
    console.error('[Error] getAllProducts:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching products',
      error: error.message,
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public / Private
const getProductById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format. Must be an integer.',
    });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, type, sales_price, purchase_price, category, is_active, created_at FROM products WHERE id = $1 AND is_active = TRUE',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`,
      });
    }

    const row = result.rows[0];
    return res.status(200).json({
      success: true,
      data: {
        ...row,
        sales_price: parseFloat(row.sales_price),
        purchase_price: parseFloat(row.purchase_price),
      },
    });
  } catch (error) {
    console.error('[Error] getProductById:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching product',
      error: error.message,
    });
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Public / Private
const createProduct = async (req, res) => {
  const { name, type, sales_price, purchase_price, cost_price, category } = req.body;

  // Accept cost_price or purchase_price
  const finalPurchasePrice = purchase_price !== undefined ? purchase_price : (cost_price !== undefined ? cost_price : 0);

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Product name is required',
    });
  }

  const validTypes = ['goods', 'service', 'combo'];
  if (!type || !validTypes.includes(type.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Product type is required and must be goods, service, or combo',
    });
  }

  try {
    const queryText = `
      INSERT INTO products 
        (name, type, sales_price, purchase_price, category) 
      VALUES 
        ($1, $2, $3, $4, $5) 
      RETURNING id, name, type, sales_price, purchase_price, category, is_active, created_at
    `;

    const queryValues = [
      name.trim(),
      type.toLowerCase(),
      parseFloat(sales_price || 0),
      parseFloat(finalPurchasePrice || 0),
      category ? category.trim() : 'General',
    ];

    const result = await pool.query(queryText, queryValues);
    const row = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        ...row,
        sales_price: parseFloat(row.sales_price),
        purchase_price: parseFloat(row.purchase_price),
      },
    });
  } catch (error) {
    console.error('[Error] createProduct:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating product',
      error: error.message,
    });
  }
};

// @desc    Update existing product
// @route   PUT /api/products/:id
// @access  Public / Private
const updateProduct = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format. Must be an integer.',
    });
  }

  const { name, type, sales_price, purchase_price, cost_price, category, is_active } = req.body;
  const finalPurchasePrice = purchase_price !== undefined ? purchase_price : cost_price;

  if (type) {
    const validTypes = ['goods', 'service', 'combo'];
    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Type must be goods, service, or combo',
      });
    }
  }

  try {
    const checkResult = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND is_active = TRUE',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`,
      });
    }

    const queryText = `
      UPDATE products 
      SET 
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        sales_price = COALESCE($3, sales_price),
        purchase_price = COALESCE($4, purchase_price),
        category = COALESCE($5, category),
        is_active = COALESCE($6, is_active)
      WHERE id = $7 AND is_active = TRUE
      RETURNING id, name, type, sales_price, purchase_price, category, is_active, created_at
    `;

    const queryValues = [
      name ? name.trim() : null,
      type ? type.toLowerCase() : null,
      sales_price !== undefined ? parseFloat(sales_price) : null,
      finalPurchasePrice !== undefined ? parseFloat(finalPurchasePrice) : null,
      category ? category.trim() : null,
      is_active !== undefined ? is_active : null,
      id,
    ];

    const result = await pool.query(queryText, queryValues);
    const row = result.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        ...row,
        sales_price: parseFloat(row.sales_price),
        purchase_price: parseFloat(row.purchase_price),
      },
    });
  } catch (error) {
    console.error('[Error] updateProduct:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating product',
      error: error.message,
    });
  }
};

// @desc    Delete (Archive) a product
// @route   DELETE /api/products/:id
// @access  Public / Private
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format. Must be an integer.',
    });
  }

  try {
    const checkResult = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND is_active = TRUE',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`,
      });
    }

    const result = await pool.query(
      'UPDATE products SET is_active = FALSE WHERE id = $1 RETURNING id, name, is_active',
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Product archived successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[Error] deleteProduct:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting product',
      error: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
