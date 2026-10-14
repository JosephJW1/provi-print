module.exports = (sequelize, DataTypes) => {
  const ProductVariant = sequelize.define("ProductVariant", {
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price_pence: {
      type: DataTypes.INTEGER, 
      allowNull: false
    }
  });

  ProductVariant.associate = (models) => {
    ProductVariant.belongsTo(models.Product, {
      foreignKey: "productId",
      onDelete: "CASCADE", 
    });
  };

  return ProductVariant;
};