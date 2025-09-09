<?php
// File: /services/hi-events/app/Services/Domain/Payment/Chargeback/ChargebackHandlingService.php

namespace HiEvents\Services\Domain\Payment\Chargeback;

use HiEvents\Repository\Interfaces\PaymentDisputeRepositoryInterface;
use HiEvents\Repository\Interfaces\OrderRepositoryInterface;
use HiEvents\Services\Domain\Order\OrderNotificationService;
use HiEvents\Services\Domain\Payment\Stripe\StripeDisputeEvidenceService;
use Illuminate\Log\Logger;
use Carbon\Carbon;

class ChargebackHandlingService
{
    private const HIGH_RISK_CHARGEBACK_THRESHOLD = 0.02; // 2% chargeback rate
    private const EVIDENCE_COLLECTION_DEADLINE_DAYS = 7;

    public function __construct(
        private readonly PaymentDisputeRepositoryInterface $disputeRepository,
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly StripeDisputeEvidenceService $evidenceService,
        private readonly OrderNotificationService $notificationService,
        private readonly AlertingService $alerting,
        private readonly Logger $logger
    ) {}

    public function handleChargebackCreated(array $chargebackData): void
    {
        try {
            // 1. Create dispute record
            $dispute = $this->createDisputeRecord($chargebackData);
            
            // 2. Analyze chargeback reason
            $analysis = $this->analyzeChargebackReason($chargebackData);
            
            // 3. Collect evidence automatically
            $evidenceCollected = $this->collectAutomatedEvidence($dispute, $analysis);
            
            // 4. Determine response strategy
            $strategy = $this->determineResponseStrategy($dispute, $analysis);
            
            // 5. Execute response based on strategy
            $this->executeChargebackResponse($dispute, $strategy, $evidenceCollected);
            
            // 6. Monitor chargeback rate
            $this->monitorChargebackRate();
            
            $this->logger->info('Chargeback processed successfully', [
                'dispute_id' => $dispute->getId(),
                'strategy' => $strategy,
                'reason' => $chargebackData['reason']
            ]);
            
        } catch (\Exception $e) {
            $this->logger->error('Failed to handle chargeback', [
                'error' => $e->getMessage(),
                'chargeback_data' => $chargebackData
            ]);
            
            $this->alerting->sendAlert('chargeback_processing_failed', [
                'error' => $e->getMessage(),
                'charge_id' => $chargebackData['charge'] ?? null
            ]);
        }
    }

    private function createDisputeRecord(array $chargebackData): PaymentDisputeDomainObject
    {
        $order = $this->findOrderByChargeId($chargebackData['charge']);
        
        return $this->disputeRepository->create([
            'stripe_dispute_id' => $chargebackData['id'],
            'charge_id' => $chargebackData['charge'],
            'payment_intent_id' => $chargebackData['payment_intent'] ?? null,
            'order_id' => $order?->getId(),
            'amount_cents' => $chargebackData['amount'],
            'currency' => $chargebackData['currency'],
            'reason' => $chargebackData['reason'],
            'status' => $chargebackData['status'],
            'evidence_due_by' => $chargebackData['evidence_details']['due_by'] 
                ? Carbon::createFromTimestamp($chargebackData['evidence_details']['due_by'])
                : Carbon::now()->addDays(self::EVIDENCE_COLLECTION_DEADLINE_DAYS),
            'created_at' => Carbon::now(),
        ]);
    }

    private function analyzeChargebackReason(array $chargebackData): ChargebackAnalysis
    {
        $reason = $chargebackData['reason'];
        $evidenceNeeded = [];
        $recommendedAction = 'contest'; // Default action
        
        switch ($reason) {
            case 'fraudulent':
                $evidenceNeeded = [
                    'receipt', 'shipping_documentation', 'customer_communication',
                    'billing_address', 'customer_signature', 'duplicate_charge_documentation'
                ];
                $recommendedAction = 'contest';
                break;
                
            case 'subscription_canceled':
                $evidenceNeeded = [
                    'cancellation_policy', 'customer_communication', 
                    'service_documentation', 'receipt'
                ];
                $recommendedAction = 'contest';
                break;
                
            case 'product_unacceptable':
                $evidenceNeeded = [
                    'customer_communication', 'refund_policy', 
                    'service_documentation', 'receipt'
                ];
                $recommendedAction = 'analyze'; // Need manual review
                break;
                
            case 'unrecognized':
                $evidenceNeeded = [
                    'receipt', 'billing_address', 'customer_communication',
                    'service_documentation'
                ];
                $recommendedAction = 'contest';
                break;
                
            case 'duplicate':
                $evidenceNeeded = [
                    'duplicate_charge_documentation', 'receipt', 
                    'customer_communication'
                ];
                $recommendedAction = 'contest';
                break;
                
            case 'credit_not_processed':
                $evidenceNeeded = ['refund_policy', 'customer_communication'];
                $recommendedAction = 'accept'; // Usually valid complaint
                break;
                
            default:
                $evidenceNeeded = ['receipt', 'customer_communication'];
                $recommendedAction = 'analyze';
        }
        
        return new ChargebackAnalysis(
            reason: $reason,
            evidenceNeeded: $evidenceNeeded,
            recommendedAction: $recommendedAction,
            riskLevel: $this->calculateChargebackRiskLevel($chargebackData),
            autoContestable: in_array($reason, ['fraudulent', 'unrecognized', 'duplicate'])
        );
    }

    private function collectAutomatedEvidence(
        PaymentDisputeDomainObject $dispute, 
        ChargebackAnalysis $analysis
    ): array {
        $evidence = [];
        $order = null;
        
        if ($dispute->getOrderId()) {
            $order = $this->orderRepository->findById($dispute->getOrderId());
        }
        
        // Collect receipt/invoice
        if (in_array('receipt', $analysis->evidenceNeeded) && $order) {
            $evidence['receipt'] = $this->evidenceService->generateOrderReceipt($order);
        }
        
        // Collect customer communication
        if (in_array('customer_communication', $analysis->evidenceNeeded) && $order) {
            $evidence['customer_communication'] = 
                $this->evidenceService->getCustomerCommunication($order);
        }
        
        // Collect service documentation (event details, tickets, etc.)
        if (in_array('service_documentation', $analysis->evidenceNeeded) && $order) {
            $evidence['service_documentation'] = 
                $this->evidenceService->getServiceDocumentation($order);
        }
        
        // Collect billing address verification
        if (in_array('billing_address', $analysis->evidenceNeeded)) {
            $evidence['billing_address'] = 
                $this->evidenceService->getBillingAddressVerification($dispute);
        }
        
        // Collect shipping documentation (for physical tickets)
        if (in_array('shipping_documentation', $analysis->evidenceNeeded) && $order) {
            $evidence['shipping_documentation'] = 
                $this->evidenceService->getShippingDocumentation($order);
        }
        
        return $evidence;
    }

    private function determineResponseStrategy(
        PaymentDisputeDomainObject $dispute, 
        ChargebackAnalysis $analysis
    ): string {
        // Calculate win probability based on evidence and reason
        $winProbability = $this->calculateWinProbability($dispute, $analysis);
        
        // Consider cost of fighting vs. amount
        $disputeAmount = $dispute->getAmountCents() / 100; // Convert to dollars
        $contestCost = 15; // Average cost to contest a chargeback
        
        if ($winProbability < 0.3) {
            return 'accept'; // Low win probability
        }
        
        if ($disputeAmount < $contestCost * 2) {
            return 'accept'; // Not worth contesting small amounts
        }
        
        if ($analysis->autoContestable && $winProbability > 0.7) {
            return 'auto_contest'; // High confidence auto contest
        }
        
        if ($analysis->recommendedAction === 'accept') {
            return 'accept';
        }
        
        return 'manual_review'; // Needs human review
    }

    private function executeChargebackResponse(
        PaymentDisputeDomainObject $dispute,
        string $strategy,
        array $evidence
    ): void {
        switch ($strategy) {
            case 'auto_contest':
                $this->evidenceService->submitDisputeEvidence(
                    $dispute->getStripeDisputeId(),
                    $evidence
                );
                
                $this->disputeRepository->updateStatus($dispute->getId(), 'under_review');
                
                $this->alerting->sendAlert('chargeback_auto_contested', [
                    'dispute_id' => $dispute->getId(),
                    'amount' => $dispute->getAmountCents()
                ]);
                break;
                
            case 'accept':
                $this->evidenceService->acceptDispute($dispute->getStripeDisputeId());
                $this->disputeRepository->updateStatus($dispute->getId(), 'lost');
                
                $this->alerting->sendAlert('chargeback_accepted', [
                    'dispute_id' => $dispute->getId(),
                    'amount' => $dispute->getAmountCents(),
                    'reason' => $dispute->getReason()
                ]);
                break;
                
            case 'manual_review':
                $this->disputeRepository->updateStatus($dispute->getId(), 'needs_review');
                
                $this->alerting->sendAlert('chargeback_needs_review', [
                    'dispute_id' => $dispute->getId(),
                    'amount' => $dispute->getAmountCents(),
                    'reason' => $dispute->getReason(),
                    'evidence_due_by' => $dispute->getEvidenceDueBy()->toDateString()
                ]);
                break;
        }
    }

    private function calculateWinProbability(
        PaymentDisputeDomainObject $dispute, 
        ChargebackAnalysis $analysis
    ): float {
        $baseProb = 0.5;
        
        // Adjust based on reason
        $reasonMultipliers = [
            'fraudulent' => 0.8,      // High win rate if legitimate
            'unrecognized' => 0.75,   // Good win rate with proper evidence
            'duplicate' => 0.9,       // Very high if truly not duplicate
            'subscription_canceled' => 0.6, // Moderate win rate
            'product_unacceptable' => 0.3,   // Low win rate
            'credit_not_processed' => 0.2,   // Very low win rate
        ];
        
        $baseProb *= $reasonMultipliers[$dispute->getReason()] ?? 0.5;
        
        // Adjust based on evidence availability
        $evidenceScore = count(array_filter($analysis->evidenceNeeded, function($type) use ($dispute) {
            return $this->evidenceService->hasEvidence($dispute, $type);
        })) / count($analysis->evidenceNeeded);
        
        $baseProb *= (0.5 + $evidenceScore * 0.5);
        
        return min(0.95, max(0.05, $baseProb)); // Cap between 5% and 95%
    }

    private function calculateChargebackRiskLevel(array $chargebackData): string
    {
        $amount = $chargebackData['amount'];
        $reason = $chargebackData['reason'];
        
        // High-risk reasons
        if (in_array($reason, ['product_unacceptable', 'credit_not_processed'])) {
            return 'high';
        }
        
        // High-value disputes
        if ($amount > 50000) { // $500+
            return 'high';
        }
        
        if ($amount > 10000) { // $100+
            return 'medium';
        }
        
        return 'low';
    }

    private function monitorChargebackRate(): void
    {
        $thirtyDaysAgo = Carbon::now()->subDays(30);
        
        $totalPayments = $this->getPaymentCount($thirtyDaysAgo);
        $totalChargebacks = $this->getChargebackCount($thirtyDaysAgo);
        
        $chargebackRate = $totalPayments > 0 ? $totalChargebacks / $totalPayments : 0;
        
        if ($chargebackRate > self::HIGH_RISK_CHARGEBACK_THRESHOLD) {
            $this->alerting->sendAlert('high_chargeback_rate', [
                'chargeback_rate' => round($chargebackRate * 100, 2),
                'threshold' => self::HIGH_RISK_CHARGEBACK_THRESHOLD * 100,
                'total_chargebacks' => $totalChargebacks,
                'total_payments' => $totalPayments,
                'period' => '30 days'
            ]);
        }
    }

    private function findOrderByChargeId(string $chargeId): ?OrderDomainObject
    {
        // Implementation would query the stripe_payments table
        // to find the order associated with this charge
        return null; // Placeholder
    }

    private function getPaymentCount(Carbon $since): int
    {
        // Implementation would count successful payments since date
        return 0; // Placeholder
    }

    private function getChargebackCount(Carbon $since): int
    {
        // Implementation would count chargebacks since date
        return 0; // Placeholder
    }
}

class ChargebackAnalysis
{
    public function __construct(
        public readonly string $reason,
        public readonly array $evidenceNeeded,
        public readonly string $recommendedAction,
        public readonly string $riskLevel,
        public readonly bool $autoContestable
    ) {}
}