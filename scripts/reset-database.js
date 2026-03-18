const { Client } = require('pg');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'restaurant_user',
  password: process.env.DB_PASSWORD || 'restaurant_password',
  database: process.env.DB_NAME || 'restaurant_app'
};

async function resetDatabase() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    
    console.log('🗑️ Resetting database...');
    
    // Drop all tables in correct order (respecting foreign key constraints)
    await client.query('DROP TABLE IF EXISTS order_items CASCADE;');
    await client.query('DROP TABLE IF EXISTS orders CASCADE;');
    await client.query('DROP TABLE IF EXISTS menu_items CASCADE;');
    await client.query('DROP TABLE IF EXISTS tables CASCADE;');
    await client.query('DROP TABLE IF EXISTS users CASCADE;');
    
    console.log('✅ Database reset completed!');
    console.log('💡 Run "npm run setup:db" to recreate the database schema');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Run reset
resetDatabase().catch(console.error);
