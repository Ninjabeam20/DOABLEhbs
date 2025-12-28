const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS middleware (for API requests)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname)); // Serve index.html from root

// MySQL Connection Configuration
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

// MySQL Connection
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
        process.exit(1); // Exit if database connection fails
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

// API Routes

// GET all todos (only non-deleted ones)
app.get('/api/todos', (req, res) => {
    const query = 'SELECT * FROM todos WHERE is_deleted = FALSE ORDER BY created_at DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching todos:', err);
            return res.status(500).json({ error: 'Failed to fetch todos' });
        }
        res.json(results);
    });
});

// GET all deleted todos
app.get('/api/todos/deleted', (req, res) => {
    const query = 'SELECT * FROM todos WHERE is_deleted = TRUE ORDER BY updated_at DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching deleted todos:', err);
            return res.status(500).json({ error: 'Failed to fetch deleted todos' });
        }
        res.json(results);
    });
});

// POST create new todo
app.post('/api/todos', (req, res) => {
    const { text, priority } = req.body;
    
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Todo text is required' });
    }
    
    const validPriorities = ['low', 'medium', 'high'];
    const todoPriority = validPriorities.includes(priority) ? priority : 'medium';
    
    const query = 'INSERT INTO todos (text, priority, user_id) VALUES (?, ?, NULL)';
    
    db.query(query, [text.trim(), todoPriority], (err, results) => {
        if (err) {
            console.error('Error creating todo:', err);
            return res.status(500).json({ error: 'Failed to create todo' });
        }
        
        // Fetch the newly created todo
        const selectQuery = 'SELECT * FROM todos WHERE id = ? AND is_deleted = FALSE';
        db.query(selectQuery, [results.insertId], (err, todo) => {
            if (err) {
                console.error('Error fetching new todo:', err);
                return res.status(500).json({ error: 'Todo created but failed to fetch' });
            }
            res.status(201).json(todo[0]);
        });
    });
});

// PUT update todo (for updating completed status)
app.put('/api/todos/:id', (req, res) => {
    const todoId = parseInt(req.params.id);
    
    if (isNaN(todoId)) {
        return res.status(400).json({ error: 'Invalid todo ID' });
    }
    
    const { completed } = req.body;
    
    // Validate completed is a boolean
    if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'Completed must be a boolean value' });
    }
    
    const query = 'UPDATE todos SET completed = ? WHERE id = ? AND is_deleted = FALSE';
    
    db.query(query, [completed, todoId], (err, results) => {
        if (err) {
            console.error('Error updating todo:', err);
            return res.status(500).json({ error: 'Failed to update todo' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Todo not found or deleted' });
        }
        
        // Fetch the updated todo
        const selectQuery = 'SELECT * FROM todos WHERE id = ? AND is_deleted = FALSE';
        db.query(selectQuery, [todoId], (err, todo) => {
            if (err) {
                console.error('Error fetching updated todo:', err);
                return res.status(500).json({ error: 'Todo updated but failed to fetch' });
            }
            res.json(todo[0]);
        });
    });
});

// DELETE todo (soft delete - sets is_deleted to TRUE)
app.delete('/api/todos/:id', (req, res) => {
    const todoId = parseInt(req.params.id);
    
    if (isNaN(todoId)) {
        return res.status(400).json({ error: 'Invalid todo ID' });
    }
    
    // Soft delete: set is_deleted to TRUE instead of actually deleting
    const query = 'UPDATE todos SET is_deleted = TRUE WHERE id = ? AND is_deleted = FALSE';
    
    db.query(query, [todoId], (err, results) => {
        if (err) {
            console.error('Error deleting todo:', err);
            return res.status(500).json({ error: 'Failed to delete todo' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Todo not found or already deleted' });
        }
        
        res.json({ message: 'Todo deleted successfully', id: todoId });
    });
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`DOABLE server running on http://localhost:${PORT}`);
    console.log(`Make sure MySQL database is set up using database/schema.sql`);
});

