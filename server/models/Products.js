module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define("Product", {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  Product.associate = (models) => {
    // This MUST exactly match the string in the define() block of the other file
    Product.hasMany(models.ProductVariant, { foreignKey: 'productId' });
  };

  return Product;
};