// Todo app - connected to MySQL database via Express API
let todos = [];
let dataTable;

// API base URL
const API_BASE = '/api/todos';

// Initialize DataTable
$(document).ready(function() {
  // Check authentication first
  checkAuth(function(isAuthenticated, user) {
    if (!isAuthenticated) {
      return; // Already redirected to login
    }

    // Attach logout handler
    $('#logoutBtn').on('click', function(e) {
      e.preventDefault();
      logout();
    });

    // Check if jQuery and DataTables are loaded
    if (typeof $ === 'undefined' || typeof $.fn.DataTable === 'undefined') {
      console.error('jQuery or DataTables not loaded!');
      return;
    }

    // Initialize DataTable
    dataTable = $('#todosTable').DataTable({
      "paging": true,
      "lengthChange": true,
      "searching": true,
      "ordering": true,
      "info": true,
      "autoWidth": false,
      "responsive": true,
      "order": [[0, "desc"]], // Sort by ID descending (newest first)
      "columnDefs": [
        { "orderable": false, "targets": 5 } // Disable sorting on Actions column (now index 5)
      ],
      "language": {
        "emptyTable": "No todos yet. Add one above!"
      }
    });

    // Load todos from database
    loadTodos();
  });
});

// Load todos from database
function loadTodos() {
  $.ajax({
    url: API_BASE,
    method: 'GET',
    dataType: 'json',
    success: function(data) {
      todos = data;
      renderTodos();
    },
    error: function(xhr, status, error) {
      console.error('Error loading todos:', error);
      console.error('Response:', xhr.responseText);
      if (xhr.status === 401) {
        window.location.href = '/';
        return;
      }
      if (xhr.status === 0) {
        showError('Cannot connect to server. Make sure the server is running on http://localhost:3000');
      } else {
        showError('Failed to load todos. Error: ' + (xhr.responseJSON?.error || error));
      }
    }
  });
}

// Todo form submission
$('#todoForm').on('submit', function(e) {
  e.preventDefault();
  
  const todoText = $('#todoText').val().trim();
  const todoPriority = $('#todoPriority').val();
  
  if (todoText === '') {
    alert('Please enter a todo item!');
    return;
  }

  // Disable submit button to prevent double submission
  const submitBtn = $(this).find('button[type="submit"]');
  submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Adding...');

  // Create new todo via API
  $.ajax({
    url: API_BASE,
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
      text: todoText,
      priority: todoPriority
    }),
    success: function(newTodo) {
      todos.unshift(newTodo); // Add to beginning of array
      renderTodos();
      
      // Reset form
      $('#todoForm')[0].reset();
      $('#todoPriority').val('medium'); // Reset to default
      
      // Re-enable submit button
      submitBtn.prop('disabled', false).html('<i class="fas fa-plus"></i> Add Todo');
    },
    error: function(xhr, status, error) {
      console.error('Error creating todo:', error);
      console.error('Response:', xhr.responseText);
      if (xhr.status === 401) {
        window.location.href = '/';
        return;
      }
      const errorMsg = xhr.responseJSON?.error || error || 'Failed to create todo';
      showError('Failed to create todo: ' + errorMsg);
      
      // Re-enable submit button
      submitBtn.prop('disabled', false).html('<i class="fas fa-plus"></i> Add Todo');
    }
  });
});

// Render todos in table
function renderTodos() {
  if (!dataTable) {
    console.error('DataTable not initialized!');
    return;
  }

  // Clear existing rows
  dataTable.clear();

  // Add todos to DataTable
  todos.forEach(function(todo) {
    const priorityClass = `priority-${todo.priority}`;
    const priorityBadge = getPriorityBadge(todo.priority);
    const formattedDate = moment(todo.created_at).format('YYYY-MM-DD HH:mm:ss');
    const isCompleted = todo.completed === 1 || todo.completed === true;
    const completedChecked = isCompleted ? 'checked' : '';
    const textStyle = isCompleted ? 'text-decoration: line-through; opacity: 0.6;' : '';
    
    dataTable.row.add([
      todo.id,
      `<span style="${textStyle}">${todo.text}</span>`,
      `<span class="${priorityClass}">${priorityBadge}</span>`,
      `<div class="text-center">
        <input type="checkbox" class="todo-complete-checkbox" data-id="${todo.id}" ${completedChecked}>
      </div>`,
      formattedDate,
      `<button class="btn btn-danger btn-sm delete-todo" data-id="${todo.id}">
        <i class="fas fa-trash"></i> Delete
      </button>`
    ]);
  });

  dataTable.draw();
  
  // Re-attach event handlers
  attachDeleteHandlers();
  attachCompleteHandlers();
}

// Get priority badge
function getPriorityBadge(priority) {
  const badges = {
    'high': '<span class="badge bg-danger">High</span>',
    'medium': '<span class="badge bg-warning">Medium</span>',
    'low': '<span class="badge bg-success">Low</span>'
  };
  return badges[priority] || badges['medium'];
}

// Attach delete handlers
function attachDeleteHandlers() {
  $('.delete-todo').off('click').on('click', function() {
    const todoId = parseInt($(this).data('id'));
    const button = $(this);
    
    if (confirm('Are you sure you want to delete this todo?')) {
      // Disable button and show loading
      button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i>');
      
      // Delete todo via API
      $.ajax({
        url: `${API_BASE}/${todoId}`,
        method: 'DELETE',
        success: function() {
          // Remove from local array
          todos = todos.filter(todo => todo.id !== todoId);
          renderTodos();
        },
        error: function(xhr, status, error) {
          console.error('Error deleting todo:', error);
          console.error('Response:', xhr.responseText);
          if (xhr.status === 401) {
            window.location.href = '/';
            return;
          }
          const errorMsg = xhr.responseJSON?.error || error || 'Failed to delete todo';
          showError('Failed to delete todo: ' + errorMsg);
          
          // Re-enable button
          button.prop('disabled', false).html('<i class="fas fa-trash"></i> Delete');
        }
      });
    }
  });
}

// Attach complete checkbox handlers
function attachCompleteHandlers() {
  $('.todo-complete-checkbox').off('change').on('change', function() {
    const todoId = parseInt($(this).data('id'));
    const isCompleted = $(this).is(':checked');
    const checkbox = $(this);
    
    // Disable checkbox during update
    checkbox.prop('disabled', true);
    
    // Update todo completed status via API
    $.ajax({
      url: `${API_BASE}/${todoId}`,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({
        completed: isCompleted
      }),
      success: function(updatedTodo) {
        // Update local array
        const todoIndex = todos.findIndex(todo => todo.id === todoId);
        if (todoIndex !== -1) {
          todos[todoIndex] = updatedTodo;
        }
        
        // Re-render to update styling
        renderTodos();
      },
      error: function(xhr, status, error) {
        console.error('Error updating todo completion:', error);
        console.error('Response:', xhr.responseText);
        if (xhr.status === 401) {
          window.location.href = '/';
          return;
        }
        const errorMsg = xhr.responseJSON?.error || error || 'Failed to update todo';
        showError('Failed to update todo: ' + errorMsg);
        
        // Revert checkbox state
        checkbox.prop('checked', !isCompleted);
        checkbox.prop('disabled', false);
      }
    });
  });
}

// Show error message
function showError(message) {
  // You can customize this to show a nice alert/toast
  alert(message);
}
