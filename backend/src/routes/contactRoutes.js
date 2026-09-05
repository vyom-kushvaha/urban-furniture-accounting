const express = require('express');
const router = express.Router();
const {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
} = require('../controllers/contactController');

// Route: /api/contacts
router.route('/')
  .get(getAllContacts)
  .post(createContact);

// Route: /api/contacts/:id
router.route('/:id')
  .get(getContactById)
  .put(updateContact)
  .delete(deleteContact);

module.exports = router;
