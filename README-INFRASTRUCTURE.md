# Bole.to MVP Infrastructure

## Quick Start

The Bole.to MVP infrastructure has been set up to deploy a complete staging environment with:
- Gateway service (Node.js reverse proxy)
- Hi.Events backend (Laravel/PHP)
- Managed PostgreSQL database
- SSL-enabled domain with Cloudflare

## 🚀 Deploy to Staging (Fastest Path)

### Prerequisites
- DigitalOcean account
- Cloudflare account (domain managed by Cloudflare)
- GitHub repository access

### 1. Configure Secrets
Run the setup helper:
```bash
./infra/scripts/setup-secrets.sh
```

### 2. Deploy Infrastructure
```bash
# Option A: Manual deployment
./infra/scripts/deploy-staging.sh

# Option B: GitHub Actions (recommended)
# Push to 'develop' branch or trigger manually
```

### 3. Verify Deployment
```bash
./infra/scripts/verify-deployment.sh
```

### 4. Update Mobile App
Update the mobile app to use the staging API:
```typescript
// apps/mobile/src/api/index.tsx
const API_BASE_URL = 'https://staging-api.bole.to';
```

## 📁 Repository Structure

```
├── apps/
│   ├── gateway/                 # Node.js API Gateway (NEW)
│   │   ├── src/
│   │   │   ├── index.js        # Express server with reverse proxy
│   │   │   ├── middleware/     # Error handling, etc.
│   │   │   └── utils/          # Health checks, etc.
│   │   ├── package.json
│   │   └── Dockerfile
│   └── mobile/                  # React Native/Expo app (EXISTING)
│
├── services/
│   └── hi-events/              # Laravel backend (EXISTING)
│
├── infra/
│   ├── terraform/
│   │   └── staging/            # Terraform infrastructure (NEW)
│   │       ├── main.tf         # DigitalOcean + Cloudflare resources
│   │       ├── variables.tf    # Configuration variables
│   │       └── outputs.tf      # Deployment outputs
│   └── scripts/                # Deployment scripts (NEW)
│       ├── deploy-staging.sh   # Full deployment automation
│       ├── setup-secrets.sh    # Environment setup helper
│       └── verify-deployment.sh # Test all endpoints
│
├── docs/mvp/                   # Documentation (NEW)
│   ├── infrastructure-setup.md # Complete infrastructure guide
│   ├── api-endpoints.md        # API reference
│   └── mobile-integration.md   # Mobile app integration
│
└── .github/workflows/          # CI/CD automation (NEW)
    └── deploy-staging.yml      # Automated staging deployment
```

## 🌐 Architecture

```
Mobile App → Cloudflare → Gateway → Hi.Events Backend → PostgreSQL
                ↓             ↓            ↓
              SSL/CDN    Reverse Proxy   JWT Auth
                         CORS Config    Stripe API
                         Logging        Email Service
```

### Components

1. **Gateway Service** (`apps/gateway/`)
   - Express.js reverse proxy
   - CORS configuration for mobile apps
   - Request logging with unique IDs
   - Health check endpoints
   - Security headers (Helmet.js)

2. **Hi.Events Backend** (`services/hi-events/`)
   - Laravel 10+ application
   - JWT authentication
   - Event management APIs
   - Stripe payment integration
   - Email notifications

3. **Infrastructure**
   - DigitalOcean App Platform (hosting)
   - Managed PostgreSQL database
   - Cloudflare (DNS, SSL, CDN)
   - Container registry

## 💰 Cost Breakdown

**Staging Environment (~$26/month)**:
- Gateway app: $5/month (basic-xxs)
- Hi.Events app: $5/month (basic-xxs)  
- PostgreSQL: $15/month (db-s-1vcpu-1gb)
- Container registry: $0 (free tier)
- Cloudflare: $0 (free features)

## 🔧 Configuration

### Required Environment Variables

**DigitalOcean & Cloudflare**:
- `DIGITALOCEAN_TOKEN` - API access token
- `CLOUDFLARE_API_TOKEN` - DNS management token

**Application**:
- `LARAVEL_APP_KEY` - Laravel encryption key
- `JWT_SECRET` - JWT signing secret

**Services**:
- `STRIPE_PUBLIC_KEY_TEST` / `STRIPE_SECRET_KEY_TEST`
- `MAIL_HOST` / `MAIL_USERNAME` / `MAIL_PASSWORD`

### Gateway Configuration
```env
NODE_ENV=production
HIEVENTS_BACKEND_URL=https://your-backend-url
CORS_ORIGINS=exp://localhost:*,https://staging-api.bole.to
```

### Hi.Events Configuration
```env
DB_HOST=your-postgres-host
DB_DATABASE=hievents_staging
STRIPE_SECRET_KEY=sk_test_your_key
MAIL_MAILER=smtp
```

## 🔍 Health Checks

- **Gateway**: `https://staging-api.bole.to/healthz`
- **Deep Check**: `https://staging-api.bole.to/healthz?deep=true`
- **Backend**: `https://staging-api.bole.to/api/public/color-themes`

## 📱 Mobile Integration

The mobile app needs these updates to connect to staging:

1. **Update API URL**:
   ```typescript
   const API_BASE_URL = 'https://staging-api.bole.to';
   ```

2. **Implement JWT Authentication**:
   ```typescript
   import { gatewayAuthService } from './gateway-auth-service';
   
   // Login
   const response = await gatewayAuthService.login({ email, password });
   
   // Make authenticated requests
   const user = await gatewayAuthService.fetchCurrentUser();
   ```

3. **Configure Network Requests**:
   ```typescript
   const headers = {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json',
   };
   ```

See [`docs/mvp/mobile-integration.md`](./docs/mvp/mobile-integration.md) for complete integration guide.

## 🧪 Testing

### Manual Testing
```bash
# Test all endpoints
./infra/scripts/verify-deployment.sh

# Test specific URL
./infra/scripts/verify-deployment.sh https://your-custom-url.com
```

### API Testing
```bash
# Health check
curl https://staging-api.bole.to/healthz

# Public endpoint
curl https://staging-api.bole.to/api/public/color-themes

# Register user
curl -X POST https://staging-api.bole.to/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"User","email":"test@example.com","password":"password123","password_confirmation":"password123"}'
```

## 🚨 Troubleshooting

### Common Issues

1. **Deployment Fails**
   - Check all secrets are configured in GitHub
   - Verify API tokens have correct permissions
   - Ensure domain is added to Cloudflare

2. **Health Checks Fail**
   - Wait 60-90 seconds for services to start
   - Check logs: DigitalOcean Console → Apps → View Logs
   - Verify database connectivity

3. **CORS Errors**
   - Update gateway `CORS_ORIGINS` environment variable
   - Check mobile app is using correct API URL

4. **Authentication Issues**
   - Verify JWT_SECRET is configured
   - Check Laravel APP_KEY is set
   - Ensure database migrations ran

### Debug Commands
```bash
# Check Terraform state
cd infra/terraform/staging && terraform show

# View app logs
doctl apps logs <app-id> --follow

# Test database connection
psql $DATABASE_URL -c "SELECT version();"
```

## 🔄 Deployment Workflow

### GitHub Actions (Automatic)
1. Push to `develop` branch
2. Terraform plan runs automatically
3. Review plan in Actions tab
4. Changes deploy automatically
5. Health checks verify deployment

### Manual Deployment
1. `./infra/scripts/setup-secrets.sh` - Configure environment
2. `./infra/scripts/deploy-staging.sh` - Deploy infrastructure
3. `./infra/scripts/verify-deployment.sh` - Verify deployment

## 📈 Scaling & Production

### Production Differences
- Larger instance sizes (`professional-xs` minimum)
- Multi-region database with read replicas
- Redis for caching and sessions
- Enhanced monitoring (APM, log aggregation)
- WAF and advanced security features

### Monitoring
- DigitalOcean built-in monitoring
- Health checks every 30 seconds
- Email alerts on failures
- Consider: UptimeRobot, New Relic, or DataDog

## 📞 Support

### Quick Reference
- **Staging API**: https://staging-api.bole.to
- **Health Check**: https://staging-api.bole.to/healthz
- **Infrastructure Docs**: [`docs/mvp/infrastructure-setup.md`](./docs/mvp/infrastructure-setup.md)
- **API Reference**: [`docs/mvp/api-endpoints.md`](./docs/mvp/api-endpoints.md)

### Getting Help
1. Check health endpoints first
2. Review deployment logs in DigitalOcean console
3. Run verification script: `./infra/scripts/verify-deployment.sh`
4. Check [troubleshooting guide](./docs/mvp/infrastructure-setup.md#troubleshooting)

---

## ✅ Ready to Deploy?

1. **Fork/Clone Repository**: Ensure you have the latest code
2. **Run Setup**: `./infra/scripts/setup-secrets.sh`
3. **Configure Secrets**: Add required tokens to GitHub or terraform.tfvars
4. **Deploy**: Push to `develop` branch or run `./infra/scripts/deploy-staging.sh`
5. **Verify**: Run `./infra/scripts/verify-deployment.sh`
6. **Update Mobile**: Point mobile app to staging API
7. **Test Integration**: Verify mobile app can authenticate and make API calls

**🎉 Your staging environment will be live at: https://staging-api.bole.to**

*Total setup time: ~15 minutes (plus propagation time)*