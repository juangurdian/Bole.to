# Application Performance Monitoring (APM) Setup for Bole.to

## Overview

Comprehensive APM setup for the Bole.to production environment, including error tracking, performance monitoring, and real-time alerting across all services.

## APM Stack Architecture

### 1. Core Monitoring Stack

**Primary Tools:**
- **APM**: Datadog APM or New Relic (recommended: Datadog for AWS integration)
- **Error Tracking**: Sentry.io for detailed error reporting
- **Log Management**: AWS CloudWatch Logs + Datadog Log Management
- **Synthetic Monitoring**: Datadog Synthetics for proactive monitoring
- **Real User Monitoring**: Datadog RUM for mobile app performance

### 2. Service-Specific Monitoring

**Gateway Service Monitoring:**
```javascript
// File: /services/gateway/src/monitoring/apm.js

const tracer = require('dd-trace').init({
  service: 'bole-to-gateway',
  version: process.env.APP_VERSION || '1.0.0',
  env: process.env.NODE_ENV || 'production',
  profiling: true,
  runtimeMetrics: true,
  appsec: true, // Application security monitoring
});

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  release: process.env.APP_VERSION || '1.0.0',
  integrations: [
    new ProfilingIntegration(),
  ],
  // Performance monitoring
  tracesSampleRate: 0.1, // 10% of transactions
  profilesSampleRate: 0.1, // 10% of transactions
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    return event;
  }
});

// Custom metrics for payment operations
const StatsD = require('node-statsd');
const metrics = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'bole-to.gateway.',
});

module.exports = {
  tracer,
  Sentry,
  metrics,
  
  // Track payment operations
  trackPaymentOperation: (operation, duration, success) => {
    metrics.timing(`payment.${operation}.duration`, duration);
    metrics.increment(`payment.${operation}.${success ? 'success' : 'error'}`);
  },

  // Track authentication operations
  trackAuthOperation: (provider, duration, success) => {
    metrics.timing(`auth.${provider}.duration`, duration);
    metrics.increment(`auth.${provider}.${success ? 'success' : 'error'}`);
  },

  // Track API calls to Hi.Events
  trackHiEventsAPI: (endpoint, statusCode, duration) => {
    metrics.timing('hiEvents.api.duration', duration);
    metrics.increment(`hiEvents.api.status.${statusCode}`);
  }
};
```

**Hi.Events Laravel Monitoring:**
```php
<?php
// File: /services/hi-events/app/Monitoring/APMService.php

namespace HiEvents\Monitoring;

use Illuminate\Support\ServiceProvider;
use Datadog\DdTrace\GlobalTracer;
use Sentry\Laravel\Integration;

class APMService extends ServiceProvider
{
    public function boot()
    {
        // Configure Datadog APM
        $this->configureDatadog();
        
        // Configure Sentry error tracking
        $this->configureSentry();
        
        // Set up custom metrics
        $this->setupCustomMetrics();
    }

    private function configureDatadog(): void
    {
        if (config('monitoring.datadog.enabled')) {
            ini_set('datadog.service', 'bole-to-hiEvents');
            ini_set('datadog.version', config('app.version', '1.0.0'));
            ini_set('datadog.env', config('app.env', 'production'));
            
            // Enable database tracing
            ini_set('datadog.trace.db_client_split_by_instance', '1');
            ini_set('datadog.trace.redis_client_split_by_host', '1');
        }
    }

    private function configureSentry(): void
    {
        \Sentry\init([
            'dsn' => config('sentry.dsn'),
            'environment' => config('app.env'),
            'release' => config('app.version'),
            'sample_rate' => 1.0, // All errors
            'traces_sample_rate' => 0.1, // 10% of performance transactions
            'before_send' => function (\Sentry\Event $event): ?\Sentry\Event {
                // Filter sensitive data
                if ($event->getRequest()) {
                    $request = $event->getRequest();
                    $headers = $request->getHeaders();
                    unset($headers['authorization'], $headers['cookie']);
                    $request->setHeaders($headers);
                }
                return $event;
            },
        ]);
    }

    private function setupCustomMetrics(): void
    {
        // Register custom metrics collectors
        $this->app->singleton(MetricsCollector::class, function () {
            return new MetricsCollector(
                config('monitoring.statsd.host', 'localhost'),
                config('monitoring.statsd.port', 8125),
                'bole-to.hiEvents.'
            );
        });
    }
}

class MetricsCollector
{
    private $statsd;

    public function __construct(string $host, int $port, string $prefix)
    {
        $this->statsd = new \Domnikl\Statsd\Client(
            new \Domnikl\Statsd\Connection\UdpSocket($host, $port),
            $prefix
        );
    }

    public function trackStripeOperation(string $operation, float $duration, bool $success): void
    {
        $this->statsd->timing("stripe.{$operation}.duration", $duration);
        $this->statsd->increment("stripe.{$operation}." . ($success ? 'success' : 'error'));
    }

    public function trackOrderCreation(float $duration, string $paymentMethod): void
    {
        $this->statsd->timing('order.creation.duration', $duration);
        $this->statsd->increment("order.creation.payment_method.{$paymentMethod}");
    }

    public function trackEventCreation(float $duration, int $ticketCount): void
    {
        $this->statsd->timing('event.creation.duration', $duration);
        $this->statsd->gauge('event.average_ticket_count', $ticketCount);
    }

    public function trackWebhookProcessing(string $eventType, float $duration, bool $success): void
    {
        $this->statsd->timing("webhook.{$eventType}.duration", $duration);
        $this->statsd->increment("webhook.{$eventType}." . ($success ? 'success' : 'error'));
    }
}
```

**Mobile App Monitoring (React Native):**
```javascript
// File: /apps/mobile/src/monitoring/apm.ts

import { initializeAgent } from '@datadog/mobile-react-native';
import * as Sentry from '@sentry/react-native';
import { SENTRY_DSN, DATADOG_APPLICATION_ID, DATADOG_CLIENT_TOKEN } from '../config/monitoring';

// Initialize Datadog RUM
initializeAgent({
  applicationId: DATADOG_APPLICATION_ID,
  clientToken: DATADOG_CLIENT_TOKEN,
  env: __DEV__ ? 'development' : 'production',
  version: '1.0.0',
  trackingConsent: 'granted',
  nativeCrashReportEnabled: true,
  sessionSamplingRate: 100, // 100% of sessions
  resourceTracking: {
    firstPartyHosts: ['api.bole.to'],
  },
  actionTracking: {
    touchTargets: true,
  },
});

// Initialize Sentry
const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

Sentry.init({
  dsn: SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation,
    }),
  ],
  beforeSend(event) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.headers?.authorization;
    }
    return event;
  },
});

export class MobileAPMService {
  static trackAuthFlow(provider: string, success: boolean, duration: number) {
    // Custom metric for auth flows
    console.log(`Auth flow - Provider: ${provider}, Success: ${success}, Duration: ${duration}ms`);
    
    if (success) {
      Sentry.addBreadcrumb({
        message: `Successful auth with ${provider}`,
        level: 'info',
        data: { duration, provider },
      });
    } else {
      Sentry.captureException(new Error(`Auth failed with ${provider}`), {
        tags: { provider, duration },
      });
    }
  }

  static trackPaymentFlow(step: string, success: boolean, amount?: number) {
    Sentry.addBreadcrumb({
      message: `Payment flow - Step: ${step}`,
      level: success ? 'info' : 'error',
      data: { step, success, amount },
    });

    if (!success) {
      Sentry.captureException(new Error(`Payment failed at step: ${step}`), {
        tags: { payment_step: step, amount },
      });
    }
  }

  static trackQRScanPerformance(scanDuration: number, success: boolean) {
    Sentry.addBreadcrumb({
      message: 'QR Code Scan Performance',
      level: 'info',
      data: { scanDuration, success },
    });
  }

  static trackOfflineSyncPerformance(itemCount: number, duration: number) {
    Sentry.addBreadcrumb({
      message: 'Offline Sync Performance',
      level: 'info',
      data: { itemCount, duration },
    });
  }
}

export { routingInstrumentation };
```

## 3. Infrastructure Monitoring

**CloudWatch Configuration:**
```yaml
# File: /infra/monitoring/cloudwatch-config.yml

CustomMetrics:
  - MetricName: "PaymentSuccess"
    Namespace: "Bole.to/Payments"
    Dimensions:
      - Name: "Environment"
        Value: "production"
    Unit: "Count"
    
  - MetricName: "PaymentLatency"
    Namespace: "Bole.to/Payments"
    Unit: "Milliseconds"
    
  - MetricName: "AuthenticationLatency"
    Namespace: "Bole.to/Auth"
    Unit: "Milliseconds"

Alarms:
  - AlarmName: "HighErrorRate"
    MetricName: "ErrorRate"
    Threshold: 5
    ComparisonOperator: "GreaterThanThreshold"
    EvaluationPeriods: 2
    Actions:
      - "arn:aws:sns:us-east-1:ACCOUNT_ID:critical-alerts"
      
  - AlarmName: "HighLatency"
    MetricName: "ResponseTime"
    Threshold: 2000
    ComparisonOperator: "GreaterThanThreshold"
    EvaluationPeriods: 3
    Actions:
      - "arn:aws:sns:us-east-1:ACCOUNT_ID:performance-alerts"
      
  - AlarmName: "DatabaseConnectionExhaustion"
    MetricName: "DatabaseConnections"
    Threshold: 90
    ComparisonOperator: "GreaterThanThreshold"
    EvaluationPeriods: 1
    Actions:
      - "arn:aws:sns:us-east-1:ACCOUNT_ID:critical-alerts"
```

**Datadog Agent Configuration:**
```yaml
# File: /infra/monitoring/datadog-agent.yml

api_key: ${DATADOG_API_KEY}
site: datadoghq.com
hostname: bole-to-production

logs_enabled: true
process_config:
  enabled: "true"
  
apm_config:
  enabled: true
  env: production
  primary_tag: service
  analyzed_rate_by_service:
    "bole-to-gateway|production": 1.0
    "bole-to-hiEvents|production": 1.0

integrations:
  postgres:
    host: ${RDS_ENDPOINT}
    username: ${DB_MONITORING_USER}
    password: ${DB_MONITORING_PASSWORD}
    
  redis:
    host: ${REDIS_ENDPOINT}
    
  nginx:
    nginx_status_url: http://localhost/nginx_status/
    
  docker:
    collect_container_size: true
    collect_exit_codes: true
    
logs:
  - type: docker
    service: bole-to-gateway
    source: nodejs
    
  - type: docker
    service: bole-to-hiEvents
    source: php
    
  - type: file
    path: /var/log/nginx/access.log
    service: nginx
    source: nginx
    
custom_checks:
  - name: stripe_webhook_health
    command: "curl -f https://api.bole.to/api/webhooks/stripe/health"
    interval: 60
    
  - name: payment_processing_health
    command: "curl -f https://api.bole.to/api/health/payments"
    interval: 30
```

## 4. Error Tracking and Alerting

**Comprehensive Error Handling Middleware:**
```php
<?php
// File: /services/hi-events/app/Http/Middleware/ErrorTrackingMiddleware.php

namespace HiEvents\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use HiEvents\Monitoring\MetricsCollector;
use Sentry\Laravel\Integration;

class ErrorTrackingMiddleware
{
    public function __construct(
        private MetricsCollector $metrics
    ) {}

    public function handle(Request $request, Closure $next)
    {
        $startTime = microtime(true);
        
        try {
            $response = $next($request);
            
            // Track successful requests
            $duration = (microtime(true) - $startTime) * 1000;
            $this->metrics->trackAPIRequest(
                $request->route()->getName() ?? 'unknown',
                $response->getStatusCode(),
                $duration
            );
            
            return $response;
            
        } catch (\Throwable $exception) {
            $duration = (microtime(true) - $startTime) * 1000;
            
            // Track error metrics
            $this->metrics->trackAPIError(
                $request->route()->getName() ?? 'unknown',
                get_class($exception),
                $duration
            );
            
            // Enhanced error context for Sentry
            \Sentry\configureScope(function (\Sentry\State\Scope $scope) use ($request, $exception): void {
                $scope->setTag('api_endpoint', $request->route()->getName() ?? 'unknown');
                $scope->setTag('request_method', $request->method());
                $scope->setContext('request_data', [
                    'url' => $request->url(),
                    'method' => $request->method(),
                    'headers' => $this->filterSensitiveHeaders($request->headers->all()),
                    'payload_size' => strlen($request->getContent()),
                ]);
                
                if ($request->user()) {
                    $scope->setUser([
                        'id' => $request->user()->id,
                        'email' => $request->user()->email,
                    ]);
                }
            });
            
            \Sentry\captureException($exception);
            
            throw $exception;
        }
    }

    private function filterSensitiveHeaders(array $headers): array
    {
        $sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
        
        foreach ($sensitiveHeaders as $header) {
            if (isset($headers[$header])) {
                $headers[$header] = ['[FILTERED]'];
            }
        }
        
        return $headers;
    }
}
```

## 5. Synthetic Monitoring

**Synthetic API Tests:**
```javascript
// File: /infra/monitoring/synthetic-tests.js

const syntheticTests = [
  {
    name: "Payment Flow End-to-End",
    url: "https://api.bole.to",
    frequency: 300, // 5 minutes
    locations: ["us-east", "us-west", "eu-central"],
    test: async (browser) => {
      // 1. Test OAuth flow
      await browser.get('/auth/google');
      await browser.waitForElement('.oauth-redirect');
      
      // 2. Test event creation
      await browser.post('/api/events', {
        title: 'Synthetic Test Event',
        date: '2024-12-01',
        tickets: [{ name: 'General', price: 2500 }]
      });
      
      // 3. Test payment intent creation
      const paymentIntent = await browser.post('/api/orders/payment-intent', {
        event_id: 'test-event-id',
        tickets: [{ id: 1, quantity: 1 }]
      });
      
      expect(paymentIntent.client_secret).toBeDefined();
      expect(paymentIntent.amount).toBe(2500);
    }
  },
  
  {
    name: "Mobile API Health Check",
    url: "https://api.bole.to/healthz",
    frequency: 60, // 1 minute
    locations: ["us-east"],
    assertions: [
      { type: "statusCode", operator: "is", value: 200 },
      { type: "responseTime", operator: "lessThan", value: 2000 },
      { type: "body", operator: "contains", value: "healthy" }
    ]
  },
  
  {
    name: "Stripe Webhook Endpoint",
    url: "https://api.bole.to/api/webhooks/stripe/health",
    frequency: 300, // 5 minutes
    method: "GET",
    assertions: [
      { type: "statusCode", operator: "is", value: 200 }
    ]
  }
];

module.exports = syntheticTests;
```

## 6. Performance Monitoring Setup

**Database Performance Monitoring:**
```sql
-- File: /infra/monitoring/db-performance-queries.sql

-- Monitor slow queries
SELECT 
    query,
    mean_time,
    calls,
    total_time,
    mean_time / calls as avg_time_per_call
FROM pg_stat_statements 
WHERE mean_time > 100 -- Queries taking more than 100ms on average
ORDER BY mean_time DESC 
LIMIT 20;

-- Monitor database connections
SELECT 
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active_connections,
    count(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity;

-- Monitor table sizes and bloat
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
LIMIT 10;
```

This comprehensive APM setup provides:
- Real-time error tracking with Sentry
- Performance monitoring with Datadog
- Custom metrics for business-critical operations
- Synthetic monitoring for proactive issue detection
- Database performance monitoring
- Infrastructure-level monitoring via CloudWatch
- Mobile app performance tracking

The monitoring stack is designed to provide complete visibility into your payment processing pipeline while maintaining security and performance standards.