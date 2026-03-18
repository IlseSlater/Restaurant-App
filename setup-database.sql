-- Create database and user
CREATE DATABASE restaurant_app;
CREATE USER restaurant_user WITH PASSWORD 'restaurant_password';
GRANT ALL PRIVILEGES ON DATABASE restaurant_app TO restaurant_user;

-- Connect to the restaurant_app database
\c restaurant_app;

-- Create tables
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'CUSTOMER',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tables (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    number INTEGER UNIQUE NOT NULL,
    qr_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'AVAILABLE',
    waiter_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (waiter_id) REFERENCES users(id)
);

CREATE TABLE menu_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    table_id TEXT NOT NULL,
    customer_id TEXT,
    status TEXT DEFAULT 'PENDING',
    total DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (table_id) REFERENCES tables(id),
    FOREIGN KEY (customer_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id TEXT NOT NULL,
    menu_item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Insert sample data
INSERT INTO users (id, email, name, role) VALUES
('user-1', 'admin@restaurant.com', 'Admin User', 'ADMIN'),
('user-2', 'waiter1@restaurant.com', 'Sarah Johnson', 'WAITER'),
('user-3', 'waiter2@restaurant.com', 'Mike Chen', 'WAITER'),
('user-4', 'customer1@example.com', 'John Doe', 'CUSTOMER'),
('user-5', 'customer2@example.com', 'Jane Smith', 'CUSTOMER');

INSERT INTO tables (id, number, qr_code, status, waiter_id) VALUES
('table-1', 1, 'QR-TABLE-001', 'AVAILABLE', 'user-2'),
('table-2', 2, 'QR-TABLE-002', 'AVAILABLE', 'user-2'),
('table-3', 3, 'QR-TABLE-003', 'AVAILABLE', 'user-2'),
('table-4', 4, 'QR-TABLE-004', 'AVAILABLE', 'user-2'),
('table-5', 5, 'QR-TABLE-005', 'AVAILABLE', 'user-3'),
('table-6', 6, 'QR-TABLE-006', 'AVAILABLE', 'user-3'),
('table-7', 7, 'QR-TABLE-007', 'AVAILABLE', 'user-3'),
('table-8', 8, 'QR-TABLE-008', 'AVAILABLE', 'user-3');

INSERT INTO menu_items (id, name, description, price, category, is_available) VALUES
('menu-1', 'Caesar Salad', 'Fresh romaine lettuce with caesar dressing, croutons, and parmesan cheese', 12.99, 'Appetizers', true),
('menu-2', 'Grilled Salmon', 'Atlantic salmon with herbs, lemon, and seasonal vegetables', 24.99, 'Main Courses', true),
('menu-3', 'Beef Burger', 'Juicy beef patty with lettuce, tomato, onion, and fries', 16.99, 'Main Courses', true),
('menu-4', 'Pasta Carbonara', 'Creamy pasta with bacon, eggs, and parmesan cheese', 18.99, 'Main Courses', true),
('menu-5', 'Chocolate Cake', 'Rich chocolate cake with vanilla ice cream', 8.99, 'Desserts', true),
('menu-6', 'Margherita Pizza', 'Fresh mozzarella, tomato sauce, and basil', 14.99, 'Main Courses', true),
('menu-7', 'Chicken Wings', 'Spicy buffalo wings with ranch dip', 11.99, 'Appetizers', true),
('menu-8', 'Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 9.99, 'Desserts', true),
('menu-9', 'Fish Tacos', 'Grilled fish with cabbage slaw and lime crema', 15.99, 'Main Courses', true),
('menu-10', 'Mozzarella Sticks', 'Crispy breaded mozzarella with marinara sauce', 8.99, 'Appetizers', true);
