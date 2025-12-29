// config/database.js
// Database configuration and connection

const mysql = require('mysql2');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'doable_db'
};

// Log connection config (without password for security)
console.log('Attempting to connect to MySQL:');
console.log(`  Host: ${dbConfig.host}`);
console.log(`  User: ${dbConfig.user}`);
console.log(`  Database: ${dbConfig.database}`);
console.log(`  Password: ${dbConfig.password ? '***' : '(empty)'}`);

// Create MySQL connection
const db = mysql.createConnection(dbConfig);

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err.message);
        console.log('\nTroubleshooting:');
        console.log('1. Make sure MySQL server is running');
        console.log('2. Verify credentials in .env file');
        console.log('3. Ensure database "doable_db" exists');
        console.log('4. Run database/schema.sql in MySQL Workbench');
        process.exit(1);
    } else {
        console.log('✓ Connected to MySQL database successfully!');
    }
});

// Handle connection errors
db.on('error', (err) => {
    console.error('MySQL connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Attempting to reconnect...');
    }
});

module.exports = db;