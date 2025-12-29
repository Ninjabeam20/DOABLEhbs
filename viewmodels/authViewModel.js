// viewmodels/authViewModel.js
// VIEWMODEL - Business logic for authentication

const crypto = require('crypto');

class AuthViewModel {
  constructor(userModel) {
    this.userModel = userModel;
  }

  // Hash password using SHA-256
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  // Validate username and password
  validateCredentials(username, password) {
    const errors = [];

    if (!username || username.trim().length === 0) {
      errors.push('Username cannot be empty');
    }

    if (!password) {
      errors.push('Password is required');
    }

    if (password && password.length < 3) {
      errors.push('Password must be at least 3 characters long');
    }

    return errors;
  }

  // Register a new user
  signup(username, password, callback) {
    // Validate input
    const errors = this.validateCredentials(username, password);
    if (errors.length > 0) {
      return callback({ error: errors[0] }, null);
    }

    const cleanUsername = username.trim();
    const passwordHash = this.hashPassword(password);

    // Check if username exists
    this.userModel.findByUsername(cleanUsername, (err, results) => {
      if (err) {
        return callback({ error: 'Failed to check username', details: err }, null);
      }

      if (results.length > 0) {
        return callback({ error: 'Username already exists. Please log in instead.' }, null);
      }

      // Create new user
      this.userModel.createUser(cleanUsername, passwordHash, (err, results) => {
        if (err) {
          return callback({ error: 'Failed to create user', details: err }, null);
        }

        callback(null, {
          id: results.insertId,
          username: cleanUsername
        });
      });
    });
  }

  // Login user
  login(username, password, callback) {
    // Validate input
    if (!username || !password) {
      return callback({ error: 'Username and password are required' }, null);
    }

    const cleanUsername = username.trim();
    const passwordHash = this.hashPassword(password);

    // Find user by credentials
    this.userModel.findByCredentials(cleanUsername, passwordHash, (err, results) => {
      if (err) {
        return callback({ error: 'Login failed', details: err }, null);
      }

      if (results.length === 0) {
        return callback({ error: 'Invalid username or password' }, null);
      }

      callback(null, {
        id: results[0].id,
        username: results[0].username
      });
    });
  }
}

module.exports = AuthViewModel;