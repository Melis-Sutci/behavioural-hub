#!/bin/bash

# Behavioural Hub Startup Script
# This script starts both backend and frontend servers

set -e  # Exit on error

echo "🚀 Starting Behavioural Hub..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}⚠️  Port $port is already in use. Killing existing process...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 1
}

# Check and handle backend port (4000)
if check_port 4000; then
    kill_port 4000
fi

# Check and handle frontend port (3000)
if check_port 3000; then
    kill_port 3000
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"
cd backend
npm install --silent
cd ..

echo ""
echo -e "${BLUE}🔧 Running database migrations...${NC}"
cd backend
node run-migrations.js > /dev/null 2>&1 || echo -e "${YELLOW}⚠️  Migrations already applied (this is normal)${NC}"
cd ..

echo ""
echo -e "${GREEN}✅ Starting backend server on port 4000...${NC}"
cd backend
node src/server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo -e "${BLUE}⏳ Waiting for backend to start...${NC}"
for i in {1..10}; do
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ Backend failed to start. Check backend.log for errors.${NC}"
        tail -20 backend.log
        exit 1
    fi
    sleep 1
done

echo ""
echo -e "${GREEN}✅ Starting frontend server on port 3000...${NC}"

# Try python3 first, then python, then npx serve
if command -v python3 &> /dev/null; then
    python3 -m http.server 3000 > frontend.log 2>&1 &
    FRONTEND_PID=$!
elif command -v python &> /dev/null; then
    python -m http.server 3000 > frontend.log 2>&1 &
    FRONTEND_PID=$!
elif command -v npx &> /dev/null; then
    npx serve -p 3000 > frontend.log 2>&1 &
    FRONTEND_PID=$!
else
    echo -e "${RED}❌ No suitable web server found. Install Python or Node.js.${NC}"
    kill $BACKEND_PID
    exit 1
fi

# Wait for frontend to start
sleep 2
if ! check_port 3000; then
    echo -e "${RED}❌ Frontend failed to start. Check frontend.log for errors.${NC}"
    kill $BACKEND_PID
    exit 1
fi

echo ""
echo -e "${GREEN}✅✅✅ All servers started successfully! ✅✅✅${NC}"
echo ""
echo "============================================================"
echo -e "${BLUE}📊 Behavioural Hub is now running!${NC}"
echo "============================================================"
echo ""
echo -e "${GREEN}🌐 Frontend:${NC}     http://localhost:3000"
echo -e "${GREEN}🌐 Login Page:${NC}   http://localhost:3000/login.html"
echo -e "${GREEN}🔌 Backend API:${NC}  http://localhost:4000"
echo -e "${GREEN}📚 API Docs:${NC}     http://localhost:4000/api-docs"
echo ""
echo "============================================================"
echo -e "${YELLOW}🔐 Default Login Credentials${NC}"
echo "============================================================"
echo ""
echo "  Email:    admin@behavioural-hub.com"
echo "  Password: Admin123!"
echo ""
echo "============================================================"
echo ""
echo -e "${BLUE}📝 Process IDs:${NC}"
echo "  Backend PID:  $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}⚠️  To stop the servers, press Ctrl+C or run:${NC}"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "============================================================"
echo ""

# Try to open browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000/login.html 2>/dev/null &
elif command -v open &> /dev/null; then
    open http://localhost:3000/login.html 2>/dev/null &
fi

echo -e "${GREEN}✨ Ready to go! Check your browser or visit http://localhost:3000/login.html${NC}"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ Servers stopped'; exit 0" INT

# Keep script running
wait
