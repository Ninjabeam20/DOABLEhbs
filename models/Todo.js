// models/Todo.js
// MODEL - Handles all database operations for todos

class TodoModel {
    constructor(db) {
      this.db = db;
    }
  
    // Get all non-deleted todos for a user
    getAllTodos(userId, callback) {
      const query = 'SELECT * FROM todos WHERE is_deleted = FALSE AND user_id = ? ORDER BY created_at DESC';
      this.db.query(query, [userId], callback);
    }
  
    // Get all deleted todos for a user
    getDeletedTodos(userId, callback) {
      const query = 'SELECT * FROM todos WHERE is_deleted = TRUE AND user_id = ? ORDER BY updated_at DESC';
      this.db.query(query, [userId], callback);
    }
  
    // Create a new todo
    createTodo(text, priority, userId, callback) {
      const query = 'INSERT INTO todos (text, priority, user_id) VALUES (?, ?, ?)';
      this.db.query(query, [text, priority, userId], callback);
    }
  
    // Get a single todo by ID
    getTodoById(todoId, userId, callback) {
      const query = 'SELECT * FROM todos WHERE id = ? AND is_deleted = FALSE AND user_id = ?';
      this.db.query(query, [todoId, userId], callback);
    }
  
    // Update todo completion status
    updateTodoCompletion(todoId, completed, userId, callback) {
      const query = 'UPDATE todos SET completed = ? WHERE id = ? AND is_deleted = FALSE AND user_id = ?';
      this.db.query(query, [completed, todoId, userId], callback);
    }
  
    // Soft delete a todo (set is_deleted to TRUE)
    deleteTodo(todoId, userId, callback) {
      const query = 'UPDATE todos SET is_deleted = TRUE WHERE id = ? AND is_deleted = FALSE AND user_id = ?';
      this.db.query(query, [todoId, userId], callback);
    }
  }
  
  module.exports = TodoModel;