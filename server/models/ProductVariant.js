module.exports = (sequelize, DataTypes) => {
  // The string "ProductVariant" here is what models.ProductVariant looks for!
  const ProductVariant = sequelize.define("ProductVariant", {
    size: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price_pence: {
      type: DataTypes.INTEGER, 
      allowNull: false
    }
  });

  ProductVariant.associate = (models) => {
    ProductVariant.belongsTo(models.Product, { foreignKey: 'productId' });
  };

  return ProductVariant;
};