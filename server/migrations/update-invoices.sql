-- Disable safe updates mode
SET SQL_SAFE_UPDATES=0;

-- Clear existing invoices and reset auto-increment
DELETE FROM invoices;
ALTER TABLE invoices AUTO_INCREMENT = 1;

-- Re-enable safe updates mode
SET SQL_SAFE_UPDATES=1;

-- Insert new invoices from HTML
INSERT INTO invoices (invoiceNumber, customerId, customerName, amount, paid, dueDate, issueDate, description, status, notes) VALUES
('INV-2026-013', NULL, 'Solstice Media', 19838.00, 0.00, '2026-05-16', '2026-05-02', 'Invoice (Subtotal: $18,200 + GST: $1,638)', 'pending', 'Status: Sent'),
('INV-2026-012', 1, 'Aurora Logistics', 13625.00, 13625.00, '2026-05-28', '2026-04-28', 'Invoice (Subtotal: $12,500 + GST: $1,125)', 'paid', 'Status: Paid'),
('INV-2026-011', 2, 'Vertex Manufacturing', 27250.00, 0.00, '2026-05-15', '2026-04-15', 'Invoice (Subtotal: $25,000 + GST: $2,250)', 'overdue', 'Status: Overdue');
