# Behavioural Hub - Quick Start Guide

## The Issue You Encountered

You were trying to login but got an error because **the backend server wasn't running**. The frontend (login.html) was trying to connect to `http://localhost:4000/api/auth/login` but nothing was listening on port 4000.

## ✅ What I Fixed

1. **Started the backend server** on port 4000
2. **Ran database migrations** to ensure the admin user exists
3. **Created startup scripts** so you can easily start the app in the future

## 🚀 How to Start the Application

### Option 1: Using the Startup Script (Recommended)

```bash
./start.sh
```

This will:
- Start the backend server on port 4000
- Start the frontend server on port 3000
- Open your browser automatically

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm install
node src/server.js
```

**Terminal 2 - Frontend:**
```bash
# In the project root
python3 -m http.server 3000
# OR
npx serve -p 3000
```

## 🔐 Login Credentials

**Email:** admin@behavioural-hub.com
**Password:** Admin123!

## 📝 Important URLs

- **Frontend:** http://localhost:3000 or http://localhost:3000/login.html
- **Backend API:** http://localhost:4000
- **API Documentation:** http://localhost:4000/api-docs
- **Health Check:** http://localhost:4000/health

## ⚠️ Common Issues & Solutions

### Issue 1: "Port 3000 already in use"
**Solution:**
```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9
# Then restart
```

### Issue 2: "Port 4000 already in use"
**Solution:**
```bash
# Find and kill the process using port 4000
lsof -ti:4000 | xargs kill -9
# Then restart
```

### Issue 3: "Login failed" / "Network error"
**Solution:**
1. Make sure the backend is running: `curl http://localhost:4000/health`
2. Check backend logs: `tail -f backend/logs/app.log`
3. Verify the API URL in config.js is correct

### Issue 4: "Database locked" or migration errors
**Solution:**
```bash
cd backend
node run-migrations.js
```

## 🛑 How to Stop the Servers

Press `Ctrl+C` in each terminal window, or:

```bash
# Stop backend
lsof -ti:4000 | xargs kill

# Stop frontend
lsof -ti:3000 | xargs kill
```

## 📚 Project Structure

```
behavioural-hub/
├── backend/
│   ├── src/
│   │   ├── server.js          # Main backend server
│   │   ├── routes/            # API endpoints
│   │   └── middleware/        # Auth, validation, security
│   ├── migrations/            # Database schema
│   └── behavioural_hub.db    # SQLite database
├── login.html                # Login page
├── index.html               # Main dashboard
├── config.js                # Frontend configuration
└── START_HERE.md           # This file!
```

## 🔧 Development Workflow

1. **Make changes** to your code
2. **Backend changes:** Restart the backend server (Ctrl+C, then start again)
3. **Frontend changes:** Just refresh your browser
4. **Database changes:** Run migrations with `node backend/run-migrations.js`

## 💡 Tips

- The backend uses port **4000** by default
- The frontend can use any port, but **3000** is recommended
- Login credentials are in `backend/.env` and the database migration file
- The backend runs with hot-reload in development mode (if using nodemon)
- Check `backend/logs/` for detailed error logs

## 🆘 Still Having Issues?

1. Check if both servers are running:
   ```bash
   curl http://localhost:4000/health  # Backend
   curl http://localhost:3000          # Frontend
   ```

2. Check the browser console (F12) for frontend errors

3. Check backend logs:
   ```bash
   tail -f backend/logs/app.log
   ```

4. Make sure you're using the correct password: `Admin123!` (with exclamation mark!)

## 🎉 You're All Set!

Your backend server is currently running. Now you can:
1. Open http://localhost:3000/login.html in your browser (if you start the frontend)
2. Login with admin@behavioural-hub.com / Admin123!
3. Start exploring the Behavioural Hub!

**Note:** The backend is currently running in the background (PID: 3026). It will stop when you close this terminal or restart your machine.
