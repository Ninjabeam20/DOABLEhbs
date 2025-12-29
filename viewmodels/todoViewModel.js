// viewmodels/todoViewModel.js
// VIEWMODEL - Business logic for todos (between Model and View)

class TodoViewModel {
    constructor(todoModel) {
      this.todoModel = todoModel;
    }
  
    // Get all active todos
    getActiveTodos(userId, callback) {
      this.todoModel.getAllTodos(userId, (err, results) => {
        if (err) {
          return callback({ error: 'Failed to fetch todos', details: err }, null);
        }
        callback(null, results);
      });
    }
  
    // Get all deleted todos
    getDeletedTodos(userId, callback) {
      this.todoModel.getDeletedTodos(userId, (err, results) => {
        if (err) {
          return callback({ error: 'Failed to fetch deleted todos', details: err }, null);
        }
        callback(null, results);
      });
    }
  
    // Create a new todo with validation
    createTodo(text, priority, userId, callback) {
      // Validation
      if (!text || !text.trim()) {
        return callback({ error: 'Todo text is required' }, null);
      }
  
      const validPriorities = ['low', 'medium', 'high'];
      const todoPriority = validPriorities.includes(priority) ? priority : 'medium';
      const cleanText = text.trim();
  
      // Create todo
      this.todoModel.createTodo(cleanText, todoPriority, userId, (err, results) => {
        if (err) {
          return callback({ error: 'Failed to create todo', details: err }, null);
        }
  
        // Fetch the newly created todo
        this.todoModel.getTodoById(results.insertId, userId, (err, todo) => {
          if (err) {
            return callback({ error: 'Todo created but failed to fetch', details: err }, null);
          }
          callback(null, todo[0]);
        });
      });
    }
  
    // Update todo completion status
    updateTodoCompletion(todoId, completed, userId, callback) {
      // Validation
      if (typeof completed !== 'boolean') {
        return callback({ error: 'Completed must be a boolean value' }, null);
      }
  
      this.todoModel.updateTodoCompletion(todoId, completed, userId, (err, results) => {
        if (err) {
          return callback({ error: 'Failed to update todo', details: err }, null);
        }
  
        if (results.affectedRows === 0) {
          return callback({ error: 'Todo not found or deleted' }, null);
        }
  
        // Fetch the updated todo
        this.todoModel.getTodoById(todoId, userId, (err, todo) => {
          if (err) {
            return callback({ error: 'Todo updated but failed to fetch', details: err }, null);
          }
          callback(null, todo[0]);
        });
      });
    }
  
    // Delete a todo (soft delete)
    deleteTodo(todoId, userId, callback) {
      this.todoModel.deleteTodo(todoId, userId, (err, results) => {
        if (err) {
          return callback({ error: 'Failed to delete todo', details: err }, null);
        }
  
        if (results.affectedRows === 0) {
          return callback({ error: 'Todo not found or already deleted' }, null);
        }
  
        callback(null, { message: 'Todo deleted successfully', id: todoId });
      });
    }
  }
  
  module.exports = TodoViewModel;