-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyName VARCHAR(255) NOT NULL UNIQUE,
  contactPerson VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  creditLimit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paymentTerms VARCHAR(50) NOT NULL DEFAULT 'Net 30',
  status VARCHAR(50) DEFAULT 'active',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_name (companyName),
  INDEX idx_status (status)
);

-- Sample data will be inserted via API, not migration
-- INSERT INTO customers (companyName, contactPerson, email, phone, address, creditLimit, paymentTerms, status) VALUES
-- ('Aurora Logistics', 'Samantha Lee', 'samantha@auroralogistics.com', '+65 9123 4567', '18 Shenton Way, Singapore', 78000, 'Net 30', 'active'),
-- ('Vertex Manufacturing', 'James Tan', 'james.tan@vertex.com.sg', '+65 9234 5567', '88 Market Street, Singapore', 120000, 'Net 45', 'on-hold'),
-- ('BlueHarbor Ltd', 'Fiona Chow', 'fiona@blueharbor.co', '+65 9345 6789', '32 Marina Boulevard, Singapore', 92000, 'Net 30', 'active'),
-- ('Nimbus Retail', 'Daniel Wong', 'daniel@nimbusretail.com', '+65 9456 7890', '5 Orchard Road, Singapore', 65000, 'Net 60', 'overdue'),
-- ('Cedar Financial', 'Maya Patel', 'maya.patel@cedarfin.com', '+65 9567 8901', '122 Cecil Street, Singapore', 142000, 'Net 30', 'active');

-- Foreign key and invoice data commented out - will be handled by Sequelize
-- ALTER TABLE invoices ADD CONSTRAINT fk_invoices_customerId 
-- FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE;

-- INSERT INTO invoices (invoiceNumber, customerId, customerName, amount, paid, dueDate, issueDate, description, status, notes) VALUES
-- INSERT INTO invoices (invoiceNumber, customerId, customerName, amount, paid, dueDate, issueDate, description, status, notes) VALUES
-- ('INV-2026-001', 1, 'Aurora Logistics', 28350.00, 0.00, '2026-06-20', '2026-05-20', 'Components and Services', 'pending', 'Awaiting payment'),
-- ('INV-2026-002', 1, 'Aurora Logistics', 15750.00, 15750.00, '2026-05-15', '2026-04-15', 'Consulting Services', 'paid', 'Fully paid'),
-- ('INV-2026-003', 1, 'Aurora Logistics', 42500.00, 0.00, '2026-07-20', '2026-06-20', 'Equipment Supply', 'current', 'Due within 30 days'),
-- 
-- ('INV-2026-004', 2, 'Vertex Manufacturing', 45100.00, 20000.00, '2026-06-10', '2026-05-10', 'Manufacturing Parts', 'partial', 'Partial payment received'),
-- ('INV-2026-005', 2, 'Vertex Manufacturing', 35800.00, 0.00, '2026-08-05', '2026-07-05', 'System Integration', 'current', 'Due within 30 days'),
-- ('INV-2026-006', 2, 'Vertex Manufacturing', 22400.00, 0.00, '2026-01-09', '2025-12-09', 'Production Services', 'overdue', 'URGENT: Highly overdue'),
-- 
-- ('INV-2026-007', 3, 'BlueHarbor Ltd', 15890.00, 0.00, '2026-04-14', '2026-03-14', 'Assembly Services', 'overdue', 'Payment overdue - follow up needed'),
-- ('INV-2026-008', 3, 'BlueHarbor Ltd', 10690.00, 5200.00, '2026-03-03', '2026-02-03', 'Quality Assurance', 'partial', 'Partial payment received'),
-- ('INV-2026-009', 3, 'BlueHarbor Ltd', 28900.00, 28900.00, '2026-05-20', '2026-04-20', 'Maintenance Services', 'paid', 'Fully paid'),
-- 
-- ('INV-2026-010', 4, 'Nimbus Retail', 5200.00, 0.00, '2026-01-09', '2025-12-09', 'Electronic Components', 'overdue', 'URGENT: Highly overdue'),
-- ('INV-2026-011', 4, 'Nimbus Retail', 18500.00, 0.00, '2026-07-25', '2026-06-25', 'Retail Goods', 'pending', 'Awaiting payment'),
-- ('INV-2026-012', 4, 'Nimbus Retail', 12300.00, 12300.00, '2026-05-10', '2026-04-10', 'Point of Sale System', 'paid', 'Fully paid'),
-- 
-- ('INV-2026-013', 5, 'Cedar Financial', 18750.00, 0.00, '2026-07-20', '2026-06-20', 'Software License', 'current', 'Due within 30 days'),
-- ('INV-2026-014', 5, 'Cedar Financial', 25600.00, 0.00, '2026-08-15', '2026-07-15', 'Consulting Services', 'current', 'Due within 30 days'),
-- ('INV-2026-015', 5, 'Cedar Financial', 31200.00, 31200.00, '2026-04-30', '2026-03-30', 'Training Programs', 'paid', 'Fully paid');
