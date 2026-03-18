-- Migration: Add Company GUID System
-- Version: 2.0.0
-- Date: 2024-12-XX

-- Create companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo TEXT,
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'ZAR',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create default company
INSERT INTO companies (id, name, slug, is_active) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Default Restaurant', 'default', true);

-- Add company_id to existing tables
ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE tables ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE menu_items ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE orders ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE customer_sessions ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE customer_orders ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE waiter_calls ADD COLUMN company_id UUID REFERENCES companies(id);

-- Migrate existing data to default company
UPDATE users SET company_id = '00000000-0000-0000-0000-000000000000';
UPDATE tables SET company_id = '00000000-0000-0000-0000-000000000000';
UPDATE menu_items SET company_id = '00000000-0000-0000-0000-000000000000';
UPDATE orders SET company_id = '00000000-0000-0000-0000-000000000000';
UPDATE customer_sessions SET company_id = '00000000-0000-0000-0000-000000000000';
UPDATE customer_orders SET company_id = '00000000-0000-0000-0000-000000000000';
UPDATE waiter_calls SET company_id = '00000000-0000-0000-0000-000000000000';

-- Make company_id NOT NULL after migration
ALTER TABLE users ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE tables ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE menu_items ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE orders ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE customer_sessions ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE customer_orders ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE waiter_calls ALTER COLUMN company_id SET NOT NULL;

-- Create indexes for company-scoped queries
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_tables_company_id ON tables(company_id);
CREATE INDEX idx_menu_items_company_id ON menu_items(company_id);
CREATE INDEX idx_orders_company_id ON orders(company_id);
CREATE INDEX idx_customer_sessions_company_id ON customer_sessions(company_id);
CREATE INDEX idx_customer_orders_company_id ON customer_orders(company_id);
CREATE INDEX idx_waiter_calls_company_id ON waiter_calls(company_id);

-- Create unique constraints for company-scoped data
CREATE UNIQUE INDEX idx_tables_company_number ON tables(company_id, number);
CREATE UNIQUE INDEX idx_companies_slug ON companies(slug);

-- Add preparation_time column to menu_items if it doesn't exist
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS preparation_time INTEGER;
