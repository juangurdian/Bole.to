<?php
// File: /services/hi-events/app/Services/Domain/Payment/Fraud/FraudDetectionService.php

namespace HiEvents\Services\Domain\Payment\Fraud;

use HiEvents\Repository\Interfaces\FraudDetectionRepositoryInterface;
use HiEvents\Repository\Interfaces\OrderRepositoryInterface;
use Illuminate\Log\Logger;
use Carbon\Carbon;

class FraudDetectionService
{
    private const HIGH_RISK_THRESHOLD = 75;
    private const MEDIUM_RISK_THRESHOLD = 50;
    
    // Fraud indicators with weights
    private const FRAUD_INDICATORS = [
        'high_velocity_cards' => 30,
        'mismatched_billing_shipping' => 25,
        'high_value_first_purchase' => 20,
        'suspicious_email_domain' => 15,
        'multiple_failed_attempts' => 25,
        'unusual_purchase_pattern' => 20,
        'proxy_or_vpn_usage' => 15,
        'device_fingerprint_mismatch' => 10,
    ];

    public function __construct(
        private readonly FraudDetectionRepositoryInterface $fraudRepository,
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly Logger $logger,
        private readonly AlertingService $alerting
    ) {}

    public function analyzePayment(array $paymentData): FraudAnalysisResult
    {
        $indicators = [];
        $riskScore = 0;

        // 1. Check for high-velocity card usage
        if ($this->checkHighVelocityCard($paymentData)) {
            $indicators[] = 'high_velocity_cards';
            $riskScore += self::FRAUD_INDICATORS['high_velocity_cards'];
        }

        // 2. Check billing/shipping address mismatch
        if ($this->checkAddressMismatch($paymentData)) {
            $indicators[] = 'mismatched_billing_shipping';
            $riskScore += self::FRAUD_INDICATORS['mismatched_billing_shipping'];
        }

        // 3. Check for high-value first purchase
        if ($this->checkHighValueFirstPurchase($paymentData)) {
            $indicators[] = 'high_value_first_purchase';
            $riskScore += self::FRAUD_INDICATORS['high_value_first_purchase'];
        }

        // 4. Check for suspicious email domains
        if ($this->checkSuspiciousEmail($paymentData)) {
            $indicators[] = 'suspicious_email_domain';
            $riskScore += self::FRAUD_INDICATORS['suspicious_email_domain'];
        }

        // 5. Check for multiple failed payment attempts
        if ($this->checkMultipleFailedAttempts($paymentData)) {
            $indicators[] = 'multiple_failed_attempts';
            $riskScore += self::FRAUD_INDICATORS['multiple_failed_attempts'];
        }

        // 6. Check for unusual purchase patterns
        if ($this->checkUnusualPurchasePattern($paymentData)) {
            $indicators[] = 'unusual_purchase_pattern';
            $riskScore += self::FRAUD_INDICATORS['unusual_purchase_pattern'];
        }

        // Determine risk level
        $riskLevel = $this->determineRiskLevel($riskScore);

        // Log the analysis
        $analysisResult = new FraudAnalysisResult(
            paymentIntentId: $paymentData['payment_intent_id'],
            riskScore: $riskScore,
            riskLevel: $riskLevel,
            indicators: $indicators,
            actionRecommended: $this->getRecommendedAction($riskLevel)
        );

        $this->logFraudAnalysis($analysisResult, $paymentData);

        // Send alerts for high-risk transactions
        if ($riskLevel === 'high') {
            $this->alerting->sendAlert('high_risk_payment_detected', [
                'payment_intent_id' => $paymentData['payment_intent_id'],
                'risk_score' => $riskScore,
                'indicators' => $indicators,
                'order_amount' => $paymentData['amount_cents'] ?? null,
            ]);
        }

        return $analysisResult;
    }

    private function checkHighVelocityCard(array $paymentData): bool
    {
        if (!isset($paymentData['payment_method_id'])) {
            return false;
        }

        // Check if this payment method has been used frequently in the last hour
        $recentUsage = $this->fraudRepository->countPaymentMethodUsage(
            $paymentData['payment_method_id'],
            Carbon::now()->subHour()
        );

        return $recentUsage > 5; // More than 5 uses in an hour
    }

    private function checkAddressMismatch(array $paymentData): bool
    {
        $billingAddress = $paymentData['billing_address'] ?? null;
        $shippingAddress = $paymentData['shipping_address'] ?? null;

        if (!$billingAddress || !$shippingAddress) {
            return false;
        }

        // Simple address comparison (could be enhanced with geocoding)
        return strtolower($billingAddress['country']) !== strtolower($shippingAddress['country']) ||
               strtolower($billingAddress['postal_code']) !== strtolower($shippingAddress['postal_code']);
    }

    private function checkHighValueFirstPurchase(array $paymentData): bool
    {
        $email = $paymentData['customer_email'] ?? null;
        $amount = $paymentData['amount_cents'] ?? 0;

        if (!$email || $amount < 50000) { // Less than $500
            return false;
        }

        // Check if this is the customer's first purchase
        $previousOrders = $this->orderRepository->countByEmail($email);
        
        return $previousOrders === 0 && $amount > 100000; // First purchase over $1000
    }

    private function checkSuspiciousEmail(array $paymentData): bool
    {
        $email = $paymentData['customer_email'] ?? null;
        
        if (!$email) {
            return false;
        }

        $suspiciousDomains = [
            '10minutemail.com',
            'guerrillamail.com',
            'mailinator.com',
            'throwaway.email',
            'temp-mail.org'
        ];

        $domain = substr(strrchr($email, "@"), 1);
        
        return in_array(strtolower($domain), $suspiciousDomains);
    }

    private function checkMultipleFailedAttempts(array $paymentData): bool
    {
        $email = $paymentData['customer_email'] ?? null;
        
        if (!$email) {
            return false;
        }

        $failedAttempts = $this->fraudRepository->countFailedPaymentAttempts(
            $email,
            Carbon::now()->subHour()
        );

        return $failedAttempts > 3; // More than 3 failed attempts in an hour
    }

    private function checkUnusualPurchasePattern(array $paymentData): bool
    {
        $email = $paymentData['customer_email'] ?? null;
        $amount = $paymentData['amount_cents'] ?? 0;

        if (!$email) {
            return false;
        }

        // Get customer's purchase history
        $previousOrders = $this->orderRepository->getRecentOrdersByEmail($email, 30); // Last 30 days

        if (count($previousOrders) < 2) {
            return false; // Not enough history
        }

        $averageAmount = array_sum(array_column($previousOrders, 'amount_cents')) / count($previousOrders);
        
        // Flag if current purchase is 5x the average
        return $amount > ($averageAmount * 5);
    }

    private function determineRiskLevel(int $riskScore): string
    {
        if ($riskScore >= self::HIGH_RISK_THRESHOLD) {
            return 'high';
        } elseif ($riskScore >= self::MEDIUM_RISK_THRESHOLD) {
            return 'medium';
        }
        
        return 'low';
    }

    private function getRecommendedAction(string $riskLevel): string
    {
        return match ($riskLevel) {
            'high' => 'block_payment',
            'medium' => 'require_additional_verification',
            'low' => 'allow_payment',
            default => 'allow_payment'
        };
    }

    private function logFraudAnalysis(FraudAnalysisResult $result, array $paymentData): void
    {
        $this->fraudRepository->create([
            'payment_intent_id' => $result->paymentIntentId,
            'order_id' => $paymentData['order_id'] ?? null,
            'risk_score' => $result->riskScore,
            'risk_level' => $result->riskLevel,
            'fraud_indicators' => json_encode($result->indicators),
            'action_taken' => $result->actionRecommended,
            'created_at' => Carbon::now(),
        ]);

        $this->logger->info('Fraud analysis completed', [
            'payment_intent_id' => $result->paymentIntentId,
            'risk_level' => $result->riskLevel,
            'risk_score' => $result->riskScore,
            'indicators' => $result->indicators,
        ]);
    }
}

class FraudAnalysisResult
{
    public function __construct(
        public readonly string $paymentIntentId,
        public readonly int $riskScore,
        public readonly string $riskLevel,
        public readonly array $indicators,
        public readonly string $actionRecommended
    ) {}

    public function toArray(): array
    {
        return [
            'payment_intent_id' => $this->paymentIntentId,
            'risk_score' => $this->riskScore,
            'risk_level' => $this->riskLevel,
            'indicators' => $this->indicators,
            'action_recommended' => $this->actionRecommended,
        ];
    }
}