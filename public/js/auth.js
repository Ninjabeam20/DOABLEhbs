// Authentication handling for login and signup

// Toggle between login and signup forms
$(document).ready(function() {
  $('#showSignupLink').on('click', function(e) {
    e.preventDefault();
    $('#loginFormContainer').hide();
    $('#signupFormContainer').show();
    clearMessages();
    clearForms();
  });

  $('#showLoginLink').on('click', function(e) {
    e.preventDefault();
    $('#signupFormContainer').hide();
    $('#loginFormContainer').show();
    clearMessages();
    clearForms();
  });

  // Login form submission
  $('#loginForm').on('submit', function(e) {
    e.preventDefault();
    const username = $('#loginUsername').val().trim();
    const password = $('#loginPassword').val();

    if (!username || !password) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    login(username, password);
  });

  // Signup form submission
  $('#signupForm').on('submit', function(e) {
    e.preventDefault();
    const username = $('#signupUsername').val().trim();
    const password = $('#signupPassword').val();
    const passwordConfirm = $('#signupPasswordConfirm').val();

    if (!username || !password || !passwordConfirm) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    if (password !== passwordConfirm) {
      showMessage('Passwords do not match', 'error');
      return;
    }

    if (password.length < 3) {
      showMessage('Password must be at least 3 characters long', 'error');
      return;
    }

    signup(username, password);
  });
});

// Login function
function login(username, password) {
  const submitBtn = $('#loginForm button[type="submit"]');
  submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Signing In...');

  $.ajax({
    url: '/api/auth/login',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ username, password }),
    success: function(data) {
      showMessage('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 500);
    },
    error: function(xhr) {
      const errorMsg = xhr.responseJSON?.error || 'Login failed. Please try again.';
      showMessage(errorMsg, 'error');
      submitBtn.prop('disabled', false).html('<i class="fas fa-sign-in-alt"></i> Sign In');
    }
  });
}

// Signup function
function signup(username, password) {
  const submitBtn = $('#signupForm button[type="submit"]');
  submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Signing Up...');

  $.ajax({
    url: '/api/auth/signup',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ username, password }),
    success: function(data) {
      showMessage('Account created successfully! Logging you in...', 'success');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 500);
    },
    error: function(xhr) {
      const errorMsg = xhr.responseJSON?.error || 'Signup failed. Please try again.';
      showMessage(errorMsg, 'error');
      
      // If username exists, show link to login
      if (xhr.status === 409 || errorMsg.toLowerCase().includes('exists')) {
        showMessage(errorMsg + ' <a href="#" id="switchToLogin" style="color: #fff; text-decoration: underline;">Click here to log in</a>', 'error');
        $('#switchToLogin').on('click', function(e) {
          e.preventDefault();
          $('#signupFormContainer').hide();
          $('#loginFormContainer').show();
          $('#loginUsername').val(username);
          clearMessages();
        });
      }
      
      submitBtn.prop('disabled', false).html('<i class="fas fa-user-plus"></i> Sign Up');
    }
  });
}

// Show message
function showMessage(message, type) {
  const alertClass = type === 'error' ? 'alert-danger' : 'alert-success';
  const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
  
  const messageHtml = `
    <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
      <i class="fas ${icon}"></i> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  
  $('#messageContainer').html(messageHtml);
}

// Clear messages
function clearMessages() {
  $('#messageContainer').empty();
}

// Clear forms
function clearForms() {
  $('#loginForm')[0].reset();
  $('#signupForm')[0].reset();
}

// Check if user is authenticated (for protected pages)
function checkAuth(callback) {
  $.ajax({
    url: '/api/auth/me',
    method: 'GET',
    success: function(user) {
      if (callback) callback(true, user);
    },
    error: function(xhr) {
      if (callback) callback(false, null);
      if (xhr.status === 401) {
        window.location.href = '/login.html';
      }
    }
  });
}

// Logout function
function logout() {
  $.ajax({
    url: '/api/auth/logout',
    method: 'POST',
    success: function() {
      window.location.href = '/login.html';
    },
    error: function() {
      // Even if logout fails, redirect to login
      window.location.href = '/login.html';
    }
  });
}

