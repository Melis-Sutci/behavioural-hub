# Behavioural Hub Backend - Production Ready 🚀

A comprehensive, production-ready behavioral insights and A/B testing platform for mobile applications. Built with Node.js, Express, and SQLite with enterprise-grade security and monitoring.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Production Deployment](#production-deployment)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Architecture](#architecture)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Monitoring](#monitoring)

## ✨ Features

### Core Functionality
- 🧠 **Behavioral Insights Management** - Track and manage psychological insights
- 🧪 **A/B Testing** - Complete experiment management with variant assignment
- 👥 **User Segmentation** - Advanced rule-based user segmentation
- 📊 **Analytics** - Comprehensive analytics and reporting
- 🧬 **Knowledge Base** - Psychology principles and scientific sources

### Production Features
- 🔒 **JWT Authentication** - Secure user authentication with refresh tokens
- 🔑 **API Keys** - Programmatic access for integrations
- 🛡️ **Security Hardening** - Helmet, rate limiting, CORS, input validation
- 📝 **Structured Logging** - Winston logger with file rotation
- 📚 **API Documentation** - Interactive Swagger/OpenAPI docs
- 🐳 **Docker Support** - Production-ready containerization
- 🚦 **Health Checks** - Kubernetes-compatible liveness/readiness probes
- 🔄 **CI/CD Pipeline** - Automated testing and deployment with GitHub Actions
- 👥 **Role-Based Access Control** - Admin, user, and viewer roles
- 📈 **Audit Logging** - Complete audit trail for security

## 🛠 Tech Stack

- **Runtime:** Node.js 22.x LTS
- **Framework:** Express.js 4.18.2
- **Database:** SQLite 3 (better-sqlite3)
- **Authentication:** JWT + bcrypt
- **Validation:** Joi
- **Security:** Helmet, express-rate-limit, CORS
- **Logging:** Winston
- **Documentation:** Swagger/OpenAPI
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions

## 🚀 Quick Start

### Prerequisites

- Node.js >= 22.0.0 (LTS recommended)
- npm or yarn

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/behavioural-hub.git
cd behavioural-hub/backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and set your secrets
nano .env

# Initialize database
npm run init-db

# Start development server
npm run dev
\`\`\`

The server will start at `http://localhost:4000`

### Default Admin Credentials

**⚠️ IMPORTANT: Change these immediately in production!**

- Email: `admin@behavioural-hub.com`
- Password: `Admin123!`

## 📚 API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI:** http://localhost:4000/api-docs
- **OpenAPI JSON:** http://localhost:4000/api-docs.json

### Authentication

All endpoints except `/api/auth/*` and `/health` require authentication.

#### Using JWT Token

\`\`\`bash
# 1. Login to get token
curl -X POST http://localhost:4000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "admin@behavioural-hub.com",
    "password": "Admin123!"
  }'

# 2. Use token in subsequent requests
curl http://localhost:4000/api/insights \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
\`\`\`

#### Using API Key

\`\`\`bash
# 1. Generate API key (requires JWT token)
curl -X POST http://localhost:4000/api/auth/api-keys \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Mobile App Production",
    "expires_in_days": 365
  }'

# 2. Use API key
curl http://localhost:4000/api/insights \\
  -H "X-API-Key: YOUR_API_KEY"
\`\`\`

## 🔒 Security

### Implemented Security Features

- ✅ **JWT Authentication** with refresh tokens
- ✅ **Password Hashing** with bcrypt (10 rounds)
- ✅ **Rate Limiting**
  - General API: 100 requests per 15 minutes
  - Auth endpoints: 5 requests per 15 minutes
- ✅ **Security Headers** (Helmet.js)
  - CSP, HSTS, X-Frame-Options, etc.
- ✅ **CORS Configuration** with origin whitelist
- ✅ **Input Validation** with Joi schemas
- ✅ **SQL Injection Prevention** (prepared statements)
- ✅ **XSS Protection** (input sanitization)
- ✅ **Audit Logging** for security events
- ✅ **API Key Management** with SHA-256 hashing

### Security Best Practices

1. **Change Default Credentials** immediately
2. **Use Strong JWT Secrets** (min 32 characters)
3. **Enable HTTPS** in production
4. **Set Allowed Origins** in CORS configuration
5. **Review Audit Logs** regularly
6. **Rotate API Keys** periodically
7. **Keep Dependencies Updated** (`npm audit`)

## 🏗 Architecture

### Project Structure

\`\`\`
backend/
├── src/
│   ├── server.js              # Main application entry
│   ├── middleware/
│   │   ├── auth.js            # Authentication & authorization
│   │   ├── validation.js      # Input validation schemas
│   │   └── security.js        # Security middleware
│   ├── routes/
│   │   └── auth.js            # Authentication routes
│   ├── config/
│   │   └── swagger.js         # API documentation config
│   └── utils/
│       └── logger.js          # Winston logger configuration
├── migrations/                 # Database migrations
├── logs/                       # Application logs
├── .env                        # Environment variables (not in git)
├── .env.example               # Environment template
├── Dockerfile                 # Docker image definition
├── docker-compose.yml         # Docker orchestration
├── nginx.conf                 # Nginx reverse proxy config
└── package.json               # Dependencies and scripts
\`\`\`

### Database Schema

- **users** - User accounts with roles
- **api_keys** - API keys for programmatic access
- **refresh_tokens** - JWT refresh tokens
- **audit_logs** - Security and action audit trail
- **insights** - Behavioral insights
- **experiments** - A/B tests
- **variants** - Experiment variants
- **user_assignments** - User-to-variant assignments
- **events** - User event tracking
- **segments** - User segments
- **segment_rules** - Segmentation rules
- **settings** - Application settings
- **psychology_principles** - Knowledge base
- **sources** - Scientific sources
- **citations** - Insight citations

## 🌍 Environment Variables

See `.env.example` for all available environment variables. Key variables:

### Required in Production

\`\`\`env
# Server
NODE_ENV=production
PORT=4000

# Security - MUST CHANGE
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key
ALLOWED_ORIGINS=https://yourdomain.com

# Database
DATABASE_PATH=/app/data/behavioural_hub.db
\`\`\`

### Optional

\`\`\`env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Email (SendGrid)
EMAIL_ENABLED=true
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yourdomain.com

# Error Tracking (Sentry)
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
\`\`\`

## 🐳 Production Deployment

### Docker Deployment

\`\`\`bash
# Build image
docker build -t behavioural-hub-api .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
\`\`\`

### Manual Deployment

\`\`\`bash
# Install production dependencies
npm ci --production

# Set environment variables
export NODE_ENV=production
export JWT_SECRET="your-secret-key"
# ... (set other variables)

# Run with PM2
npm install -g pm2
pm2 start src/server.js --name behavioural-hub

# Monitor
pm2 monit

# View logs
pm2 logs behavioural-hub
\`\`\`

### Nginx Reverse Proxy

A production-ready `nginx.conf` is included with:
- HTTPS configuration (add your SSL certificates)
- Rate limiting
- Security headers
- Gzip compression
- Health check routing

## 🧪 Testing

\`\`\`bash
# Run tests (TODO: Add tests)
npm test

# Run tests with coverage
npm run test:coverage

# Run security audit
npm audit
\`\`\`

## 📊 Monitoring

### Health Checks

- **Basic:** `GET /health` - Simple status check
- **Liveness:** `GET /health/live` - Kubernetes liveness probe
- **Readiness:** `GET /health/ready` - Database connectivity check

### Logs

Logs are stored in `./logs/` directory:

- `combined.log` - All logs
- `error.log` - Error logs only
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

### Metrics (TODO)

Integration points for:
- Prometheus metrics
- Grafana dashboards
- Application Performance Monitoring (APM)

## 🔄 CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`) includes:

- ✅ Dependency installation
- ✅ Security vulnerability scanning
- ✅ Docker image building and testing
- ✅ Trivy security scanning
- 🚧 Automated testing (when tests are added)
- 🚧 Deployment to production

## 📝 Scripts

\`\`\`json
{
  "start": "node src/server.js",           // Production server
  "dev": "node --watch src/server.js",     // Development with auto-reload
  "init-db": "node src/init-db.js"         // Initialize database
}
\`\`\`

## 🤝 Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/behavioural-hub/issues
- Email: support@behavioural-hub.com

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for mobile app developers who care about user behavior**
