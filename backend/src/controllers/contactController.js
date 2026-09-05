const { pool } = require('../config/db');

// @desc    Get all active contacts
// @route   GET /api/contacts
// @access  Public (No Auth yet)
const getAllContacts = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, type, email, mobile, address, city, state, pincode, profile_image, user_id, is_active, created_at FROM contacts WHERE is_active = TRUE ORDER BY id ASC'
    );
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('[Error] getAllContacts:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching contacts',
      error: error.message,
    });
  }
};

// @desc    Get single contact by ID
// @route   GET /api/contacts/:id
// @access  Public
const getContactById = async (req, res) => {
  const { id } = req.params;

  // Validate ID parameter
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid contact ID format. Must be an integer.',
    });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, type, email, mobile, address, city, state, pincode, profile_image, user_id, is_active, created_at FROM contacts WHERE id = $1 AND is_active = TRUE',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Contact with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[Error] getContactById:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching contact',
      error: error.message,
    });
  }
};

// @desc    Create a new contact
// @route   POST /api/contacts
// @access  Public
const createContact = async (req, res) => {
  const {
    name,
    type,
    email,
    mobile,
    address,
    city,
    state,
    pincode,
    profile_image,
    user_id,
  } = req.body;

  // Input Validation
  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Contact name is required',
    });
  }

  const validTypes = ['customer', 'vendor', 'both'];
  if (!type || !validTypes.includes(type.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Contact type is required and must be customer, vendor, or both',
    });
  }

  try {
    const queryText = `
      INSERT INTO contacts 
        (name, type, email, mobile, address, city, state, pincode, profile_image, user_id) 
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING id, name, type, email, mobile, address, city, state, pincode, profile_image, user_id, is_active, created_at
    `;

    const queryValues = [
      name.trim(),
      type.toLowerCase(),
      email ? email.trim() : null,
      mobile ? mobile.trim() : null,
      address ? address.trim() : null,
      city ? city.trim() : null,
      state ? state.trim() : null,
      pincode ? pincode.trim() : null,
      profile_image || null,
      user_id || null,
    ];

    const result = await pool.query(queryText, queryValues);

    return res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[Error] createContact:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating contact',
      error: error.message,
    });
  }
};

// @desc    Update existing contact
// @route   PUT /api/contacts/:id
// @access  Public
const updateContact = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid contact ID format. Must be an integer.',
    });
  }

  const {
    name,
    type,
    email,
    mobile,
    address,
    city,
    state,
    pincode,
    profile_image,
    user_id,
    is_active,
  } = req.body;

  // Validate type if provided
  if (type) {
    const validTypes = ['customer', 'vendor', 'both'];
    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Type must be customer, vendor, or both',
      });
    }
  }

  try {
    // Check if contact exists
    const checkResult = await pool.query(
      'SELECT id FROM contacts WHERE id = $1 AND is_active = TRUE',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Contact with ID ${id} not found`,
      });
    }

    const queryText = `
      UPDATE contacts 
      SET 
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        email = COALESCE($3, email),
        mobile = COALESCE($4, mobile),
        address = COALESCE($5, address),
        city = COALESCE($6, city),
        state = COALESCE($7, state),
        pincode = COALESCE($8, pincode),
        profile_image = COALESCE($9, profile_image),
        user_id = COALESCE($10, user_id),
        is_active = COALESCE($11, is_active)
      WHERE id = $12 AND is_active = TRUE
      RETURNING id, name, type, email, mobile, address, city, state, pincode, profile_image, user_id, is_active, created_at
    `;

    const queryValues = [
      name ? name.trim() : null,
      type ? type.toLowerCase() : null,
      email ? email.trim() : null,
      mobile ? mobile.trim() : null,
      address ? address.trim() : null,
      city ? city.trim() : null,
      state ? state.trim() : null,
      pincode ? pincode.trim() : null,
      profile_image !== undefined ? profile_image : null,
      user_id !== undefined ? user_id : null,
      is_active !== undefined ? is_active : null,
      id,
    ];

    const result = await pool.query(queryText, queryValues);

    return res.status(200).json({
      success: true,
      message: 'Contact updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[Error] updateContact:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating contact',
      error: error.message,
    });
  }
};

// @desc    Delete (Archive) a contact
// @route   DELETE /api/contacts/:id
// @access  Public
const deleteContact = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid contact ID format. Must be an integer.',
    });
  }

  try {
    // Check if contact exists
    const checkResult = await pool.query(
      'SELECT id FROM contacts WHERE id = $1 AND is_active = TRUE',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Contact with ID ${id} not found`,
      });
    }

    // Soft delete / archive by setting is_active = FALSE
    const result = await pool.query(
      'UPDATE contacts SET is_active = FALSE WHERE id = $1 RETURNING id, name, is_active',
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Contact archived successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[Error] deleteContact:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting contact',
      error: error.message,
    });
  }
};

module.exports = {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
};
