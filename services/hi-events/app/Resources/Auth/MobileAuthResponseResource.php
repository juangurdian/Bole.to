<?php

declare(strict_types=1);

namespace HiEvents\Resources\Auth;

use HiEvents\Resources\Account\AccountResource;
use HiEvents\Resources\User\UserResource;
use HiEvents\Services\Application\Handlers\Auth\DTO\AuthenticatedResponseDTO;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/**
 * Mobile-optimized authentication response resource
 * 
 * Provides standardized response format for mobile applications with:
 * - Clear success/error indication
 * - ISO8601 timestamps for better mobile parsing
 * - Current account information for immediate context
 * - All necessary token information for mobile storage
 * 
 * @mixin AuthenticatedResponseDTO
 */
class MobileAuthResponseResource extends JsonResource
{
    public function toArray($request): array
    {
        $expiresAt = now()->addSeconds($this->expiresIn);
        $currentAccount = $this->getCurrentAccount();

        return [
            'success' => true,
            'data' => [
                'access_token' => $this->token,
                'token_type' => 'Bearer',
                'expires_in' => $this->expiresIn,
                'expires_at' => $expiresAt->toISOString(),
                'user' => new UserResource($this->user),
                'accounts' => AccountResource::collection($this->accounts),
                'current_account' => $currentAccount ? new AccountResource($currentAccount) : null,
            ],
        ];
    }

    /**
     * Get the current account from the request or first available account
     */
    private function getCurrentAccount()
    {
        $accountId = request()->get('account_id');
        
        if ($accountId && $this->accounts) {
            $currentAccount = $this->accounts->firstWhere('id', $accountId);
            if ($currentAccount) {
                return $currentAccount;
            }
        }

        // Return first account if no specific account requested or found
        return $this->accounts?->first();
    }
}