# SubTrack Pro - Complete Installation & Deployment Guide

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 20+ and npm/pnpm
- PostgreSQL (via Supabase)
- Redis (via Upstash)
- Git

### Step 1: Clone and Install

```bash
# Clone repository
git clone https://github.com/yourusername/subtrack-pro.git
cd subtrack-pro

# Install dependencies
npm install -g pnpm turbo
pnpm install

# Or use npm workspaces
npm install
```

### Step 2: Setup Database (Supabase)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings > Database
4. Copy to `.env` files

```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
```

### Step 3: Setup Redis (Upstash)

1. Go to [upstash.com](https://upstash.com)
2. Create Redis database
3. Copy connection URL

```bash
REDIS_URL="redis://default:[PASSWORD]@[ENDPOINT].upstash.io:6379"
```

### Step 4: Configure Environment Variables

```bash
# Backend
cd apps/api
cp ../../.env.example .env
# Edit .env with your credentials

# Frontend
cd ../web
cp ../../.env.example .env.local
# Edit .env.local with your credentials
```

### Step 5: Initialize Database

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### Step 6: Start Development Servers

```bash
# Terminal 1: Start backend
cd apps/api
npm run dev
# Runs on http://localhost:4000

# Terminal 2: Start frontend
cd apps/web
npm run dev
# Runs on http://localhost:3000
```

---

## 🌐 Production Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub account

2. **Create New Project**
   ```
   - New Project > Deploy from GitHub
   - Select your repository
   - Choose apps/api directory
   ```

3. **Add Environment Variables**
   ```
   Go to Variables tab and add all from .env.example:
   - DATABASE_URL
   - REDIS_URL
   - JWT_SECRET (generate new)
   - JWT_REFRESH_SECRET (generate new)
   - OPENAI_API_KEY
   - STRIPE_SECRET_KEY
   - RESEND_API_KEY
   - CLOUDINARY credentials
   - FRONTEND_URL (will be your Vercel URL)
   ```

4. **Add Build Configuration**
   ```
   railway.json:
   {
     "build": {
       "builder": "nixpacks",
       "buildCommand": "cd apps/api && npm install && npx prisma generate && npm run build"
     },
     "deploy": {
       "startCommand": "cd apps/api && npx prisma migrate deploy && npm run start:prod",
       "restartPolicyType": "on-failure"
     }
   }
   ```

5. **Deploy**
   - Click "Deploy"
   - Get your railway.app URL

#### Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Connect GitHub

2. **Import Project**
   ```
   - New Project > Import Git Repository
   - Select your repo
   - Framework: Next.js
   - Root Directory: apps/web
   ```

3. **Configure Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   NEXT_PUBLIC_WS_URL=wss://your-api.railway.app
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset
   ```

4. **Deploy**
   - Click "Deploy"
   - Your site will be live at your-app.vercel.app

5. **Update Backend FRONTEND_URL**
   - Go back to Railway
   - Update FRONTEND_URL to your Vercel URL
   - Redeploy backend

### Option 2: All-in-One on Railway

```bash
# railway.json at root
{
  "services": {
    "api": {
      "builder": "nixpacks",
      "buildCommand": "cd apps/api && npm install && npx prisma generate",
      "startCommand": "cd apps/api && npx prisma migrate deploy && npm start",
      "healthcheckPath": "/api/health"
    },
    "web": {
      "builder": "nixpacks",
      "buildCommand": "cd apps/web && npm install && npm run build",
      "startCommand": "cd apps/web && npm start"
    }
  }
}
```

### Option 3: Docker Deployment

```bash
# Build images
docker build -f docker/Dockerfile.api -t subtrack-api .
docker build -f docker/Dockerfile.web -t subtrack-web .

# Run with docker-compose
docker-compose up -d
```

---

## 📧 Service Setup Guides

### Resend (Email)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain:
   - Go to Domains
   - Add domain
   - Add DNS records to your domain provider
3. Create API key
4. Add to `.env`:
   ```
   RESEND_API_KEY=re_...
   EMAIL_FROM=noreply@yourdomain.com
   ```

### Stripe (Payments)

1. Sign up at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard
3. Create products:
   - Go to Products
   - Create subscription products
   - Copy price IDs
4. Setup webhook:
   ```
   - Developers > Webhooks
   - Add endpoint: https://your-api.com/api/webhooks/stripe
   - Select events:
     * invoice.payment_succeeded
     * invoice.payment_failed
     * customer.subscription.updated
     * customer.subscription.deleted
   - Copy webhook secret
   ```
5. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_...
   STRIPE_PUBLISHABLE_KEY=pk_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### OpenAI (AI Features)

1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Add payment method (Billing)
3. Create API key (API Keys)
4. Add to `.env`:
   ```
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4-turbo-preview
   ```

### Cloudinary (Image Storage)

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get credentials from Dashboard
3. Create upload preset:
   - Settings > Upload
   - Add upload preset
   - Mode: Unsigned
   - Folder: subtrack-logos
4. Add to `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
   ```

### OAuth Setup

#### Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project
3. Enable Google+ API
4. Credentials > Create OAuth 2.0 Client ID
5. Add authorized redirect:
   ```
   http://localhost:4000/api/auth/google/callback
   https://your-api.com/api/auth/google/callback
   ```
6. Copy credentials to `.env`

#### GitHub OAuth

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. New OAuth App
3. Callback URL: `https://your-api.com/api/auth/github/callback`
4. Copy credentials to `.env`

---

## 🔒 Security Checklist

- [ ] Generate strong JWT secrets
- [ ] Enable HTTPS in production
- [ ] Set CORS allowed origins
- [ ] Enable rate limiting
- [ ] Set secure cookie flags
- [ ] Enable Helmet.js
- [ ] Validate all inputs with Zod
- [ ] Never commit .env files
- [ ] Use environment variables for secrets
- [ ] Enable database connection encryption
- [ ] Setup proper RBAC
- [ ] Enable audit logging
- [ ] Setup monitoring (Sentry, LogRocket)

---

## 📊 Monitoring Setup

### Option 1: Sentry

```typescript
// Add to apps/web/app/layout.tsx
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Add to apps/api/src/main.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Option 2: LogRocket

```typescript
// Add to apps/web/app/layout.tsx
import LogRocket from 'logrocket';

LogRocket.init('your-app-id');
```

---

## 🧪 Testing

```bash
# Backend tests
cd apps/api
npm run test
npm run test:e2e

# Frontend tests
cd apps/web
npm run test
npm run test:e2e
```

---

## 🚀 CI/CD Pipeline

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd apps/api && npm install
      - run: cd apps/api && npx prisma generate
      - run: cd apps/api && npm run build
      # Deploy to Railway via CLI or webhook

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd apps/web && npm install
      - run: cd apps/web && npm run build
      # Auto-deploys via Vercel GitHub integration
```

---

## 📈 Performance Optimization

1. **Enable Redis Caching**
   ```typescript
   // Cache frequent queries
   await redis.set(`user:${userId}:subscriptions`, data, 'EX', 300);
   ```

2. **Database Indexing**
   ```prisma
   @@index([userId, status])
   @@index([nextBillingDate])
   ```

3. **Next.js Optimization**
   ```typescript
   // Use dynamic imports
   const Chart = dynamic(() => import('./Chart'), { ssr: false });
   
   // Enable image optimization
   <Image src={logo} width={64} height={64} />
   ```

4. **API Response Caching**
   ```typescript
   // Add cache headers
   res.set('Cache-Control', 'public, max-age=300');
   ```

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test connection
npx prisma db push --preview-feature

# Reset database
npx prisma migrate reset
```

### Redis Connection Issues
```bash
# Test with Redis CLI
redis-cli -u $REDIS_URL ping
```

### Build Errors
```bash
# Clear cache
rm -rf node_modules .next
npm install
npm run build
```

### WebSocket Not Connecting
- Check CORS settings
- Verify JWT token is being sent
- Check Railway/Vercel logs

---

## 📚 Additional Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)

---

## 🆘 Support

For issues:
1. Check logs in Railway/Vercel
2. Review error messages
3. Check GitHub Issues
4. Contact support

**Your production-ready SaaS is now deployed! 🎉**
