module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    companyName: { type: DataTypes.STRING, allowNull: false, unique: true },
    contactPerson: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.TEXT },
    creditLimit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    paymentTerms: { type: DataTypes.STRING, defaultValue: 'Net 30' },
    status: { type: DataTypes.STRING, defaultValue: 'active' } // active, on-hold, overdue
  }, {
    tableName: 'customers',
    timestamps: true
  });

  return Customer;
};
