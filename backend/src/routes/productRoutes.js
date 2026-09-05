const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// Route: /api/products
router.route('/')
  .get(getAllProducts)
  .post(createProduct);

// Route: /api/products/:id
router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
