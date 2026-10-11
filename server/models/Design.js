module.exports = (sequelize, DataTypes) => {
  const Design = sequelize.define("Design", {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: false 
    }
  });

  Design.associate = (models) => {
    Design.belongsToMany(models.Towns, { 
      through: 'DesignTowns', 
      foreignKey: 'designId' 
    });
  };

  return Design;
};