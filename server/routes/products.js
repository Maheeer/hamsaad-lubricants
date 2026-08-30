const express = require('express');
const router = express.Router();
const {
  getAllBrands, createBrand, updateBrand, deleteBrand,
  getAllCategories, createCategory, updateCategory, deleteCategory,
  getAllProducts, getProductById, createProduct, updateProduct,
  addStock, reduceStock, deleteProduct,
  getStockMovements, getLowStockProducts
} = require('../controllers/productController');
const {
  verifyToken, adminOnly, adminOrManager,
  adminManagerOrStorekeeper
} = require('../middleware/auth');

router.use(verifyToken);

// Brands
router.get('/brands', getAllBrands);
router.post('/brands', adminOnly, createBrand);
router.put('/brands/:id', adminOnly, updateBrand);
router.delete('/brands/:id', adminOnly, deleteBrand);

// Categories
router.get('/categories', getAllCategories);
router.post('/categories', adminOnly, createCategory);
router.put('/categories/:id', adminOnly, updateCategory);
router.delete('/categories/:id', adminOnly, deleteCategory);

// Products
router.get('/', getAllProducts);
router.get('/low-stock', adminOrManager, getLowStockProducts);
router.get('/movements', adminOrManager, getStockMovements);
router.get('/:id', getProductById);
router.post('/', adminOnly, createProduct);
router.put('/:id', adminOnly, updateProduct);
router.patch('/:id/add-stock', adminManagerOrStorekeeper, addStock);
router.patch('/:id/reduce-stock', adminOnly, reduceStock);
router.delete('/:id', adminOnly, deleteProduct);

module.exports = router;
