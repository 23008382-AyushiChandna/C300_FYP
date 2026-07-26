module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    customerId: { type: DataTypes.INTEGER, allowNull: true },
    customerName: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paid: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    dueDate: { type: DataTypes.DATE, allowNull: false },
    issueDate: { type: DataTypes.DATE, allowNull: false },
    description: { type: DataTypes.TEXT },
    status: { type: DataTypes.STRING, defaultValue: 'pending' }, // pending, paid, overdue
    notes: { type: DataTypes.TEXT }
  }, {
    tableName: 'invoices',
    timestamps: true
  });

  return Invoice;
};
