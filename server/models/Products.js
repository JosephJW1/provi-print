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
    Product.hasMany(models.ProductVariant, {
      foreignKey: "productId",
      onDelete: "CASCADE"
    });
  };

  return Product;
};