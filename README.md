# Expense Sharing Web Application (Splitwise Clone)

A production-grade full-stack expense sharing platform built with React, Node.js, Express, and PostgreSQL. This project demonstrates modern web development practices, DevOps workflows, and cloud-ready architecture.

## 🎯 Project Overview

This application allows users to:
- Create accounts and authenticate securely with JWT
- Create expense groups with friends
- Add expenses and split them equally or with custom amounts
- Automatically calculate balances (who owes whom)
- View detailed balance breakdowns across all groups

**Example Scenario:**
```
Dinner = ₹3000
Paid by: Alice
Split between: Alice, Bob, Charlie

Result:
- Alice is owed ₹2000
- Bob owes ₹1000
- Charlie owes ₹1000
```

## 🏗️ System Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   React     │─────▶│  Node.js    │─────▶│ PostgreSQL  │
│  Frontend   │      │   Backend   │      │  Database   │
│  (Port 3000)│◀─────│  (Port 5000)│◀─────│  (Port 5432)│
└─────────────┘      └─────────────┘      └─────────────┘
      │                     │                     │
      └─────────────────────┴─────────────────────┘
                           │
                    JWT Authentication
                    RESTful API
                    CORS Enabled
```

## 🛠️ Tech Stack

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Sequelize** - ORM for PostgreSQL
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **express-validator** - Input validation
- **Winston** - Logging
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Database
- **PostgreSQL** - Relational database
- **Sequelize Migrations** - Schema versioning

### DevOps (Coming Soon)
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Jenkins** - CI/CD pipeline
- **Kubernetes** - Container orchestration
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards

## 📁 Project Structure

```
splitwise-devops-project/
├── backend/                 # Node.js Express API
│   ├── config/             # Database configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Custom middleware
│   ├── migrations/         # Database migrations
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   ├── scripts/            # Utility scripts
│   ├── tests/              # Test files
│   ├── server.js           # Entry point
│   └── package.json        # Dependencies
├── frontend/               # React application
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   └── App.js          # Root component
│   └── package.json        # Dependencies
├── database/               # SQL scripts
│   ├── schema.sql          # Database schema
│   └── seeds.sql           # Sample data
├── docker/                 # Docker configurations (TBD)
├── k8s/                    # Kubernetes manifests (TBD)
├── jenkins/                # CI/CD pipeline (TBD)
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd splitwise-devops-project
```

### Step 2: Set Up PostgreSQL Database

1. **Start PostgreSQL service:**
   ```bash
   # On Linux
   sudo systemctl start postgresql
   
   # On macOS (with Homebrew)
   brew services start postgresql
   
   # On Windows
   # Start from Services or pgAdmin
   ```

2. **Create database user (if needed):**
   ```bash
   sudo -u postgres psql
   ```
   
   In PostgreSQL shell:
   ```sql
   CREATE USER postgres WITH PASSWORD 'postgres';
   ALTER USER postgres WITH SUPERUSER;
   \q
   ```

### Step 3: Set Up Backend

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env file with your database credentials
   ```

4. **Set up database:**
   ```bash
   # Create database and run migrations
   node scripts/setup-database.js
   
   # Or with sample data
   node scripts/setup-database.js --seed
   ```

5. **Start the backend server:**
   ```bash
   npm start
   ```
   
   Server will run on `http://localhost:5000`

### Step 4: Set Up Frontend

1. **Open a new terminal and navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Default API URL is http://localhost:5000
   ```

4. **Start the frontend development server:**
   ```bash
   npm start
   ```
   
   Application will open at `http://localhost:3000`

### Step 5: Test the Application

1. **Register a new account:**
   - Go to `http://localhost:3000/signup`
   - Fill in name, email, and password
   - Click "Sign Up"

2. **Login:**
   - Use your registered credentials
   - You'll be redirected to the dashboard

3. **Create a group:**
   - Click "Create Group" on dashboard
   - Enter group name and optionally add members
   - Click "Create Group"

4. **Add an expense:**
   - Go to a group detail page
   - Click "Add Expense"
   - Fill in amount, description, who paid, and split type
   - Click "Create Expense"

5. **View balances:**
   - Click "View Details" on dashboard balance card
   - See detailed breakdown of who owes whom

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📊 Database Schema

### Tables

1. **users** - User accounts
   - id (UUID, PK)
   - name, email (unique), password_hash
   - created_at, updated_at

2. **groups** - Expense groups
   - id (UUID, PK)
   - name, created_by (FK → users)
   - created_at, updated_at

3. **group_members** - Group membership
   - id (UUID, PK)
   - group_id (FK → groups)
   - user_id (FK → users)
   - joined_at

4. **expenses** - Expense records
   - id (UUID, PK)
   - group_id (FK → groups)
   - paid_by (FK → users)
   - amount, description, split_type
   - created_at

5. **expense_splits** - Individual splits
   - id (UUID, PK)
   - expense_id (FK → expenses)
   - user_id (FK → users)
   - amount

6. **balances** - Calculated balances
   - id (UUID, PK)
   - user_id (FK → users)
   - amount_owed, amount_due
   - updated_at

### Balance Calculation Logic

```
For each user:
  amount_owed = SUM(splits where user didn't pay)
  amount_due = SUM(expenses paid by user) - SUM(own splits)
  net_balance = amount_due - amount_owed
```

## 🔐 API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - Login and get JWT token
- `GET /me` - Get current user profile (protected)

### Users
- `GET /users` - Get all users (protected)
- `GET /users/:id` - Get user by ID (protected)
- `GET /users/search?q=query` - Search users (protected)

### Groups
- `GET /groups` - Get user's groups (protected)
- `POST /groups` - Create new group (protected)
- `GET /groups/:id` - Get group details (protected)
- `POST /groups/:id/members` - Add member to group (protected)
- `DELETE /groups/:id/members/:userId` - Remove member (protected)

### Expenses
- `POST /expenses` - Create expense (protected)
- `GET /expenses/group/:groupId` - Get group expenses (protected)
- `GET /expenses/:id` - Get expense by ID (protected)
- `DELETE /expenses/:id` - Delete expense (protected)

### Balances
- `GET /balances/me` - Get current user balance (protected)
- `GET /balances/:userId` - Get user balance (protected)
- `GET /balances/:userId/details` - Get detailed breakdown (protected)
- `POST /balances/:userId/recalculate` - Recalculate balance (protected)

## 🔒 Security Features

- **Password Hashing**: bcrypt with 10 rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: express-validator for all inputs
- **SQL Injection Protection**: Sequelize parameterized queries
- **XSS Protection**: Helmet security headers
- **CORS**: Configured for frontend origin only
- **Rate Limiting**: 100 requests per 15 minutes on auth endpoints

## 🐛 Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to PostgreSQL

**Solutions**:
1. Ensure PostgreSQL is running: `sudo systemctl status postgresql`
2. Check credentials in `.env` file
3. Verify database exists: `psql -U postgres -l`
4. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`

### Backend Won't Start

**Problem**: Server fails to start

**Solutions**:
1. Check if port 5000 is already in use: `lsof -i :5000`
2. Verify all environment variables are set in `.env`
3. Run database setup: `node scripts/setup-database.js`
4. Check logs for specific error messages

### Frontend Can't Reach Backend

**Problem**: API calls fail with network errors

**Solutions**:
1. Ensure backend is running on port 5000
2. Check `REACT_APP_API_URL` in frontend `.env`
3. Verify CORS is configured correctly in backend
4. Check browser console for specific errors

### Migration Errors

**Problem**: Database migrations fail

**Solutions**:
1. Drop and recreate database: `dropdb expense_sharing_db && createdb expense_sharing_db`
2. Run setup script again: `node scripts/setup-database.js`
3. Check PostgreSQL user permissions

## 📚 Learning Resources

### Why Each Technology?

**Express**: Minimal, flexible Node.js web framework. Used in production by Netflix, Uber, IBM.

**Sequelize**: ORM that simplifies database operations and provides migration support. Prevents SQL injection.

**JWT**: Stateless authentication that scales horizontally. No server-side session storage needed.

**bcrypt**: Industry-standard password hashing. Protects against rainbow table attacks.

**React**: Component-based UI library. Efficient rendering with virtual DOM.

**PostgreSQL**: ACID-compliant relational database. Excellent for financial data requiring consistency.

### DevOps Concepts (Coming Soon)

**Docker**: Packages application with dependencies. "Works on my machine" → "Works everywhere"

**Kubernetes**: Orchestrates containers at scale. Auto-scaling, self-healing, rolling updates.

**Jenkins**: Automates build, test, deploy pipeline. Catches bugs before production.

**Prometheus + Grafana**: Monitors application health. Alerts on issues before users notice.

## 🚢 Next Steps

1. ✅ Backend API implementation
2. ✅ Frontend React application
3. ⏳ Docker containerization
4. ⏳ CI/CD pipeline with Jenkins
5. ⏳ Kubernetes deployment
6. ⏳ Monitoring with Prometheus and Grafana
7. ⏳ Cloud deployment (AWS/GCP)

## 📝 Development Commands

### Backend
```bash
cd backend
npm start              # Start server
npm run dev            # Start with nodemon (auto-reload)
npm test               # Run tests
npm run migrate        # Run migrations
```

### Frontend
```bash
cd frontend
npm start              # Start development server
npm test               # Run tests
npm run build          # Build for production
```

## 🤝 Contributing

This is a learning project. Feel free to experiment, break things, and learn!

## 📄 License

MIT License - Feel free to use this project for learning purposes.

---

**Built with ❤️ for learning Full Stack Development + DevOps**
