const express = require('express');
const router = express.Router();
const { ProductVariant, Product } = require('../models');
const { validateToken, isAdmin } = require('../middlewares/AuthMiddleware');

// Assign multiple variants to a Product at once (Admin Only)
router.post('/bulk', validateToken, isAdmin, async (req, res) => {
  const { ProductId, variants } = req.body;
  // variants expects an array like: [{ name: "A4", price: 15.00, stock: 10 }, { name: "A3", price: 25.00, stock: 5 }]

  if (!ProductId || !variants || !Array.isArray(variants)) {
    return res.status(400).json({ error: "ProductId and an array of variants are required" });
  }

  try {
    const product = await Product.findByPk(ProductId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Map through the array and attach the ProductId to each variant object
    const variantsWithProductId = variants.map(variant => ({
      ...variant,
      productId: ProductId
    }));

    // Sequelize bulkCreate inserts multiple rows in a single efficient database query
    const createdVariants = await ProductVariant.bulkCreate(variantsWithProductId);
    res.status(201).json({ message: "Variants added successfully", variants: createdVariants });
  } catch (error) {
    console.error("Error creating variants:", error);
    res.status(500).json({ error: "Failed to create variants" });
  }
});

// Edit a single variant (Admin Only)
router.put('/:id', validateToken, isAdmin, async (req, res) => {
  const variantId = req.params.id;
  const { name, price, stock } = req.body;

  try {
    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) return res.status(404).json({ error: "Variant not found" });

    await variant.update({ name, price, stock });
    res.json({ message: "Variant updated successfully", variant });
  } catch (error) {
    console.error("Error updating variant:", error);
    res.status(500).json({ error: "Failed to update variant" });
  }
});

// Delete a single variant (Admin Only)
router.delete('/:id', validateToken, isAdmin, async (req, res) => {
  const variantId = req.params.id;

  try {
    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) return res.status(404).json({ error: "Variant not found" });

    await variant.destroy();
    res.json({ message: "Variant deleted successfully" });
  } catch (error) {
    console.error("Error deleting variant:", error);
    res.status(500).json({ error: "Failed to delete variant" });
  }
});

module.exports = router;