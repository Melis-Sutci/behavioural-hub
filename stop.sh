#!/bin/bash

# Behavioural Hub Stop Script
# This script stops both backend and frontend servers

echo "🛑 Stopping Behavioural Hub servers..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill process on port
kill_port() {
    local port=$1
    local service=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Stopping $service on port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ $service stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  No $service running on port $port${NC}"
    fi
}

# Stop backend (port 4000)
kill_port 4000 "Backend"

# Stop frontend (port 3000)
kill_port 3000 "Frontend"

echo ""
echo -e "${GREEN}✅ All servers stopped successfully!${NC}"
