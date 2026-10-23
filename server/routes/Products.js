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

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 255) {
    return res.status(400).json({ error: "Product name is required and must be a string up to 255 characters" });
  }

  if (description !== undefined && description !== null && typeof description !== 'string') {
    return res.status(400).json({ error: "Product description must be a string" });
  }

  try {
    const product = await Product.create({
      name: name.trim(),
      description: typeof description === 'string' ? description.trim() : null
    });
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

  if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > 255)) {
    return res.status(400).json({ error: "Product name must be a non-empty string up to 255 characters" });
  }

  if (description !== undefined && description !== null && typeof description !== 'string') {
    return res.status(400).json({ error: "Product description must be a string" });
  }

  try {
    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update only whitelisted product fields
    await product.update({
      name: name !== undefined ? name.trim() : product.name,
      description: description !== undefined ? (typeof description === 'string' ? description.trim() : null) : product.description
    });
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
