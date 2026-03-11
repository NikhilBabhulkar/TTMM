# 🚀 Quick Start Guide

Get the application running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js (should be v18+)
node --version

# Check npm
npm --version

# Check PostgreSQL (should be v14+)
psql --version
```

If any are missing, install them first:
- Node.js: https://nodejs.org/
- PostgreSQL: https://www.postgresql.org/download/

## Step-by-Step Setup

### 1. Start PostgreSQL

```bash
# Linux
sudo systemctl start postgresql

# macOS
brew services start postgresql

# Windows - Start from Services or pgAdmin
```

### 2. Set Up Backend

```bash
# Navigate to backend
cd backend

# Install dependencies (takes 1-2 minutes)
npm install

# Set up database (creates DB, tables, and sample data)
node scripts/setup-database.js --seed

# Start backend server
npm start
```

You should see:
```
✅ Server started successfully!
🚀 Environment: development
🌐 Server running on: http://localhost:5000
```

### 3. Set Up Frontend (New Terminal)

```bash
# Navigate to frontend
cd frontend

# Install dependencies (takes 2-3 minutes)
npm install

# Start frontend server
npm start
```

Browser will automatically open at `http://localhost:3000`

## 🎉 Test the Application

### Option 1: Use Sample Data

If you ran setup with `--seed` flag, you can login with:

```
Email: alice@example.com
Password: Password123

OR

Email: bob@example.com
Password: Password123

OR

Email: charlie@example.com
Password: Password123
```

### Option 2: Create New Account

1. Click "Sign Up" on login page
2. Fill in your details:
   - Name: Your Name
   - Email: your@email.com
   - Password: Password123 (must have uppercase, lowercase, number)
3. Click "Sign Up"
4. Login with your credentials

## 🧪 Quick Test Flow

1. **Login** → You'll see the dashboard
2. **Create Group** → Click "Create Group", name it "Test Group"
3. **Add Expense** → Go to group, click "Add Expense"
   - Amount: 3000
   - Description: Dinner
   - Paid by: You
   - Split: Equal
4. **View Balance** → Click "View Details" on dashboard

## 🐛 Common Issues

### "Cannot connect to database"
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql
```

### "Port 5000 already in use"
```bash
# Find and kill the process
lsof -i :5000
kill -9 <PID>

# Or change port in backend/.env
PORT=5001
```

### "Port 3000 already in use"
```bash
# Frontend will ask if you want to use another port
# Press 'y' to use port 3001
```

### "Module not found"
```bash
# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install
```

## 📝 Useful Commands

### Backend
```bash
cd backend
npm start              # Start server
npm run dev            # Start with auto-reload
npm test               # Run tests
node scripts/setup-database.js --seed  # Reset database with sample data
```

### Frontend
```bash
cd frontend
npm start              # Start dev server
npm test               # Run tests
npm run build          # Build for production
```

## 🎯 What's Next?

- Explore the code in `backend/controllers/` and `frontend/src/pages/`
- Try adding more features
- Set up Docker (see main README.md)
- Configure CI/CD pipeline
- Deploy to cloud

## 💡 Tips

1. Keep both terminal windows open (backend and frontend)
2. Backend must be running for frontend to work
3. Check browser console (F12) for frontend errors
4. Check terminal for backend errors
5. Use sample data to test quickly

## 🆘 Need Help?

1. Check the main README.md for detailed documentation
2. Look at the troubleshooting section
3. Check backend logs in terminal
4. Check browser console (F12) for frontend issues

---

**Happy Coding! 🎉**
