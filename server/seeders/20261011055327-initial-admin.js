'use strict';
require('dotenv').config();
const bcrypt = require('bcrypt');

const BCRYPT_ROUNDS = 12;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Failsafe: Prevent seeding if env variables are missing
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error("ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be defined in .env file");
    }

    // 1. Hash the password from the .env file using the same work factor (12) as standard accounts
    const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, BCRYPT_ROUNDS);

    // 2. Insert the admin user dynamically
    await queryInterface.bulkInsert('Users', [{
      username: process.env.ADMIN_USERNAME.trim(),
      email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
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
