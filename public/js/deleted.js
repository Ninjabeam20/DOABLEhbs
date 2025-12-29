// Deleted todos page - displays all soft-deleted todos
let deletedTodos = [];
let dataTable;

// API base URL for deleted todos
const API_BASE = '/api/todos/deleted';

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

    // Initialize DataTable with search enabled
    dataTable = $('#deletedTodosTable').DataTable({
      "paging": true,
      "lengthChange": true,
      "searching": true, // Enable search functionality
      "ordering": true,
      "info": true,
      "autoWidth": false,
      "responsive": true,
      "order": [[5, "desc"]], // Sort by Deleted At descending (most recently deleted first)
      "columnDefs": [
        { "orderable": true, "targets": [0, 1, 2, 3, 4, 5] } // All columns are sortable
      ],
      "language": {
        "emptyTable": "No deleted todos found.",
        "search": "Search deleted todos:"
      }
    });

    // Load deleted todos from database
    loadDeletedTodos();
  });
});

// Load deleted todos from database
function loadDeletedTodos() {
  $.ajax({
    url: API_BASE,
    method: 'GET',
    dataType: 'json',
    success: function(data) {
      deletedTodos = data;
      renderDeletedTodos();
    },
    error: function(xhr, status, error) {
      console.error('Error loading deleted todos:', error);
      console.error('Response:', xhr.responseText);
      if (xhr.status === 401) {
        window.location.href = '/';
        return;
      }
      if (xhr.status === 0) {
        showError('Cannot connect to server. Make sure the server is running on http://localhost:3000');
      } else {
        showError('Failed to load deleted todos. Error: ' + (xhr.responseJSON?.error || error));
      }
    }
  });
}

// Render deleted todos in table
function renderDeletedTodos() {
  if (!dataTable) {
    console.error('DataTable not initialized!');
    return;
  }

  // Clear existing rows
  dataTable.clear();

  // Add deleted todos to DataTable
  deletedTodos.forEach(function(todo) {
    const priorityClass = `priority-${todo.priority}`;
    const priorityBadge = getPriorityBadge(todo.priority);
    const formattedCreatedDate = moment(todo.created_at).format('YYYY-MM-DD HH:mm:ss');
    const formattedDeletedDate = moment(todo.updated_at).format('YYYY-MM-DD HH:mm:ss');
    const isCompleted = todo.completed === 1 || todo.completed === true;
    const completedBadge = isCompleted 
      ? '<span class="badge bg-success">Yes</span>' 
      : '<span class="badge bg-secondary">No</span>';
    const textStyle = isCompleted ? 'text-decoration: line-through; opacity: 0.6;' : 'opacity: 0.7;';
    
    dataTable.row.add([
      todo.id,
      `<span style="${textStyle}">${todo.text}</span>`,
      `<span class="${priorityClass}">${priorityBadge}</span>`,
      completedBadge,
      formattedCreatedDate,
      formattedDeletedDate
    ]);
  });

  dataTable.draw();
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

// Show error message
function showError(message) {
  // You can customize this to show a nice alert/toast
  alert(message);
}

