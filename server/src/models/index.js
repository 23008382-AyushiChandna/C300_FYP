const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME || 'fyp1', process.env.DB_USER || 'root', process.env.DB_PASS || 'Republic_C207', {
  host: process.env.DB_HOST || '127.0.0.1',
  dialect: 'mysql',
  logging: false
});

const db = { Sequelize, sequelize };

db.User = require('./user')(sequelize, DataTypes);
db.Customer = require('./customer')(sequelize, DataTypes);
db.Invoice = require('./invoice')(sequelize, DataTypes);
db.Payment = require('./payment')(sequelize, DataTypes);

module.exports = db;
