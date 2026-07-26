-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoiceNumber VARCHAR(50) NOT NULL UNIQUE,
  customerId INT,
  customerName VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paid DECIMAL(10, 2) DEFAULT 0,
  dueDate DATETIME NOT NULL,
  issueDate DATETIME NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_invoice_number (invoiceNumber),
  INDEX idx_customer_id (customerId),
  INDEX idx_status (status)
);
