# Acquisitions API - Docker Setup Guide

This guide explains how to run the Acquisitions API with Docker in both development (using Neon Local) and production environments (using Neon Cloud).

## 📋 Prerequisites

- **Docker** and **Docker Compose** installed
- **Neon account** with a project created at [console.neon.tech](https://console.neon.tech)
- **Node.js 18+** (for local development without Docker)

## 🔧 Initial Setup

### 1. Clone and Setup Environment

```bash
git clone <repository-url>
cd akquisitions

# Copy the local environment example
cp .env.local.example .env.local
```

### 2. Configure Neon Credentials

Edit `.env.local` with your Neon credentials:

```bash
# Required for Neon Local development
NEON_API_KEY=neon_api_1abc123...
NEON_PROJECT_ID=cool-darkness-12345678
PARENT_BRANCH_ID=main

# Required for production deployment
DATABASE_URL=postgres://user:password@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-super-secure-production-secret
```

**Where to find these values:**
- **NEON_API_KEY**: [API Keys Settings](https://console.neon.tech/app/settings/api-keys)
- **NEON_PROJECT_ID**: Project Settings → General in Neon Console
- **DATABASE_URL**: Connection string from your Neon project dashboard

## 🛠️ Development Environment (Neon Local)

### Quick Start

```bash
# Start development environment with hot reloading
npm run docker:dev

# Or manually:
docker-compose -f docker-compose.dev.yml up --build
```

### What This Does

1. **Starts Neon Local proxy** - Creates an ephemeral database branch
2. **Builds and runs your app** - Connects to the local Neon proxy
3. **Enables hot reloading** - Code changes trigger automatic restarts
4. **Provides fresh database** - New ephemeral branch each startup

### Development URLs

- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Base**: http://localhost:3000/api
- **Database**: postgres://neon:npg@localhost:5432/neondb

### Development Commands

```bash
# Start development environment
npm run docker:dev

# View logs
npm run docker:dev:logs

# Stop development environment
npm run docker:dev:down

# Run database migrations in development
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open Drizzle Studio
docker-compose -f docker-compose.dev.yml exec app npm run db:studio
```

### Development Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Your App          │    │   Neon Local        │    │   Neon Cloud        │
│   localhost:3000    │◄──►│   localhost:5432    │◄──►│   Remote Branch     │
│   (Hot Reload)      │    │   (Proxy)           │    │   (Ephemeral)       │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### Persistent Branches (Optional)

To persist branches per Git branch, uncomment these lines in `docker-compose.dev.yml`:

```yaml
volumes:
  - ./.neon_local/:/tmp/.neon_local
  - ./.git/HEAD:/tmp/.git/HEAD:ro,consistent
```

Then set `DELETE_BRANCH=false` in the neon-local service environment.

## 🚀 Production Environment (Neon Cloud)

### Quick Start

```bash
# Set production environment variables
export DATABASE_URL="postgres://user:password@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require"
export JWT_SECRET="your-super-secure-production-jwt-secret"

# Start production environment
npm run docker:prod

# Or manually:
docker-compose -f docker-compose.prod.yml up --build -d
```

### What This Does

1. **Builds production image** - Optimized, multi-stage build
2. **Connects to Neon Cloud** - Uses your actual production database
3. **Runs with security** - Non-root user, read-only filesystem
4. **Includes health checks** - Automatic restart on failure

### Production Commands

```bash
# Start production environment (detached)
npm run docker:prod

# View logs
npm run docker:prod:logs

# Stop production environment
npm run docker:prod:down

# Run database migrations in production
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate
```

### Production Architecture

```
┌─────────────────────┐    ┌─────────────────────────────────┐
│   Your App          │    │   Neon Cloud Database           │
│   localhost:3000    │◄──►│   ep-xxx.aws.neon.tech         │
│   (Production)      │    │   (Production Branch)           │
└─────────────────────┘    └─────────────────────────────────┘
```

## 📊 Environment Comparison

| Feature | Development (Neon Local) | Production (Neon Cloud) |
|---------|--------------------------|-------------------------|
| Database | Ephemeral branches | Production branch |
| SSL | Self-signed cert | Full SSL/TLS |
| Performance | Local proxy | Cloud optimized |
| Data Persistence | Temporary | Permanent |
| Hot Reload | ✅ Yes | ❌ No |
| Resource Limits | None | CPU/Memory limited |
| Health Checks | Basic | Comprehensive |

## 🔍 API Endpoints

### Authentication

```bash
# Register user
curl -X POST http://localhost:3000/api/v1/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user"
  }'

# Sign in
curl -X POST http://localhost:3000/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Sign out
curl -X POST http://localhost:3000/api/v1/auth/sign-out \
  -H "Cookie: token=your-jwt-token"
```

### Health Check

```bash
curl http://localhost:3000/health
```

## 🛡️ Security Features

### Development
- Self-signed certificates for Neon Local
- Relaxed SSL verification
- Debug logging enabled

### Production
- Full SSL/TLS encryption
- Non-root user execution
- Read-only root filesystem
- Resource limits
- Health monitoring

## 🔧 Troubleshooting

### Common Issues

**1. "NEON_API_KEY is required"**
```bash
# Make sure .env.local exists and has valid credentials
cp .env.local.example .env.local
# Edit .env.local with your actual Neon credentials
```

**2. "Database connection failed"**
```bash
# Check if Neon Local is healthy
docker-compose -f docker-compose.dev.yml ps
docker-compose -f docker-compose.dev.yml logs neon-local
```

**3. "Port 3000 already in use"**
```bash
# Stop any running services
npm run docker:dev:down
# Or kill processes using the port
lsof -ti:3000 | xargs kill -9
```

**4. Docker Build Issues**
```bash
# Clean Docker cache and rebuild
docker system prune -a
docker-compose -f docker-compose.dev.yml up --build --force-recreate
```

### Logs and Debugging

```bash
# Application logs (development)
npm run docker:dev:logs

# Application logs (production)
npm run docker:prod:logs

# Neon Local logs
docker-compose -f docker-compose.dev.yml logs neon-local

# Enter container for debugging
docker-compose -f docker-compose.dev.yml exec app sh
```

### Performance Monitoring

```bash
# Check container resources
docker stats

# Check health status
docker-compose -f docker-compose.prod.yml ps
```

## 🚀 Deployment

### Docker Hub (Optional)

```bash
# Build and tag
docker build --target production -t your-username/akquisitions:latest .

# Push to registry
docker push your-username/akquisitions:latest
```

### Cloud Deployment

For cloud deployment (AWS, GCP, Azure), use `docker-compose.prod.yml` as a template and:

1. Set `DATABASE_URL` and `JWT_SECRET` via your cloud provider's secrets management
2. Configure load balancer/ingress for HTTPS
3. Set up log aggregation and monitoring
4. Configure automated backups for your Neon database

## 📖 Additional Resources

- [Neon Local Documentation](https://neon.com/docs/local/neon-local)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Neon Console](https://console.neon.tech)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

---

## 📝 Quick Reference

```bash
# Development
npm run docker:dev          # Start dev environment
npm run docker:dev:down     # Stop dev environment
npm run docker:dev:logs     # View dev logs

# Production  
npm run docker:prod         # Start prod environment
npm run docker:prod:down    # Stop prod environment
npm run docker:prod:logs    # View prod logs

# Building
npm run docker:build        # Build latest image
npm run docker:build:dev    # Build dev image
npm run docker:build:prod   # Build prod image
```