const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: 'postgres' // Connect to default postgres database first
};

const targetDbConfig = {
  ...dbConfig,
  database: process.env.DB_NAME || 'restaurant_app'
};

async function setupDatabase() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    
    // Create database if it doesn't exist
    console.log('📊 Creating database...');
    await client.query(`CREATE DATABASE ${targetDbConfig.database}`);
    console.log(`✅ Database '${targetDbConfig.database}' created successfully`);
    
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`ℹ️  Database '${targetDbConfig.database}' already exists`);
    } else {
      console.error('❌ Error creating database:', error.message);
      throw error;
    }
  } finally {
    await client.end();
  }
  
  // Create user if it doesn't exist
  const userClient = new Client(dbConfig);
  try {
    console.log('👤 Creating database user...');
    await userClient.connect();
    
    const restaurantUser = process.env.DB_USER || 'restaurant_user';
    const restaurantPassword = process.env.DB_PASSWORD || 'restaurant_password';
    
    await userClient.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${restaurantUser}') THEN
          CREATE ROLE ${restaurantUser} LOGIN PASSWORD '${restaurantPassword}';
        END IF;
      END
      $$;
    `);
    
    await userClient.query(`GRANT ALL PRIVILEGES ON DATABASE ${targetDbConfig.database} TO ${restaurantUser};`);
    console.log(`✅ User '${restaurantUser}' created and granted privileges`);
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    throw error;
  } finally {
    await userClient.end();
  }
  
  console.log('🎉 Database setup completed successfully!');
  console.log('\n📋 Database Details:');
  console.log(`   Host: ${targetDbConfig.host}`);
  console.log(`   Port: ${targetDbConfig.port}`);
  console.log(`   Database: ${targetDbConfig.database}`);
  console.log(`   User: ${process.env.DB_USER || 'restaurant_user'}`);
  console.log(`   Password: ${process.env.DB_PASSWORD || 'restaurant_password'}`);
  console.log('\n🔗 Connection String:');
  console.log(`   postgresql://${process.env.DB_USER || 'restaurant_user'}:${process.env.DB_PASSWORD || 'restaurant_password'}@${targetDbConfig.host}:${targetDbConfig.port}/${targetDbConfig.database}`);
}

// Run setup
setupDatabase().catch(console.error);
