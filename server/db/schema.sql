-- ============================================================
-- HAMSAAD DATABASE SCHEMA
-- Version 1.0
-- ============================================================

-- Clean slate (order matters due to foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS price_alerts CASCADE;
DROP TABLE IF EXISTS petty_cash CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS daily_reports CASCADE;
DROP TABLE IF EXISTS waybills CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN (
    'admin', 'manager', 'storekeeper', 'cashier'
  )),
  access_code VARCHAR(20) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CLIENTS TABLE
-- ============================================================
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  client_id VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  credit_terms INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  added_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- BRANDS TABLE
-- ============================================================
CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  brand_id INTEGER NOT NULL REFERENCES brands(id),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  size_variant VARCHAR(50) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  minimum_threshold INTEGER NOT NULL DEFAULT 5,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- STOCK MOVEMENTS TABLE
-- ============================================================
CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN (
    'stock_in', 'stock_out', 'adjustment'
  )),
  quantity INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_id INTEGER,
  reference_type VARCHAR(30),
  note TEXT,
  performed_by INTEGER REFERENCES users(id),
  confirmed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(30) UNIQUE NOT NULL,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  status VARCHAR(20) NOT NULL DEFAULT 'created' CHECK (status IN (
    'created', 'confirmed', 'released', 'completed', 'cancelled'
  )),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  confirmed_by INTEGER REFERENCES users(id),
  released_by INTEGER REFERENCES users(id),
  completed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  released_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ORDER ITEMS TABLE
-- ============================================================
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INVOICES TABLE
-- ============================================================
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(30) UNIQUE NOT NULL,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  total_amount NUMERIC(12,2) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid', 'part_paid', 'paid'
  )),
  amount_paid NUMERIC(12,2) DEFAULT 0,
  balance NUMERIC(12,2),
  due_date DATE,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- WAYBILLS TABLE
-- ============================================================
CREATE TABLE waybills (
  id SERIAL PRIMARY KEY,
  waybill_number VARCHAR(30) UNIQUE NOT NULL,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  collector_name VARCHAR(150),
  storekeeper_id INTEGER REFERENCES users(id),
  scanned_copy_url TEXT,
  signed_copy_url TEXT,
  manager_approved BOOLEAN DEFAULT FALSE,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DAILY REPORTS TABLE
-- ============================================================
CREATE TABLE daily_reports (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  opening_stock JSONB,
  closing_stock JSONB,
  goods_released JSONB,
  stock_received JSONB,
  total_items_released INTEGER DEFAULT 0,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'approved', 'rejected'
  )),
  submitted_by INTEGER REFERENCES users(id),
  submitted_at TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  receipt_number VARCHAR(30) UNIQUE NOT NULL,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  amount NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN (
    'cash', 'bank_transfer', 'cheque', 'pos'
  )),
  reference_number VARCHAR(100),
  bank_name VARCHAR(100),
  is_banked BOOLEAN DEFAULT FALSE,
  banked_at TIMESTAMP,
  teller_name VARCHAR(100),
  notes TEXT,
  recorded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- EXPENSES TABLE
-- ============================================================
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'logistics', 'loading', 'office', 'maintenance',
    'staff_welfare', 'bank_charges', 'miscellaneous'
  )),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN (
    'cash', 'bank_transfer', 'cheque', 'pos'
  )),
  authorised_by VARCHAR(100),
  receipt_url TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PETTY CASH TABLE
-- ============================================================
CREATE TABLE petty_cash (
  id SERIAL PRIMARY KEY,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN (
    'opening', 'disbursement', 'topup', 'closing'
  )),
  amount NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  expense_id INTEGER REFERENCES expenses(id),
  note TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PRICE ALERTS TABLE
-- ============================================================
CREATE TABLE price_alerts (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  products_affected JSONB,
  sent_to VARCHAR(20) NOT NULL CHECK (sent_to IN (
    'all_clients', 'selected_clients'
  )),
  client_ids JSONB,
  channel VARCHAR(20) NOT NULL DEFAULT 'email' CHECK (channel IN (
    'email', 'whatsapp', 'both'
  )),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'failed'
  )),
  sent_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  user_name VARCHAR(150),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50),
  record_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(payment_status);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);

-- ============================================================
-- SEED: DEFAULT ADMIN USER
-- ============================================================
-- Password is: Admin@1234 (hashed with bcrypt)
INSERT INTO users (full_name, email, password, role, access_code, is_active)
VALUES (
  'System Administrator',
  'admin@hamsaad.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  'ADMIN001',
  TRUE
);

-- ============================================================
-- SEED: DEFAULT BRANDS
-- ============================================================
INSERT INTO brands (name, description, created_by) VALUES
('Total Energies', 'TotalEnergies lubricant products', 1),
('Shell', 'Shell lubricant products', 1),
('Mobil', 'Mobil lubricant products', 1),
('Castrol', 'Castrol lubricant products', 1);

-- ============================================================
-- SEED: DEFAULT CATEGORIES
-- ============================================================
INSERT INTO categories (name, description, created_by) VALUES
('Engine Oil', 'Engine and motor oil products', 1),
('Grease', 'Grease and lubricating compounds', 1),
('Other Supplies', 'Other lubricant and related supplies', 1);

COMMIT;