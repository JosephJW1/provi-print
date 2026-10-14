'use strict';
require('dotenv').config();
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Failsafe: Prevent seeding if env variables are missing
    if (!process.env.ADMIN_PASSWORD) {
        throw new Error("ADMIN_PASSWORD is missing in .env file");
    }

    // 1. Hash the password from the .env file
    const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    // 2. Insert the admin user dynamically
    await queryInterface.bulkInsert('Users', [{
      username: process.env.ADMIN_USERNAME,
      email: process.env.ADMIN_EMAIL,
      password_hash: adminPasswordHash,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', { email: process.env.ADMIN_EMAIL }, {});
  }
};