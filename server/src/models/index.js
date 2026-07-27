const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL || process.env.DB_DIALECT === 'sqlite') {
  const storage = process.env.DB_STORAGE || path.join(process.cwd(), 'data', 'app.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false
  });
} else {
  sequelize = new Sequelize(process.env.DB_NAME || 'fyp1', process.env.DB_USER || 'root', process.env.DB_PASS || 'Republic_C207', {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
    logging: false,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
  });
}

const db = { Sequelize, sequelize };

db.User = require('./user')(sequelize, DataTypes);
db.Customer = require('./customer')(sequelize, DataTypes);
db.Invoice = require('./invoice')(sequelize, DataTypes);
db.Payment = require('./payment')(sequelize, DataTypes);

module.exports = db;
