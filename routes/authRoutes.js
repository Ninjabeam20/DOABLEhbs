// routes/authRoutes.js
// API routes for authentication

const express = require('express');
const router = express.Router();

// Middleware to check authentication
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
}

module.exports = (authViewModel) => {
    // POST /signup - Create new user
    router.post('/signup', (req, res) => {
        const { username, password } = req.body;

        authViewModel.signup(username, password, (err, user) => {
            if (err) {
                console.error('Signup error:', err);
                const statusCode = err.error === 'Username already exists. Please log in instead.' ? 409 : 400;
                return res.status(statusCode).json({ error: err.error });
            }

            // Auto-login after signup
            req.session.userId = user.id;
            req.session.username = user.username;

            res.status(201).json({
                message: 'User created successfully',
                user: user
            });
        });
    });

    // POST /login - Authenticate user
    router.post('/login', (req, res) => {
        const { username, password } = req.body;

        authViewModel.login(username, password, (err, user) => {
            if (err) {
                console.error('Login error:', err);
                const statusCode = err.error === 'Invalid username or password' ? 401 : 400;
                return res.status(statusCode).json({ error: err.error });
            }

            // Create session
            req.session.userId = user.id;
            req.session.username = user.username;

            res.json({
                message: 'Login successful',
                user: user
            });
        });
    });

    // GET /me - Get current user info
    router.get('/me', requireAuth, (req, res) => {
        res.json({
            id: req.session.userId,
            username: req.session.username
        });
    });

    // POST /logout - Logout user
    router.post('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({ error: 'Logout failed' });
            }
            res.json({ message: 'Logout successful' });
        });
    });

    return router;
};