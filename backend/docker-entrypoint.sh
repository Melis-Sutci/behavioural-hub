#!/bin/sh
set -e

echo "🚀 Starting Behavioural Hub API..."
echo "📍 Working directory: $(pwd)"
echo "👤 Running as user: $(whoami)"
echo "📂 Database path: ${DATABASE_PATH:-/app/behavioural_hub.db}"

# Check data directory permissions
if [ -d "/app/data" ]; then
  echo "📁 Data directory exists and is writable"
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
