// server/models/Towns.js
module.exports = (sequelize, DataTypes) => {
  const Towns = sequelize.define("Towns", {
    townName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.FLOAT, 
      allowNull: false,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  });

  return Towns;
};