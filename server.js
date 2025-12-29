// server.js
// Main application entry point - Refactored with MVVM architecture

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const exphbs = require('express-handlebars');
require('dotenv').config();

// Import database connection
const db = require('./config/database');

// Import Models
const UserModel = require('./models/User');
const TodoModel = require('./models/Todo');

// Import ViewModels
const AuthViewModel = require('./viewmodels/authViewModel');
const TodoViewModel = require('./viewmodels/todoViewModel');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const todoRoutes = require('./routes/todoRoutes');

// Initialize Express app
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

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Configure Handlebars - SIMPLE VERSION
app.engine('hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: false
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Initialize Models
const userModel = new UserModel(db);
const todoModel = new TodoModel(db);

// Initialize ViewModels
const authViewModel = new AuthViewModel(userModel);
const todoViewModel = new TodoViewModel(todoModel);

// Mount API Routes
app.use('/api/auth', authRoutes(authViewModel));
app.use('/api/todos', todoRoutes(todoViewModel));

// View Routes - Serve HTML pages

// Home page
app.get('/', (req, res) => {
    res.render('index');  // Just render index.hbs, don't pass layout options
});

// Login page
app.get('/login.html', (req, res) => {
    res.render('login', {
        title: 'Login - DOABLE'
    });
});

// Deleted todos page
app.get('/delete.html', (req, res) => {
    res.render('delete', {
        title: 'Deleted Todos - DOABLE',
        activeDeleted: true,
        scriptFiles: ['deleted']
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✓ DOABLE server running on http://localhost:${PORT}`);
    console.log(`✓ Using MVVM architecture`);
    console.log(`✓ Make sure MySQL database is set up using database/schema.sql`);
});