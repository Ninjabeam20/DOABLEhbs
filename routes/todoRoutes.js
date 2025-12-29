// routes/todoRoutes.js
// API routes for todo operations

const express = require('express');
const router = express.Router();

// Middleware to check authentication
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
}

module.exports = (todoViewModel) => {
    // GET all active todos
    router.get('/', requireAuth, (req, res) => {
        todoViewModel.getActiveTodos(req.session.userId, (err, todos) => {
            if (err) {
                console.error('Error fetching todos:', err);
                return res.status(500).json({ error: err.error || 'Failed to fetch todos' });
            }
            res.json(todos);
        });
    });

    // GET all deleted todos
    router.get('/deleted', requireAuth, (req, res) => {
        todoViewModel.getDeletedTodos(req.session.userId, (err, todos) => {
            if (err) {
                console.error('Error fetching deleted todos:', err);
                return res.status(500).json({ error: err.error || 'Failed to fetch deleted todos' });
            }
            res.json(todos);
        });
    });

    // POST create new todo
    router.post('/', requireAuth, (req, res) => {
        const { text, priority } = req.body;

        todoViewModel.createTodo(text, priority, req.session.userId, (err, newTodo) => {
            if (err) {
                console.error('Error creating todo:', err);
                const statusCode = err.error === 'Todo text is required' ? 400 : 500;
                return res.status(statusCode).json({ error: err.error });
            }
            res.status(201).json(newTodo);
        });
    });

    // PUT update todo completion status
    router.put('/:id', requireAuth, (req, res) => {
        const todoId = parseInt(req.params.id);

        if (isNaN(todoId)) {
            return res.status(400).json({ error: 'Invalid todo ID' });
        }

        const { completed } = req.body;

        todoViewModel.updateTodoCompletion(todoId, completed, req.session.userId, (err, updatedTodo) => {
            if (err) {
                console.error('Error updating todo:', err);
                const statusCode = err.error === 'Completed must be a boolean value' ? 400 : 
                                   err.error === 'Todo not found or deleted' ? 404 : 500;
                return res.status(statusCode).json({ error: err.error });
            }
            res.json(updatedTodo);
        });
    });

    // DELETE todo (soft delete)
    router.delete('/:id', requireAuth, (req, res) => {
        const todoId = parseInt(req.params.id);

        if (isNaN(todoId)) {
            return res.status(400).json({ error: 'Invalid todo ID' });
        }

        todoViewModel.deleteTodo(todoId, req.session.userId, (err, result) => {
            if (err) {
                console.error('Error deleting todo:', err);
                const statusCode = err.error === 'Todo not found or already deleted' ? 404 : 500;
                return res.status(statusCode).json({ error: err.error });
            }
            res.json(result);
        });
    });

    return router;
};