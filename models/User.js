// models/User.js
// MODEL - Handles all database operations for users

class UserModel {
    constructor(db) {
      this.db = db;
    }
  
    // Find user by username
    findByUsername(username, callback) {
      const query = 'SELECT id, username FROM users WHERE username = ?';
      this.db.query(query, [username], callback);
    }
  
    // Find user by username and password hash
    findByCredentials(username, passwordHash, callback) {
      const query = 'SELECT id, username FROM users WHERE username = ? AND password_hash = ?';
      this.db.query(query, [username, passwordHash], callback);
    }
  
    // Create a new user
    createUser(username, passwordHash, callback) {
      const query = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
      this.db.query(query, [username, passwordHash], callback);
    }
  
    // Find user by ID
    findById(userId, callback) {
      const query = 'SELECT id, username FROM users WHERE id = ?';
      this.db.query(query, [userId], callback);
    }
  }
  
  module.exports = UserModel;