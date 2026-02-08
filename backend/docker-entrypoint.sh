#!/bin/sh
set -e

echo "🚀 Starting Behavioural Hub API..."

# Run database initialization
echo "📊 Initializing database..."
node src/init-db.js

# Run migrations
echo "🔄 Running migrations..."
node run-migrations.js

echo "✅ Database setup complete!"
echo "🌐 Starting server..."

# Execute the main command (passed as arguments)
exec "$@"
