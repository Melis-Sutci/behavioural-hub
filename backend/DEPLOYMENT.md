# Deployment Guide 🚀

Complete guide for deploying Behavioural Hub to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Options](#deployment-options)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Platforms](#cloud-platforms)
5. [Database Migration](#database-migration)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Environment Configuration](#environment-configuration)
8. [Post-Deployment](#post-deployment)
9. [Backup and Recovery](#backup-and-recovery)
10. [Troubleshooting](#troubleshooting)

## Pre-Deployment Checklist

### Security

- [ ] Change default admin password
- [ ] Generate strong JWT secrets (min 32 characters)
- [ ] Set JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Configure ALLOWED_ORIGINS for CORS
- [ ] Set up SSL/TLS certificates
- [ ] Review and test rate limiting settings
- [ ] Enable audit logging
- [ ] Set up error tracking (Sentry recommended)

### Configuration

- [ ] Set NODE_ENV=production
- [ ] Configure database path
- [ ] Set up email service (SendGrid/AWS SES)
- [ ] Configure logging level
- [ ] Test all environment variables
- [ ] Review and adjust rate limits

### Infrastructure

- [ ] Provision server/cloud instance
- [ ] Set up reverse proxy (Nginx recommended)
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Test health check endpoints

## Deployment Options

### Option 1: Docker (Recommended)

Best for: Quick deployment, easy scaling, consistency across environments

**Pros:**
- Consistent environment
- Easy to scale
- Isolated dependencies
- Simple rollback

**Cons:**
- Requires Docker knowledge
- Additional layer of complexity

### Option 2: PM2 + Nginx

Best for: VPS deployment, full control

**Pros:**
- Direct control over Node.js process
- Built-in process management
- Easy monitoring

**Cons:**
- Manual dependency management
- More configuration required

### Option 3: Cloud Platform (AWS, DigitalOcean, etc.)

Best for: Managed infrastructure, scalability

**Pros:**
- Managed infrastructure
- Auto-scaling
- Built-in monitoring

**Cons:**
- Higher cost
- Platform lock-in

## Docker Deployment

### 1. Prepare Environment

\`\`\`bash
# Clone repository
git clone https://github.com/yourusername/behavioural-hub.git
cd behavioural-hub/backend

# Create .env file
cp .env.example .env
nano .env
\`\`\`

### 2. Configure .env for Production

\`\`\`env
NODE_ENV=production
PORT=4000

# CRITICAL: Change these secrets!
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Set your domain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database
DATABASE_PATH=/app/data/behavioural_hub.db

# Email (SendGrid)
EMAIL_ENABLED=true
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com

# Error Tracking
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production

# Logging
LOG_LEVEL=info
\`\`\`

### 3. Build and Run

\`\`\`bash
# Build Docker image
docker build -t behavioural-hub-api:latest .

# Run with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api
\`\`\`

### 4. With Nginx Reverse Proxy

\`\`\`bash
# Start with Nginx (production profile)
docker-compose --profile production up -d

# Nginx will handle:
# - SSL/TLS termination
# - Rate limiting
# - Static file serving
# - Load balancing (if multiple instances)
\`\`\`

### 5. Verify Deployment

\`\`\`bash
# Test health endpoint
curl https://yourdomain.com/health

# Expected response:
# {"status":"ok","message":"Backend is running!"}

# Test readiness
curl https://yourdomain.com/health/ready
\`\`\`

## Cloud Platforms

### AWS Elastic Beanstalk

\`\`\`bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p docker behavioural-hub

# Create environment
eb create production

# Deploy
eb deploy

# Open application
eb open
\`\`\`

### DigitalOcean App Platform

1. Connect your GitHub repository
2. Select `backend/` as root directory
3. Set environment variables in dashboard
4. Deploy automatically on push

### Google Cloud Run

\`\`\`bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/behavioural-hub

# Deploy
gcloud run deploy behavioural-hub \\
  --image gcr.io/PROJECT_ID/behavioural-hub \\
  --platform managed \\
  --region us-central1 \\
  --allow-unauthenticated \\
  --set-env-vars NODE_ENV=production,JWT_SECRET=xxx
\`\`\`

### Heroku

\`\`\`bash
# Create app
heroku create behavioural-hub

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Deploy
git push heroku main

# Scale
heroku ps:scale web=2
\`\`\`

## Database Migration

### SQLite (Development/Small Scale)

\`\`\`bash
# Initialize database
docker exec -it behavioural-hub-api npm run init-db

# Backup database
docker cp behavioural-hub-api:/app/data/behavioural_hub.db ./backup-$(date +%Y%m%d).db
\`\`\`

### PostgreSQL (Production Scale)

For high-traffic production, migrate to PostgreSQL:

1. **Install dependencies:**
\`\`\`bash
npm install pg
\`\`\`

2. **Update database connection** in `server.js`

3. **Convert migrations** from SQLite to PostgreSQL syntax

4. **Update environment variables:**
\`\`\`env
DATABASE_URL=postgresql://user:password@host:5432/behavioural_hub
\`\`\`

## SSL/TLS Configuration

### Option 1: Let's Encrypt (Free)

\`\`\`bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
\`\`\`

### Option 2: Custom Certificate

Update `nginx.conf`:

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... rest of configuration
}
\`\`\`

## Environment Configuration

### Production .env Template

\`\`\`bash
# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Create .env
cat > .env <<EOL
NODE_ENV=production
PORT=4000

JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

DATABASE_PATH=/app/data/behavioural_hub.db

ALLOWED_ORIGINS=https://yourdomain.com

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

BCRYPT_ROUNDS=10

LOG_LEVEL=info
LOG_FILE_PATH=/app/logs/app.log

EMAIL_ENABLED=true
SENDGRID_API_KEY=${SENDGRID_API_KEY}
EMAIL_FROM=noreply@yourdomain.com

SENTRY_DSN=${SENTRY_DSN}
SENTRY_ENVIRONMENT=production

SWAGGER_ENABLED=true
EOL
\`\`\`

## Post-Deployment

### 1. Change Default Credentials

\`\`\`bash
curl -X POST https://yourdomain.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "admin@behavioural-hub.com",
    "password": "Admin123!"
  }'

# Then change password
curl -X PUT https://yourdomain.com/api/auth/password \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "current_password": "Admin123!",
    "new_password": "YourStrongPassword123!"
  }'
\`\`\`

### 2. Verify Security Headers

\`\`\`bash
curl -I https://yourdomain.com/health

# Should include:
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000
\`\`\`

### 3. Test Rate Limiting

\`\`\`bash
# Run multiple requests quickly
for i in {1..10}; do
  curl https://yourdomain.com/health
done

# Should eventually return 429 Too Many Requests
\`\`\`

### 4. Monitor Logs

\`\`\`bash
# Docker
docker-compose logs -f api

# PM2
pm2 logs behavioural-hub
\`\`\`

### 5. Set Up Monitoring

#### Health Check (External)

Use services like:
- UptimeRobot (free tier available)
- Pingdom
- StatusCake

Configure to check: `https://yourdomain.com/health`

#### Application Monitoring

Integrate with:
- Sentry (error tracking)
- New Relic (APM)
- Datadog (full-stack monitoring)

## Backup and Recovery

### Automated Backup Script

\`\`\`bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/behavioural-hub"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec behavioural-hub-api sh -c 'tar czf - /app/data' > $BACKUP_DIR/db-$DATE.tar.gz

# Backup environment
cp .env $BACKUP_DIR/env-$DATE

# Delete backups older than 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
\`\`\`

### Cron Job

\`\`\`bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
\`\`\`

### Recovery

\`\`\`bash
# Stop application
docker-compose down

# Restore database
tar xzf /backups/behavioural-hub/db-20240115_020000.tar.gz -C ./

# Start application
docker-compose up -d

# Verify
curl https://yourdomain.com/health/ready
\`\`\`

## Troubleshooting

### Server Won't Start

\`\`\`bash
# Check logs
docker-compose logs api

# Common issues:
# 1. Missing environment variables
# 2. Port already in use
# 3. Database file permissions
\`\`\`

### 502 Bad Gateway

\`\`\`bash
# Check if container is running
docker ps

# Check container logs
docker logs behavioural-hub-api

# Restart
docker-compose restart api
\`\`\`

### Database Locked

\`\`\`bash
# SQLite WAL mode is enabled by default
# If issues persist, check for zombie processes:
lsof | grep behavioural_hub.db
\`\`\`

### High CPU Usage

\`\`\`bash
# Check running processes
docker stats

# Scale horizontally
docker-compose up -d --scale api=3
\`\`\`

### Memory Leaks

\`\`\`bash
# Monitor memory
docker stats behavioural-hub-api

# Restart periodically (PM2)
pm2 restart behavioural-hub
\`\`\`

---

## Need Help?

- **Documentation:** Check `/api-docs` on your instance
- **Issues:** GitHub Issues
- **Email:** support@behavioural-hub.com

**Happy Deploying! 🚀**
