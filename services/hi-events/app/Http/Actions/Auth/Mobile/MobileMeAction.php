<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Auth\Mobile;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Http\ResponseCodes;
use HiEvents\Resources\Account\AccountResource;
use HiEvents\Resources\User\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

/**
 * Mobile Me Action
 * 
 * Provides mobile-optimized user profile information:
 * - Current user details
 * - Available accounts
 * - Current account context from JWT token
 * - Session metadata for mobile apps
 */
class MobileMeAction extends BaseAction
{
    /**
     * Get current user profile for mobile applications
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser();

        if (!$user) {
            return $this->mobileErrorResponse(
                'AUTH_USER_NOT_FOUND',
                'Authenticated user not found',
                ResponseCodes::HTTP_UNAUTHORIZED
            );
        }

        try {
            // Get JWT payload for session metadata
            $payload = JWTAuth::getPayload();
            $accounts = $user->accounts ?? collect();
            
            // Get current account from JWT claims or default to first
            $currentAccountId = $payload->get('account_id');
            $currentAccount = null;
            
            if ($currentAccountId && $accounts->isNotEmpty()) {
                $currentAccount = $accounts->firstWhere('id', $currentAccountId);
            }
            
            // Fallback to first account if none specified or found
            if (!$currentAccount && $accounts->isNotEmpty()) {
                $currentAccount = $accounts->first();
            }

            // Get session metadata
            $sessionMetadata = $this->getSessionMetadata($payload);

            return $this->jsonResponse([
                'success' => true,
                'data' => [
                    'user' => new UserResource($user),
                    'accounts' => AccountResource::collection($accounts),
                    'current_account' => $currentAccount ? new AccountResource($currentAccount) : null,
                    'session' => $sessionMetadata,
                    'capabilities' => [
                        'can_switch_accounts' => $accounts->count() > 1,
                        'can_create_events' => true, // Based on permissions
                        'can_manage_orders' => true, // Based on permissions
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            return $this->mobileErrorResponse(
                'PROFILE_FETCH_ERROR',
                'Failed to fetch user profile',
                ResponseCodes::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Extract session metadata from JWT payload
     */
    private function getSessionMetadata($payload): array
    {
        $expirationTimestamp = $payload->get('exp');
        $issuedAtTimestamp = $payload->get('iat');
        $expiresAt = \Carbon\Carbon::createFromTimestamp($expirationTimestamp);
        $issuedAt = \Carbon\Carbon::createFromTimestamp($issuedAtTimestamp);

        return [
            'token_id' => $payload->get('jti'),
            'issued_at' => $issuedAt->toISOString(),
            'expires_at' => $expiresAt->toISOString(),
            'expires_in' => max(0, $expirationTimestamp - time()),
            'time_until_expiry_human' => $expiresAt->diffForHumans(),
            'account_switched_at' => $payload->get('switched_at'),
            'permissions' => $this->getUserPermissions(),
        ];
    }

    /**
     * Get user permissions for mobile app feature flags
     */
    private function getUserPermissions(): array
    {
        $user = $this->getAuthenticatedUser();
        
        // This would typically check user roles/permissions
        // For now, return basic permissions structure
        return [
            'can_create_events' => true,
            'can_manage_orders' => true,
            'can_view_analytics' => true,
            'can_manage_users' => $user->is_admin ?? false,
            'can_manage_webhooks' => true,
        ];
    }

    /**
     * Create standardized mobile error response
     */
    private function mobileErrorResponse(
        string $errorCode,
        string $message,
        int $statusCode,
        array $details = []
    ): JsonResponse {
        return $this->jsonResponse([
            'success' => false,
            'error' => [
                'code' => $errorCode,
                'message' => $message,
                'details' => $details,
            ],
        ], $statusCode);
    }
}