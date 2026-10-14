const express = require('express');
const router = express.Router();
const { Product, ProductVariant } = require('../models');
const { validateToken, isAdmin } = require('../middlewares/AuthMiddleware');

// Get all products (Public - anyone can view the store)
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [ProductVariant] // Automatically bundles the variants inside the product object
    });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Add a new product (Private - Admin Only)
router.post('/', validateToken, isAdmin, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Product name is required" });
  }

  try {
    const product = await Product.create({ name, description });
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Edit an existing product (Private - Admin Only)
router.put('/:id', validateToken, isAdmin, async (req, res) => {
  const productId = req.params.id;
  const { name, description } = req.body;

  try {
    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update the product fields
    await product.update({ name, description });
    res.json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete a product (Private - Admin Only)
router.delete('/:id', validateToken, isAdmin, async (req, res) => {
  const productId = req.params.id;

  try {
    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Deletes the product from the database
    await product.destroy();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;