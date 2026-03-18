const { Client } = require('pg');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'restaurant_user',
  password: process.env.DB_PASSWORD || 'restaurant_password',
  database: process.env.DB_NAME || 'restaurant_app'
};

async function seedDatabase() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    
    console.log('🌱 Seeding database with initial data...');
    
    // Create tables
    console.log('📋 Creating tables...');
    await client.query(`
      INSERT INTO tables (id, number, "qrCode", status) VALUES
      ('table-1', 1, 'QR-TABLE-001', 'AVAILABLE'),
      ('table-2', 2, 'QR-TABLE-002', 'AVAILABLE'),
      ('table-3', 3, 'QR-TABLE-003', 'AVAILABLE'),
      ('table-4', 4, 'QR-TABLE-004', 'AVAILABLE'),
      ('table-5', 5, 'QR-TABLE-005', 'AVAILABLE'),
      ('table-6', 6, 'QR-TABLE-006', 'AVAILABLE'),
      ('table-7', 7, 'QR-TABLE-007', 'AVAILABLE'),
      ('table-8', 8, 'QR-TABLE-008', 'AVAILABLE')
      ON CONFLICT (number) DO NOTHING;
    `);
    
    // Create menu items
    console.log('🍽️ Creating menu items...');
    await client.query(`
      INSERT INTO menu_items (id, name, description, price, category, "isAvailable") VALUES
      ('menu-1', 'Caesar Salad', 'Fresh romaine lettuce with caesar dressing, croutons, and parmesan cheese', 12.99, 'Appetizers', true),
      ('menu-2', 'Grilled Salmon', 'Atlantic salmon with herbs, lemon, and seasonal vegetables', 24.99, 'Main Courses', true),
      ('menu-3', 'Beef Burger', 'Juicy beef patty with lettuce, tomato, onion, and fries', 16.99, 'Main Courses', true),
      ('menu-4', 'Pasta Carbonara', 'Creamy pasta with bacon, eggs, and parmesan cheese', 18.99, 'Main Courses', true),
      ('menu-5', 'Chocolate Cake', 'Rich chocolate cake with vanilla ice cream', 8.99, 'Desserts', true),
      ('menu-6', 'Margherita Pizza', 'Fresh mozzarella, tomato sauce, and basil', 14.99, 'Main Courses', true),
      ('menu-7', 'Chicken Wings', 'Spicy buffalo wings with ranch dip', 11.99, 'Appetizers', true),
      ('menu-8', 'Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 9.99, 'Desserts', true),
      ('menu-9', 'Fish Tacos', 'Grilled fish with cabbage slaw and lime crema', 15.99, 'Main Courses', true),
      ('menu-10', 'Mozzarella Sticks', 'Crispy breaded mozzarella with marinara sauce', 8.99, 'Appetizers', true)
      ON CONFLICT (id) DO NOTHING;
    `);
    
    // Create sample users
    console.log('👥 Creating sample users...');
    await client.query(`
      INSERT INTO users (id, email, name, role) VALUES
      ('user-1', 'admin@restaurant.com', 'Admin User', 'ADMIN'),
      ('user-2', 'waiter1@restaurant.com', 'Sarah Johnson', 'WAITER'),
      ('user-3', 'waiter2@restaurant.com', 'Mike Chen', 'WAITER'),
      ('user-4', 'customer1@example.com', 'John Doe', 'CUSTOMER'),
      ('user-5', 'customer2@example.com', 'Jane Smith', 'CUSTOMER')
      ON CONFLICT (email) DO NOTHING;
    `);
    
    // Assign waiters to some tables
    console.log('👨‍🍳 Assigning waiters to tables...');
    await client.query(`
      UPDATE tables SET "waiterId" = 'user-2' WHERE number IN (1, 2, 3, 4);
      UPDATE tables SET "waiterId" = 'user-3' WHERE number IN (5, 6, 7, 8);
    `);
    
    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Sample Data Created:');
    console.log('   - 8 Tables with QR codes');
    console.log('   - 10 Menu items across different categories');
    console.log('   - 5 Sample users (1 Admin, 2 Waiters, 2 Customers)');
    console.log('   - Waiters assigned to tables');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Run seeding
seedDatabase().catch(console.error);
