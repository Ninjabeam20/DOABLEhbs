const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const session = require('express-session');
const exphbs = require('express-handlebars');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'doable-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

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

// Configure Handlebars
app.engine('hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: false,
    layoutsDir: path.join(__dirname, 'views/layouts')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

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

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
}

// Hash password using SHA-256
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// API Routes - Authentication

// POST /api/auth/signup - Create new user
app.post('/api/auth/signup', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    if (username.trim().length === 0) {
        return res.status(400).json({ error: 'Username cannot be empty' });
    }
    
    if (password.length < 3) {
        return res.status(400).json({ error: 'Password must be at least 3 characters long' });
    }
    
    const passwordHash = hashPassword(password);
    
    // Check if username already exists
    const checkQuery = 'SELECT id FROM users WHERE username = ?';
    db.query(checkQuery, [username.trim()], (err, results) => {
        if (err) {
            console.error('Error checking username:', err);
            return res.status(500).json({ error: 'Failed to check username' });
        }
        
        if (results.length > 0) {
            return res.status(409).json({ error: 'Username already exists. Please log in instead.' });
        }
        
        // Create new user
        const insertQuery = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
        db.query(insertQuery, [username.trim(), passwordHash], (err, results) => {
            if (err) {
                console.error('Error creating user:', err);
                return res.status(500).json({ error: 'Failed to create user' });
            }
            
            // Auto-login after signup
            req.session.userId = results.insertId;
            req.session.username = username.trim();
            
            res.status(201).json({
                message: 'User created successfully',
                user: {
                    id: results.insertId,
                    username: username.trim()
                }
            });
        });
    });
});

// POST /api/auth/login - Authenticate user
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const passwordHash = hashPassword(password);
    
    const query = 'SELECT id, username FROM users WHERE username = ? AND password_hash = ?';
    db.query(query, [username.trim(), passwordHash], (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).json({ error: 'Login failed' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        // Create session
        req.session.userId = results[0].id;
        req.session.username = results[0].username;
        
        res.json({
            message: 'Login successful',
            user: {
                id: results[0].id,
                username: results[0].username
            }
        });
    });
});

// GET /api/auth/me - Get current user info
app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({
        id: req.session.userId,
        username: req.session.username
    });
});

// POST /api/auth/logout - Logout user
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// API Routes - Todos

// GET all todos (only non-deleted ones for authenticated user)
app.get('/api/todos', requireAuth, (req, res) => {
    const query = 'SELECT * FROM todos WHERE is_deleted = FALSE AND user_id = ? ORDER BY created_at DESC';
    
    db.query(query, [req.session.userId], (err, results) => {
        if (err) {
            console.error('Error fetching todos:', err);
            return res.status(500).json({ error: 'Failed to fetch todos' });
        }
        res.json(results);
    });
});

// GET all deleted todos (for authenticated user)
app.get('/api/todos/deleted', requireAuth, (req, res) => {
    const query = 'SELECT * FROM todos WHERE is_deleted = TRUE AND user_id = ? ORDER BY updated_at DESC';
    
    db.query(query, [req.session.userId], (err, results) => {
        if (err) {
            console.error('Error fetching deleted todos:', err);
            return res.status(500).json({ error: 'Failed to fetch deleted todos' });
        }
        res.json(results);
    });
});

// POST create new todo
app.post('/api/todos', requireAuth, (req, res) => {
    const { text, priority } = req.body;
    
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Todo text is required' });
    }
    
    const validPriorities = ['low', 'medium', 'high'];
    const todoPriority = validPriorities.includes(priority) ? priority : 'medium';
    
    const query = 'INSERT INTO todos (text, priority, user_id) VALUES (?, ?, ?)';
    
    db.query(query, [text.trim(), todoPriority, req.session.userId], (err, results) => {
        if (err) {
            console.error('Error creating todo:', err);
            return res.status(500).json({ error: 'Failed to create todo' });
        }
        
        // Fetch the newly created todo
        const selectQuery = 'SELECT * FROM todos WHERE id = ? AND is_deleted = FALSE AND user_id = ?';
        db.query(selectQuery, [results.insertId, req.session.userId], (err, todo) => {
            if (err) {
                console.error('Error fetching new todo:', err);
                return res.status(500).json({ error: 'Todo created but failed to fetch' });
            }
            res.status(201).json(todo[0]);
        });
    });
});

// PUT update todo (for updating completed status)
app.put('/api/todos/:id', requireAuth, (req, res) => {
    const todoId = parseInt(req.params.id);
    
    if (isNaN(todoId)) {
        return res.status(400).json({ error: 'Invalid todo ID' });
    }
    
    const { completed } = req.body;
    
    // Validate completed is a boolean
    if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'Completed must be a boolean value' });
    }
    
    const query = 'UPDATE todos SET completed = ? WHERE id = ? AND is_deleted = FALSE AND user_id = ?';
    
    db.query(query, [completed, todoId, req.session.userId], (err, results) => {
        if (err) {
            console.error('Error updating todo:', err);
            return res.status(500).json({ error: 'Failed to update todo' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Todo not found or deleted' });
        }
        
        // Fetch the updated todo
        const selectQuery = 'SELECT * FROM todos WHERE id = ? AND is_deleted = FALSE AND user_id = ?';
        db.query(selectQuery, [todoId, req.session.userId], (err, todo) => {
            if (err) {
                console.error('Error fetching updated todo:', err);
                return res.status(500).json({ error: 'Todo updated but failed to fetch' });
            }
            res.json(todo[0]);
        });
    });
});

// DELETE todo (soft delete - sets is_deleted to TRUE)
app.delete('/api/todos/:id', requireAuth, (req, res) => {
    const todoId = parseInt(req.params.id);
    
    if (isNaN(todoId)) {
        return res.status(400).json({ error: 'Invalid todo ID' });
    }
    
    // Soft delete: set is_deleted to TRUE instead of actually deleting
    const query = 'UPDATE todos SET is_deleted = TRUE WHERE id = ? AND is_deleted = FALSE AND user_id = ?';
    
    db.query(query, [todoId, req.session.userId], (err, results) => {
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
    res.render('index', {
        title: 'DOABLE - Todo App',
        activeTodos: true,
        scriptFiles: ['todo']
    });
});

// Serve login.html for login route
app.get('/login.html', (req, res) => {
    res.render('login', {
        title: 'Login - DOABLE'
    });
});

// Serve delete.html for delete route
app.get('/delete.html', (req, res) => {
    res.render('delete', {
        title: 'Deleted Todos - DOABLE',
        activeDeleted: true,
        scriptFiles: ['deleted']
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`DOABLE server running on http://localhost:${PORT}`);
    console.log(`Make sure MySQL database is set up using database/schema.sql`);
});

