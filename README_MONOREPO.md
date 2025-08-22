# Bole.to - Event Platform Monorepo

## 🏗️ Architecture Overview

```
Bole.to/
├── apps/                      # Frontend Applications
│   ├── web/                  # Next.js customer web app (port 3000)
│   ├── mobile/               # Expo React Native app
│   └── admin/                # Admin portal (Next.js) [stub]
│
├── services/                 # Backend Services
│   ├── hi-events/           # Laravel ticketing backend (port 8000)
│   ├── social/              # Social features microservice (port 4001)
│   └── camera/              # Photo management microservice (port 4002)
│
├── packages/                 # Shared Packages
│   ├── api-core/            # TypeScript SDK for Hi.Events
│   ├── api-social/          # Social API client [stub]
│   ├── api-camera/          # Camera API client [stub]
│   ├── types/               # Shared TypeScript types
│   ├── ui/                  # Shared UI components [stub]
│   └── config/              # Shared configs [stub]
│
└── infra/                    # Infrastructure
    └── docker/              # Docker compose for local dev

```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- iOS/Android development environment (for mobile app)

### 1. Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 2. Start Infrastructure (Docker)

```bash
# Start all backend services
pnpm docker:up

# Or manually:
docker compose -f infra/docker/compose.dev.yml up -d
```

This starts:
- PostgreSQL (port 5433)
- Redis (port 6380)
- MinIO S3 (ports 9000/9001)
- Mailpit (ports 1025/8025)
- Hi.Events API (port 8000)
- Social Service (port 4001)
- Camera Service (port 4002)

### 3. Initialize Hi.Events Database

```bash
# First time setup
docker exec -it boleto-hi-events php artisan key:generate
docker exec -it boleto-hi-events php artisan jwt:secret
docker exec -it boleto-hi-events php artisan migrate --seed

# Start queue worker (in background)
docker exec -d boleto-hi-events php artisan queue:work
```

### 4. Start Frontend Apps

```bash
# In separate terminals:

# Web app
pnpm dev:web
# Visit http://localhost:3000

# Mobile app
pnpm dev:mobile
# Scan QR code with Expo Go app

# Or start everything at once
pnpm dev
```

## 📱 Mobile App Location

Your mobile app is located at: **`apps/mobile/`**

### Mobile App Structure:
```
apps/mobile/
├── src/
│   ├── api/          # API client configuration
│   ├── auth/         # Authentication & token management
│   ├── screens/      # Screen components
│   │   ├── HomeScreen.tsx      # Events list
│   │   └── ScannerScreen.tsx   # QR code scanner
│   ├── components/   # Reusable components
│   ├── hooks/        # Custom React hooks
│   └── utils/        # Utility functions
├── assets/           # Images, fonts, etc.
├── app.config.ts     # Expo configuration
├── App.tsx           # App entry point
└── package.json      # Dependencies
```

### Key Mobile Features:
- ✅ JWT token storage with expo-secure-store
- ✅ QR code scanning for check-ins
- ✅ Camera integration for event photos
- ✅ Offline data with SQLite
- ✅ API client with React Query
- ✅ TypeScript throughout

## 🌐 Web App Location

Your web app is located at: **`apps/web/`**

## 🔧 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:3000 | Customer-facing website |
| Hi.Events API | http://localhost:8000 | Main ticketing backend |
| Social API | http://localhost:4001 | Social features |
| Camera API | http://localhost:4002 | Photo management |
| MinIO Console | http://localhost:9001 | S3 storage (minio/miniosecret) |
| Mailpit | http://localhost:8025 | Email testing UI |

## 🔑 Environment Variables

### Mobile App (`apps/mobile/.env.development`)
```env
API_CORE_URL=http://localhost:8000
API_SOCIAL_URL=http://localhost:4001
API_CAMERA_URL=http://localhost:4002
```

### Web App (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_CORE_URL=http://localhost:8000
NEXT_PUBLIC_API_SOCIAL_URL=http://localhost:4001
NEXT_PUBLIC_API_CAMERA_URL=http://localhost:4002
```

### Hi.Events Backend (`services/hi-events/backend/.env`)
- Already configured for local development
- Add your Stripe keys when ready:
  - `STRIPE_KEY=pk_test_xxx`
  - `STRIPE_SECRET=sk_test_xxx`

## 📦 Package Scripts

```bash
# Development
pnpm dev              # Start all dev servers
pnpm dev:web         # Start web app only
pnpm dev:mobile      # Start mobile app only
pnpm dev:social      # Start social service only
pnpm dev:camera      # Start camera service only

# Docker
pnpm docker:up       # Start Docker services
pnpm docker:down     # Stop Docker services

# Build
pnpm build           # Build all packages
pnpm typecheck       # Type check all packages
pnpm lint            # Lint all packages
```

## 🧪 Testing Services

```bash
# Check if services are running
curl http://localhost:8000/          # Hi.Events (should return Laravel)
curl http://localhost:4001/health    # Social service
curl http://localhost:4002/health    # Camera service

# Test mobile app on device
# 1. Install Expo Go on your phone
# 2. Run: pnpm dev:mobile
# 3. Scan the QR code shown in terminal
```

## 🏗️ Development Workflow

1. **Backend changes**: Edit files in `services/hi-events/backend/`
2. **Mobile app changes**: Edit files in `apps/mobile/src/`
3. **Web app changes**: Edit files in `apps/web/`
4. **Shared types**: Edit `packages/types/src/index.ts`
5. **API client**: Edit `packages/api-core/src/`

All changes hot-reload automatically!

## 🐛 Troubleshooting

### Docker issues
```bash
# Reset everything
docker compose -f infra/docker/compose.dev.yml down -v
docker compose -f infra/docker/compose.dev.yml up -d

# Check logs
docker logs boleto-hi-events
docker logs boleto-social
docker logs boleto-camera
```

### Mobile app issues
```bash
# Clear cache
cd apps/mobile
npx expo start -c

# Reset Metro bundler
watchman watch-del-all
```

### Database issues
```bash
# Reset database
docker exec -it boleto-hi-events php artisan migrate:fresh --seed
```

## 📚 Documentation

- [Hi.Events Backend Documentation](./HI_EVENTS_BACKEND_DOCUMENTATION.md)
- [Expo Documentation](https://docs.expo.dev/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🎯 Next Steps

1. **Configure Stripe**: Add your Stripe test keys to `services/hi-events/backend/.env`
2. **Generate TypeScript types**: From Hi.Events OpenAPI spec
3. **Build authentication flow**: Login/register screens for mobile & web
4. **Implement scanner**: Complete QR code check-in flow
5. **Add social features**: Posts, comments, reactions in social service
6. **Camera integration**: Photo upload and D+1 reveal logic

## 📝 License

Proprietary - Bole.to © 2024