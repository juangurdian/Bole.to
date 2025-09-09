# Stripe Live Production Configuration for Bole.to

## Overview

This document provides comprehensive configuration for live Stripe payments in the Bole.to production environment at api.bole.to. It includes security best practices, monitoring, and compliance requirements.

## Production Environment Setup

### 1. Stripe Account Configuration

**Required Stripe Accounts:**
- **Platform Account**: Main Bole.to Stripe account for Connect
- **Connected Accounts**: Individual organizer accounts via Stripe Connect

**Stripe Connect Configuration:**
- Platform: Express or Custom accounts for organizers
- Application fees: Configurable per organizer
- Instant payouts: Available for eligible accounts
- Identity verification: Required for all connected accounts

### 2. Environment Variables

**AWS Secrets Manager Configuration:**

```json
{
  "stripe": {
    "secret_key": "sk_live_...",
    "public_key": "pk_live_...",
    "webhook_secret": "whsec_...",
    "connect_client_id": "ca_...",
    "webhook_endpoints": [
      {
        "url": "https://api.bole.to/api/webhooks/stripe",
        "events": [
          "payment_intent.succeeded",
          "payment_intent.payment_failed",
          "charge.dispute.created",
          "invoice.payment_succeeded",
          "invoice.payment_failed",
          "account.updated",
          "account.application.deauthorized",
          "charge.refund.updated",
          "payout.created",
          "payout.updated"
        ]
      }
    ]
  }
}
```

**Systems Manager Parameter Store:**

```bash
# Non-sensitive configuration parameters
/bole-to/production/stripe/application_fee_percentage
/bole-to/production/stripe/connect_account_type
/bole-to/production/stripe/default_currency
/bole-to/production/stripe/supported_payment_methods
```

### 3. Database Schema Updates

**Enhanced Stripe Tables for Production:**

```sql
-- Enhanced stripe_payments table for production
ALTER TABLE stripe_payments ADD COLUMN IF NOT EXISTS live_mode BOOLEAN DEFAULT true;
ALTER TABLE stripe_payments ADD COLUMN IF NOT EXISTS dispute_status VARCHAR(50);
ALTER TABLE stripe_payments ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20);
ALTER TABLE stripe_payments ADD COLUMN IF NOT EXISTS risk_score INTEGER;
ALTER TABLE stripe_payments ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Payment monitoring table
CREATE TABLE IF NOT EXISTS payment_monitoring_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    stripe_event_id VARCHAR(100) UNIQUE NOT NULL,
    payment_intent_id VARCHAR(100),
    order_id BIGINT,
    account_id BIGINT,
    amount_cents INTEGER,
    currency VARCHAR(3),
    status VARCHAR(50),
    risk_score INTEGER,
    metadata JSONB,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_payment_monitoring_event_type (event_type),
    INDEX idx_payment_monitoring_stripe_event_id (stripe_event_id),
    INDEX idx_payment_monitoring_processed_at (processed_at)
);

-- Fraud detection table
CREATE TABLE IF NOT EXISTS fraud_detection_log (
    id BIGSERIAL PRIMARY KEY,
    payment_intent_id VARCHAR(100) NOT NULL,
    order_id BIGINT NOT NULL,
    risk_score INTEGER,
    risk_level VARCHAR(20),
    fraud_indicators JSONB,
    action_taken VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_fraud_detection_payment_intent (payment_intent_id),
    INDEX idx_fraud_detection_risk_level (risk_level),
    INDEX idx_fraud_detection_created_at (created_at)
);

-- Chargeback and disputes table
CREATE TABLE IF NOT EXISTS payment_disputes (
    id BIGSERIAL PRIMARY KEY,
    stripe_dispute_id VARCHAR(100) UNIQUE NOT NULL,
    charge_id VARCHAR(100) NOT NULL,
    payment_intent_id VARCHAR(100),
    order_id BIGINT,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL,
    reason VARCHAR(100),
    status VARCHAR(50) NOT NULL,
    evidence_details JSONB,
    evidence_due_by TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_payment_disputes_status (status),
    INDEX idx_payment_disputes_evidence_due (evidence_due_by),
    INDEX idx_payment_disputes_order_id (order_id)
);
```

## Security Configuration

### 1. Webhook Security

**Enhanced Webhook Handler with Production Security:**

```php
<?php
// File: /services/hi-events/app/Services/Application/Handlers/Order/Payment/Stripe/ProductionWebhookHandler.php

namespace HiEvents\Services\Application\Handlers\Order\Payment\Stripe;

use HiEvents\Services\Domain\Payment\Stripe\ProductionWebhookSecurityService;
use Illuminate\Http\Request;
use Illuminate\Log\Logger;
use Stripe\Webhook;
use Carbon\Carbon;

class ProductionWebhookHandler extends IncomingWebhookHandler
{
    private const WEBHOOK_TOLERANCE = 300; // 5 minutes
    private const MAX_RETRIES = 3;
    
    public function __construct(
        private readonly ProductionWebhookSecurityService $securityService,
        private readonly Logger $logger,
        ...$dependencies
    ) {
        parent::__construct(...$dependencies);
    }

    public function handleProductionWebhook(Request $request): array
    {
        // 1. Validate webhook signature with enhanced security
        $payload = $request->getContent();
        $signature = $request->header('stripe-signature');
        
        if (!$this->securityService->validateWebhookSignature($payload, $signature)) {
            $this->logger->critical('Invalid Stripe webhook signature', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);
            throw new SecurityException('Invalid webhook signature');
        }

        // 2. Rate limiting protection
        if (!$this->securityService->checkRateLimit($request->ip())) {
            $this->logger->warning('Webhook rate limit exceeded', [
                'ip' => $request->ip(),
                'timestamp' => now(),
            ]);
            throw new RateLimitException('Rate limit exceeded');
        }

        // 3. Process webhook with idempotency
        $event = Webhook::constructEvent(
            $payload,
            $signature,
            config('services.stripe.webhook_secret'),
            self::WEBHOOK_TOLERANCE
        );

        return $this->processEventWithRetry($event);
    }

    private function processEventWithRetry($event): array
    {
        $attempts = 0;
        $lastException = null;

        while ($attempts < self::MAX_RETRIES) {
            try {
                $this->processEvent($event);
                
                // Log successful processing
                $this->logger->info('Stripe webhook processed successfully', [
                    'event_id' => $event->id,
                    'event_type' => $event->type,
                    'attempt' => $attempts + 1,
                ]);

                return ['status' => 'success', 'event_id' => $event->id];
                
            } catch (\Exception $e) {
                $attempts++;
                $lastException = $e;
                
                $this->logger->error('Webhook processing failed', [
                    'event_id' => $event->id,
                    'attempt' => $attempts,
                    'error' => $e->getMessage(),
                ]);

                if ($attempts < self::MAX_RETRIES) {
                    sleep(pow(2, $attempts)); // Exponential backoff
                }
            }
        }

        throw $lastException;
    }
}
```

### 2. Production Security Service

```php
<?php
// File: /services/hi-events/app/Services/Domain/Payment/Stripe/ProductionWebhookSecurityService.php

namespace HiEvents\Services\Domain\Payment\Stripe;

use Illuminate\Cache\Repository;
use Illuminate\Log\Logger;
use Carbon\Carbon;

class ProductionWebhookSecurityService
{
    private const RATE_LIMIT_PER_MINUTE = 100;
    private const SUSPICIOUS_IP_THRESHOLD = 20;

    public function __construct(
        private readonly Repository $cache,
        private readonly Logger $logger
    ) {}

    public function validateWebhookSignature(string $payload, string $signature): bool
    {
        try {
            $webhookSecret = config('services.stripe.webhook_secret');
            $computedSignature = hash_hmac('sha256', $payload, $webhookSecret);
            
            return hash_equals($computedSignature, $signature);
        } catch (\Exception $e) {
            $this->logger->error('Webhook signature validation failed', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    public function checkRateLimit(string $ip): bool
    {
        $key = "webhook_rate_limit:{$ip}";
        $requests = $this->cache->get($key, 0);
        
        if ($requests >= self::RATE_LIMIT_PER_MINUTE) {
            $this->flagSuspiciousIP($ip);
            return false;
        }

        $this->cache->put($key, $requests + 1, Carbon::now()->addMinute());
        return true;
    }

    private function flagSuspiciousIP(string $ip): void
    {
        $flagKey = "suspicious_ip:{$ip}";
        $flags = $this->cache->get($flagKey, 0);
        
        if ($flags >= self::SUSPICIOUS_IP_THRESHOLD) {
            $this->logger->critical('Highly suspicious IP detected', [
                'ip' => $ip,
                'flags' => $flags,
                'timestamp' => now(),
            ]);
            
            // Could integrate with AWS WAF here
            $this->notifySecurityTeam($ip, $flags);
        }

        $this->cache->put($flagKey, $flags + 1, Carbon::now()->addHour());
    }

    private function notifySecurityTeam(string $ip, int $flags): void
    {
        // Integrate with SNS or other alerting system
        // Implementation depends on your alerting infrastructure
    }
}
```

## Payment Monitoring System

### 1. Real-time Payment Monitoring

```php
<?php
// File: /services/hi-events/app/Services/Domain/Payment/Monitoring/PaymentMonitoringService.php

namespace HiEvents\Services\Domain\Payment\Monitoring;

use HiEvents\Repository\Interfaces\PaymentMonitoringRepositoryInterface;
use Illuminate\Log\Logger;
use Carbon\Carbon;

class PaymentMonitoringService
{
    public function __construct(
        private readonly PaymentMonitoringRepositoryInterface $repository,
        private readonly Logger $logger,
        private readonly AlertingService $alerting
    ) {}

    public function recordPaymentEvent(array $eventData): void
    {
        try {
            $monitoringData = [
                'event_type' => $eventData['type'],
                'stripe_event_id' => $eventData['id'],
                'payment_intent_id' => $eventData['data']['object']['id'] ?? null,
                'amount_cents' => $eventData['data']['object']['amount'] ?? null,
                'currency' => $eventData['data']['object']['currency'] ?? null,
                'status' => $eventData['data']['object']['status'] ?? null,
                'metadata' => json_encode($eventData['data']['object']['metadata'] ?? []),
                'processed_at' => Carbon::now(),
            ];

            $this->repository->create($monitoringData);

            // Check for anomalies
            $this->checkForAnomalies($monitoringData);
            
        } catch (\Exception $e) {
            $this->logger->error('Failed to record payment monitoring event', [
                'error' => $e->getMessage(),
                'event_data' => $eventData,
            ]);
        }
    }

    private function checkForAnomalies(array $monitoringData): void
    {
        // 1. High-value transaction alert
        if (($monitoringData['amount_cents'] ?? 0) > 100000) { // $1000+
            $this->alerting->sendAlert('high_value_transaction', [
                'amount' => $monitoringData['amount_cents'],
                'payment_intent_id' => $monitoringData['payment_intent_id'],
            ]);
        }

        // 2. Failed payment spike detection
        if ($monitoringData['status'] === 'failed') {
            $recentFailures = $this->repository->countRecentFailures(
                Carbon::now()->subMinutes(5)
            );

            if ($recentFailures > 10) { // More than 10 failures in 5 minutes
                $this->alerting->sendAlert('payment_failure_spike', [
                    'failure_count' => $recentFailures,
                    'timeframe' => '5 minutes',
                ]);
            }
        }

        // 3. Currency anomaly detection
        $this->detectCurrencyAnomalies($monitoringData);
    }

    private function detectCurrencyAnomalies(array $monitoringData): void
    {
        if (!$monitoringData['currency']) return;

        $recentCurrencies = $this->repository->getRecentCurrencyDistribution(
            Carbon::now()->subHour()
        );

        $unusualCurrencies = ['BTC', 'ETH', 'XRP']; // Example suspicious currencies
        
        if (in_array(strtoupper($monitoringData['currency']), $unusualCurrencies)) {
            $this->alerting->sendAlert('unusual_currency_detected', [
                'currency' => $monitoringData['currency'],
                'payment_intent_id' => $monitoringData['payment_intent_id'],
            ]);
        }
    }
}
```

### 2. Revenue Analytics Service

```php
<?php
// File: /services/hi-events/app/Services/Domain/Analytics/RevenueAnalyticsService.php

namespace HiEvents\Services\Domain\Analytics;

use Carbon\Carbon;
use Illuminate\Database\DatabaseManager;

class RevenueAnalyticsService
{
    public function __construct(
        private readonly DatabaseManager $db
    ) {}

    public function getDailyRevenue(Carbon $date): array
    {
        return $this->db->table('stripe_payments')
            ->select([
                'currency',
                $this->db->raw('COUNT(*) as transaction_count'),
                $this->db->raw('SUM(amount_cents) as total_amount_cents'),
                $this->db->raw('AVG(amount_cents) as average_amount_cents'),
                $this->db->raw('SUM(application_fee_cents) as total_fee_cents')
            ])
            ->whereDate('created_at', $date)
            ->where('status', 'succeeded')
            ->groupBy('currency')
            ->get()
            ->toArray();
    }

    public function getPaymentMethodDistribution(Carbon $startDate, Carbon $endDate): array
    {
        return $this->db->table('stripe_payments')
            ->join('payment_monitoring_events', 'stripe_payments.payment_intent_id', '=', 'payment_monitoring_events.payment_intent_id')
            ->select([
                $this->db->raw("JSON_EXTRACT(payment_monitoring_events.metadata, '$.payment_method_types[0]') as payment_method"),
                $this->db->raw('COUNT(*) as count'),
                $this->db->raw('SUM(stripe_payments.amount_cents) as total_amount')
            ])
            ->whereBetween('stripe_payments.created_at', [$startDate, $endDate])
            ->where('stripe_payments.status', 'succeeded')
            ->groupBy('payment_method')
            ->get()
            ->toArray();
    }

    public function getFailureAnalysis(Carbon $startDate, Carbon $endDate): array
    {
        return $this->db->table('payment_monitoring_events')
            ->select([
                $this->db->raw("JSON_EXTRACT(metadata, '$.last_payment_error.code') as error_code"),
                $this->db->raw("JSON_EXTRACT(metadata, '$.last_payment_error.decline_code') as decline_code"),
                $this->db->raw('COUNT(*) as count'),
                $this->db->raw('AVG(amount_cents) as average_amount')
            ])
            ->where('status', 'failed')
            ->whereBetween('processed_at', [$startDate, $endDate])
            ->groupBy(['error_code', 'decline_code'])
            ->orderByDesc('count')
            ->get()
            ->toArray();
    }

    public function getChargebackAnalysis(): array
    {
        return $this->db->table('payment_disputes')
            ->select([
                'reason',
                'status',
                $this->db->raw('COUNT(*) as count'),
                $this->db->raw('SUM(amount_cents) as total_disputed_amount'),
                $this->db->raw('AVG(amount_cents) as average_disputed_amount')
            ])
            ->groupBy(['reason', 'status'])
            ->orderByDesc('count')
            ->get()
            ->toArray();
    }
}
```

Now let me continue with the fraud detection and alerting system:

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Set up live Stripe configuration for production environment", "status": "completed", "activeForm": "Setting up live Stripe configuration for production"}, {"content": "Configure Stripe webhooks for production endpoints with signature verification", "status": "in_progress", "activeForm": "Configuring Stripe webhooks for production endpoints"}, {"content": "Implement comprehensive payment monitoring and alerting system", "status": "pending", "activeForm": "Implementing payment monitoring and alerting system"}, {"content": "Set up application performance monitoring (APM) and error tracking", "status": "pending", "activeForm": "Setting up APM and error tracking"}, {"content": "Configure fraud detection and chargeback handling", "status": "pending", "activeForm": "Configuring fraud detection and chargeback handling"}, {"content": "Create security compliance checklist and audit logging", "status": "pending", "activeForm": "Creating security compliance and audit logging"}, {"content": "Set up automated incident response and runbooks", "status": "pending", "activeForm": "Setting up automated incident response"}]