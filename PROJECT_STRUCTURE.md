# SubTrack Pro - Production Architecture

## Complete Folder Structure

```
subtrack-pro/
├── apps/
│   ├── web/                           # Next.js 15 App Router Frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── signup/
│   │   │   │   ├── verify-email/
│   │   │   │   └── reset-password/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx            # Main Dashboard
│   │   │   │   ├── subscriptions/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── add/
│   │   │   │   │   └── [id]/
│   │   │   │   ├── analytics/
│   │   │   │   ├── ai-assistant/
│   │   │   │   ├── notifications/
│   │   │   │   └── settings/
│   │   │   ├── api/                    # API Routes
│   │   │   │   ├── auth/
│   │   │   │   ├── subscriptions/
│   │   │   │   ├── analytics/
│   │   │   │   ├── ai/
│   │   │   │   └── webhooks/
│   │   │   ├── layout.tsx
│   │   │   ├── globals.css
│   │   │   └── providers.tsx
│   │   ├── components/
│   │   │   ├── ui/                     # Shadcn components
│   │   │   ├── dashboard/
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── SpendingChart.tsx
│   │   │   │   ├── UpcomingRenewals.tsx
│   │   │   │   ├── CategoryBreakdown.tsx
│   │   │   │   └── AIInsights.tsx
│   │   │   ├── subscriptions/
│   │   │   │   ├── SubscriptionCard.tsx
│   │   │   │   ├── AddSubscriptionModal.tsx
│   │   │   │   ├── ServiceAutocomplete.tsx
│   │   │   │   └── UsageTracker.tsx
│   │   │   ├── ai/
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── StreamingMessage.tsx
│   │   │   │   └── SuggestedPrompts.tsx
│   │   │   ├── notifications/
│   │   │   │   ├── NotificationCenter.tsx
│   │   │   │   └── ToastContainer.tsx
│   │   │   └── shared/
│   │   │       ├── CommandPalette.tsx
│   │   │       ├── GlobalSearch.tsx
│   │   │       └── ThemeToggle.tsx
│   │   ├── hooks/
│   │   │   ├── useSubscriptions.ts
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useAI.ts
│   │   │   └── useNotifications.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── socket.ts
│   │   │   ├── utils.ts
│   │   │   └── constants.ts
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   ├── subscriptionStore.ts
│   │   │   └── uiStore.ts
│   │   ├── types/
│   │   ├── public/
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                           # NestJS Backend
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── auth/
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── auth.controller.ts
│       │   │   ├── strategies/
│       │   │   │   ├── jwt.strategy.ts
│       │   │   │   ├── refresh.strategy.ts
│       │   │   │   ├── google.strategy.ts
│       │   │   │   └── github.strategy.ts
│       │   │   ├── guards/
│       │   │   └── decorators/
│       │   ├── subscriptions/
│       │   │   ├── subscriptions.module.ts
│       │   │   ├── subscriptions.service.ts
│       │   │   ├── subscriptions.controller.ts
│       │   │   └── dto/
│       │   ├── analytics/
│       │   ├── ai/
│       │   │   ├── ai.module.ts
│       │   │   ├── ai.service.ts
│       │   │   ├── ai.controller.ts
│       │   │   └── prompts/
│       │   ├── notifications/
│       │   │   ├── notifications.module.ts
│       │   │   ├── notifications.service.ts
│       │   │   ├── notifications.gateway.ts
│       │   │   └── dto/
│       │   ├── payments/
│       │   │   ├── payments.module.ts
│       │   │   ├── payments.service.ts
│       │   │   ├── payments.controller.ts
│       │   │   └── stripe.service.ts
│       │   ├── email/
│       │   │   ├── email.module.ts
│       │   │   ├── email.service.ts
│       │   │   ├── email.processor.ts
│       │   │   └── templates/
│       │   ├── users/
│       │   ├── database/
│       │   │   └── prisma.service.ts
│       │   ├── common/
│       │   │   ├── guards/
│       │   │   ├── interceptors/
│       │   │   ├── pipes/
│       │   │   ├── filters/
│       │   │   └── middleware/
│       │   └── config/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       ├── test/
│       ├── nest-cli.json
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── types/                         # Shared TypeScript types
│   ├── ui/                            # Shared UI components
│   └── config/                        # Shared configurations
│
├── docker/
│   ├── Dockerfile.web
│   ├── Dockerfile.api
│   └── docker-compose.yml
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── ARCHITECTURE.md
│
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

## Tech Stack Summary

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + Shadcn UI
- Framer Motion
- TanStack Query
- Zustand
- Socket.IO Client
- Recharts

**Backend:**
- NestJS
- TypeScript
- Prisma ORM
- Socket.IO
- BullMQ (Job Queue)
- Redis (Caching)
- Passport JWT

**Database:**
- Supabase PostgreSQL

**Services:**
- Cloudinary (Storage)
- Resend (Email)
- OpenAI (AI)
- Stripe (Payments)
- Upstash Redis

**Deployment:**
- Vercel (Frontend)
- Railway (Backend)
- Supabase (Database)
