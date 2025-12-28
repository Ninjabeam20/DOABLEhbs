# DOABLE - Todo App

A full-stack todo application built with Node.js, Express, MySQL, and AdminLTE.

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MySQL
- **Frontend**: HTML, CSS, JavaScript, jQuery, Bootstrap 5, AdminLTE, DataTables
- **Other**: Moment.js, Handlebars, Crypto

## Setup Instructions

### 1. Database Setup

1. Open MySQL Workbench
2. Execute the SQL commands from `database/schema.sql`
3. This will create:
   - `doable_db` database
   - `users` table (for future authentication)
   - `todos` table (for storing todos)

### 2. Environment Configuration

1. Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=doable_db
PORT=3000
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Server

**Development mode (with nodemon):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:3000`

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
doable/
├── database/
│   └── schema.sql          # Database schema
├── public/
│   ├── css/
│   │   └── custom.css      # Custom styles
│   ├── js/
│   │   └── todo.js         # Frontend JavaScript
│   ├── images/             # Image assets
│   └── lib/                # Third-party libraries (if using local files)
├── index.html              # Main HTML page
├── server.js               # Express server
├── package.json            # Node.js dependencies
└── .env                    # Environment variables (create this)
```

## API Endpoints

- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create a new todo
- `DELETE /api/todos/:id` - Delete a todo

## Features

- ✅ Add todos with priority (Low, Medium, High)
- ✅ View all todos in a searchable, sortable table
- ✅ Search todos using DataTables search
- ✅ Sort todos by clicking column headers
- ✅ Delete todos with confirmation
- ✅ Data persistence in MySQL database

## Future Features

- User authentication and authorization
- User-specific todos
- Todo completion status
- Edit todos
- Due dates and reminders

