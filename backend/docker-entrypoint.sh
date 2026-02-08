#!/bin/sh
set -e

echo "🚀 Starting Behavioural Hub API..."
echo "📍 Working directory: $(pwd)"
echo "👤 Running as user: $(whoami)"
echo "📂 Database path: ${DATABASE_PATH:-/app/behavioural_hub.db}"
echo "🔍 Node version: $(node --version)"
echo "🔍 NPM version: $(npm --version)"

# List critical files
echo ""
echo "📋 Checking critical files..."
ls -la /app/ | grep -E "package.json|run-migrations.js|docker-entrypoint.sh" || echo "⚠️ Some files missing"
ls -la /app/src/ | grep -E "init-db.js|init-autopilot-db.js|server.js" || echo "⚠️ Some src files missing"
[ -d "/app/migrations" ] && echo "✅ migrations directory exists" || echo "❌ migrations directory missing"
[ -d "/app/node_modules/better-sqlite3" ] && echo "✅ better-sqlite3 module exists" || echo "❌ better-sqlite3 missing"

# Check data directory permissions
echo ""
if [ -d "/app/data" ]; then
  echo "📁 Data directory exists"
  ls -la /app/data || echo "Empty data directory"
else
  echo "⚠️  Creating data directory..."
  mkdir -p /app/data
fi

# Run database initialization
echo ""
echo "📊 Initializing database..."
if node src/init-db.js; then
  echo "✅ Database initialized successfully"
else
  echo "❌ Database initialization failed!"
  exit 1
fi

# Run Growth Autopilot database initialization
echo ""
echo "🤖 Initializing Growth Autopilot tables..."
if node src/init-autopilot-db.js; then
  echo "✅ Growth Autopilot tables initialized successfully"
else
  echo "❌ Growth Autopilot initialization failed!"
  exit 1
fi

# Run migrations
echo ""
echo "🔄 Running migrations..."
if node run-migrations.js; then
  echo "✅ Migrations completed successfully"
else
  echo "❌ Migrations failed!"
  exit 1
fi

echo ""
echo "✅ Database setup complete!"
echo "🌐 Starting server..."
echo ""

# Execute the main command (passed as arguments)
exec "$@"
