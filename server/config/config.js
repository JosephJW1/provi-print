require('dotenv').config();

const enableSsl =
  process.env.DB_SSL === 'true' ||
  (process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false');

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    dialectOptions: enableSsl
      ? {
          ssl: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true,
          },
        }
      : {},
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 4000,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: Number(process.env.DB_POOL_MAX) || 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      enableKeepAlive: true,
      ...(enableSsl
        ? {
            ssl: {
              minVersion: 'TLSv1.2',
              rejectUnauthorized: true,
            },
          }
        : {}),
    },
  },
};
