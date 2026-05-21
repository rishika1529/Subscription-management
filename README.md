# 🎯 SubTrack Pro

<div align="center">

![SubTrack Pro](https://img.shields.io/badge/SubTrack-Pro-red?style=for-the-badge&logo=netflix)

**Premium AI-Powered Subscription Management Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-10-red?style=flat-square&logo=nestjs)](https://nestjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue?style=flat-square&logo=postgresql)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [Screenshots](#-screenshots)

</div>

---

## 🌟 Overview

SubTrack Pro is a production-grade subscription management SaaS platform with AI-powered insights, real-time notifications, and a premium glassmorphism UI inspired by Linear, Stripe, and Notion.

### Why SubTrack Pro?

- **💰 Save Money**: AI identifies underused subscriptions and suggests cancellations
- **📊 Smart Analytics**: Track spending trends, usage patterns, and ROI
- **🤖 AI Assistant**: Chat with AI to find content across streaming platforms
- **⚡ Real-Time**: WebSocket-powered live updates and notifications
- **🎨 Premium UI**: Dark glassmorphism design with Framer Motion animations
- **🔒 Enterprise Security**: JWT auth, refresh tokens, OAuth, rate limiting

---

## ✨ Features

### Core Features
- ✅ Track unlimited subscriptions across all categories
- ✅ Multi-currency support (USD, EUR, GBP, INR)
- ✅ Automated renewal reminders (14, 7, 1 day before)
- ✅ Usage tracking and cost-per-use calculations
- ✅ Category organization and tagging
- ✅ Payment history and analytics

### AI-Powered Intelligence
- 🤖 Conversational AI chatbot for subscription queries
- 🎯 Smart cancellation recommendations
- 📈 Value scoring algorithm (0-100 for each subscription)
- 💡 Personalized savings suggestions
- 🔍 Streaming content search ("Where can I watch Inception?")
- 📊 Automated monthly AI-generated reports

### Premium Dashboard
- 📊 Real-time spending analytics with animated charts
- 🎨 Category breakdown with interactive pie charts
- 📅 Upcoming renewals timeline
- 💰 Monthly vs yearly spending projections
- 🏆 Subscription health scores
- 📈 Spending trends and comparisons

### Real-Time Features
- ⚡ WebSocket-powered live updates
- 🔔 In-app notification center
- 📱 Push notifications for renewals
- 🔄 Multi-device synchronization
- 💬 Live AI chat streaming responses

### Authentication & Security
- 🔐 JWT + Refresh token rotation
- 🌐 OAuth (Google + GitHub)
- 📧 Email verification
- 🔑 Password reset flow
- 👥 Session management
- 🛡️ Rate limiting and CSRF protection

### Payment Integration
- 💳 Stripe subscription billing
- 📜 Invoice management
- 💰 Payment history tracking
- 🔄 Webhook event handling
- 📊 Billing analytics

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Animation**: Framer Motion
- **State**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **WebSocket**: Socket.IO Client

### Backend
- **Framework**: NestJS 10
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Cache**: Redis (Upstash)
- **Queue**: BullMQ
- **WebSocket**: Socket.IO
- **Auth**: Passport JWT

### Services
- **AI**: OpenAI GPT-4
- **Email**: Resend
- **Storage**: Cloudinary
- **Payments**: Stripe
- **Monitoring**: Sentry
- **Analytics**: PostHog

### DevOps
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway
- **Database**: Supabase
- **CI/CD**: GitHub Actions
- **Containerization**: Docker

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL (Supabase account)
- Redis (Upstash account)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/subtrack-pro.git
cd subtrack-pro

# Install dependencies
npm install -g pnpm
pnpm install

# Setup environment variables
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local

# Edit .env files with your credentials
```

### Database Setup

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### Start Development

```bash
# Terminal 1: Backend
cd apps/api
npm run start:dev
# 🚀 API: http://localhost:4000

# Terminal 2: Frontend
cd apps/web
npm run dev
# 🌐 Web: http://localhost:3000
```

---

## 📦 Project Structure

```
subtrack-pro/
├── apps/
│   ├── web/                    # Next.js Frontend
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities
│   │   └── store/            # Zustand stores
│   │
│   └── api/                    # NestJS Backend
│       ├── src/
│       │   ├── auth/          # Authentication
│       │   ├── subscriptions/ # Core business logic
│       │   ├── ai/            # AI services
│       │   ├── notifications/ # WebSocket gateway
│       │   ├── email/         # Email service
│       │   └── payments/      # Stripe integration
│       └── prisma/            # Database schema
│
├── packages/
│   ├── types/                  # Shared TypeScript types
│   └── ui/                     # Shared UI components
│
├── docker/                     # Docker configurations
├── docs/                       # Documentation
└── .github/                    # CI/CD workflows
```

---

## 🎨 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)
*Premium glassmorphism dashboard with real-time analytics*

### Add Subscription
![Add Subscription](docs/screenshots/add-subscription.png)
*Multi-step animated form with service autocomplete*

### AI Assistant
![AI Assistant](docs/screenshots/ai-chat.png)
*Conversational AI for subscription insights*

### Analytics
![Analytics](docs/screenshots/analytics.png)
*Detailed spending analytics and trends*

---

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment instructions.

### Quick Deploy

**Frontend (Vercel)**
```bash
vercel --prod
```

**Backend (Railway)**
```bash
railway up
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
```

---

## 📊 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:4000/api/docs
- **API Health**: http://localhost:4000/api/health

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 Environment Variables

See [.env.example](.env.example) for all required environment variables.

**Critical Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret
- `OPENAI_API_KEY`: OpenAI API key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `RESEND_API_KEY`: Resend email API key

---

## 🛣️ Roadmap

- [x] Core subscription tracking
- [x] AI chatbot assistant
- [x] Real-time WebSocket notifications
- [x] Stripe payment integration
- [x] Email automation
- [ ] Mobile apps (React Native)
- [ ] Browser extension
- [ ] Slack/Discord integration
- [ ] Export to CSV/PDF
- [ ] Team collaboration features
- [ ] API for third-party integrations
- [ ] Advanced analytics dashboard

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [NestJS](https://nestjs.com) - Node.js framework
- [Prisma](https://prisma.io) - Database ORM
- [Shadcn UI](https://ui.shadcn.com) - UI components
- [Framer Motion](https://framer.com/motion) - Animations
- [OpenAI](https://openai.com) - AI capabilities

---

## 📧 Contact

**Project Maintainer**: Your Name  
**Email**: your.email@example.com  
**Website**: https://subtrack.app  
**Twitter**: [@subtrackpro](https://twitter.com/subtrackpro)

---

<div align="center">

**[⬆ back to top](#-subtrack-pro)**

Made with ❤️ by developers, for developers

⭐ Star this repo if you find it useful!

</div>
