# 🚀 SubTrack Pro - Quick Start Commands

## One-Command Installation

```bash
chmod +x install.sh && ./install.sh
```

---

## Manual Setup (Step-by-Step)

### 1. Install Global Dependencies

```bash
npm install -g pnpm turbo
```

### 2. Install Project Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Setup Environment Variables

```bash
# Backend
cp .env.example apps/api/.env
nano apps/api/.env  # Edit with your credentials

# Frontend
cp .env.example apps/web/.env.local
nano apps/web/.env.local  # Edit with your credentials
```

### 4. Setup Database

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed
```

### 5. Start Development

**Option A: Run Both Servers**
```bash
# Terminal 1: Backend
cd apps/api
npm run start:dev

# Terminal 2: Frontend
cd apps/web
npm run dev
```

**Option B: Use Turbo (Recommended)**
```bash
turbo dev
```

---

## Production Deployment

### Deploy to Railway (Backend)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd apps/api
railway up
```

### Deploy to Vercel (Frontend)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd apps/web
vercel --prod
```

### Deploy with Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Database Commands

```bash
cd apps/api

# Generate Prisma Client
npx prisma generate

# Create a migration
npx prisma migrate dev --name your_migration_name

# Apply migrations to production
npx prisma migrate deploy

# Open Prisma Studio (Database GUI)
npx prisma studio

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Pull schema from existing database
npx prisma db pull

# Push schema without migration
npx prisma db push
```

---

## Development Commands

### Backend

```bash
cd apps/api

# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Run tests
npm run test
npm run test:e2e
npm run test:cov

# Lint
npm run lint
npm run format
```

### Frontend

```bash
cd apps/web

# Development
npm run dev

# Production build
npm run build
npm run start

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Useful Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f api
docker-compose logs -f web

# Restart a service
docker-compose restart api

# Execute commands in container
docker-compose exec api npx prisma migrate deploy
docker-compose exec api npm run seed

# Remove all containers and volumes
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build
```

---

## Testing

```bash
# Backend tests
cd apps/api
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # E2E tests

# Frontend tests
cd apps/web
npm run test
npm run test:watch
```

---

## Debugging

### Check if services are running

```bash
# Check backend
curl http://localhost:4000/api/health

# Check WebSocket
wscat -c ws://localhost:4000

# Check database connection
cd apps/api
npx prisma db execute --stdin < "SELECT 1"

# Check Redis
redis-cli -u $REDIS_URL ping
```

### View logs

```bash
# Backend logs
cd apps/api
npm run start:dev  # Logs appear in console

# Frontend logs
cd apps/web
npm run dev  # Logs appear in console

# Production logs (Railway)
railway logs

# Production logs (Vercel)
vercel logs
```

---

## Environment Setup (Required Services)

### 1. Supabase (Database)
```bash
# Sign up at https://supabase.com
# Create project
# Get DATABASE_URL from Settings > Database
# Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### 2. Upstash (Redis)
```bash
# Sign up at https://upstash.com
# Create Redis database
# Copy REDIS_URL from console
# Format: redis://default:[PASSWORD]@[ENDPOINT].upstash.io:6379
```

### 3. OpenAI (AI)
```bash
# Sign up at https://platform.openai.com
# Create API key
# Add to OPENAI_API_KEY in .env
```

### 4. Stripe (Payments)
```bash
# Sign up at https://stripe.com
# Get keys from Dashboard > API Keys
# Add STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY
```

### 5. Resend (Email)
```bash
# Sign up at https://resend.com
# Verify domain
# Create API key
# Add to RESEND_API_KEY
```

### 6. Cloudinary (Images)
```bash
# Sign up at https://cloudinary.com
# Get credentials from Dashboard
# Create upload preset
# Add all credentials to .env
```

### 7. OAuth (Optional)
```bash
# Google: https://console.cloud.google.com
# GitHub: https://github.com/settings/developers
# Configure callback URLs
# Add client IDs and secrets to .env
```

---

## Generate Secrets

```bash
# JWT Secret
openssl rand -base64 32

# JWT Refresh Secret
openssl rand -base64 32

# Add both to .env:
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
```

---

## Health Checks

```bash
# Backend health
curl http://localhost:4000/api/health

# Frontend health
curl http://localhost:3000

# Database health
cd apps/api && npx prisma db execute --stdin < "SELECT 1"

# Redis health
redis-cli -u $REDIS_URL ping

# WebSocket health
wscat -c ws://localhost:4000
```

---

## Cleanup Commands

```bash
# Remove node_modules
rm -rf node_modules apps/*/node_modules

# Remove build artifacts
rm -rf apps/*/.next apps/*/dist

# Remove Prisma artifacts
rm -rf apps/api/prisma/migrations

# Full cleanup
rm -rf node_modules apps/*/node_modules apps/*/.next apps/*/dist
pnpm install
```

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Redis connection working
- [ ] OpenAI API key valid
- [ ] Stripe webhooks configured
- [ ] Email domain verified
- [ ] OAuth apps configured
- [ ] CORS origins set
- [ ] JWT secrets generated
- [ ] Rate limiting enabled
- [ ] Monitoring set up (Sentry)
- [ ] SSL/HTTPS enabled
- [ ] Backup strategy in place

---

## URLs (Default Development)

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api/docs
- **Prisma Studio**: http://localhost:5555 (run `npx prisma studio`)

---

## Common Issues & Solutions

**Issue: Port already in use**
```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Issue: Database connection failed**
```bash
# Check DATABASE_URL format
# Verify Supabase project is active
# Test connection: npx prisma db execute --stdin < "SELECT 1"
```

**Issue: Prisma client not generated**
```bash
cd apps/api
npx prisma generate
```

**Issue: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Need Help?

1. Check [README.md](README.md) for overview
2. Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment
3. Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for details
4. Review [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for architecture

---

**Happy coding! 🚀**
