<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Auth\Mobile;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Http\ResponseCodes;
use HiEvents\Resources\Auth\MobileAuthResponseResource;
use HiEvents\Services\Application\Handlers\Auth\DTO\AuthenticatedResponseDTO;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

/**
 * Mobile Account Switching Action
 * 
 * Provides seamless account switching for mobile applications:
 * - Switch between user accounts without re-authentication
 * - Generate new token with updated account context
 * - Maintain user session while changing account scope
 * - Mobile-friendly error responses
 */
class MobileSwitchAccountAction extends BaseAction
{
    /**
     * Switch to a different account for the authenticated user
     */
    public function __invoke(Request $request): JsonResponse
    {
        try {
            // Validate the request
            $validatedData = $request->validate([
                'account_id' => 'required|integer|min:1',
            ]);

            $accountId = (int) $validatedData['account_id'];
            $user = $this->getAuthenticatedUser();

            if (!$user) {
                return $this->mobileErrorResponse(
                    'AUTH_USER_NOT_AUTHENTICATED',
                    'User must be authenticated to switch accounts',
                    ResponseCodes::HTTP_UNAUTHORIZED
                );
            }

            // Get user's available accounts
            $accounts = $user->accounts ?? collect();
            
            if ($accounts->isEmpty()) {
                return $this->mobileErrorResponse(
                    'AUTH_NO_ACCOUNTS_AVAILABLE',
                    'No accounts available for this user',
                    ResponseCodes::HTTP_FORBIDDEN
                );
            }

            // Verify user has access to the requested account
            $targetAccount = $accounts->firstWhere('id', $accountId);
            
            if (!$targetAccount) {
                return $this->mobileErrorResponse(
                    'AUTH_ACCOUNT_ACCESS_DENIED',
                    'You do not have access to the requested account',
                    ResponseCodes::HTTP_FORBIDDEN,
                    [
                        'requested_account_id' => $accountId,
                        'available_accounts' => $accounts->pluck('id')->toArray(),
                    ]
                );
            }

            // Generate a new token with the account context
            // This maintains the same user but updates the account context
            $newToken = JWTAuth::claims([
                'account_id' => $accountId,
                'account_name' => $targetAccount->name,
                'switched_at' => now()->toISOString(),
            ])->fromUser($user);

            // Invalidate the current token to prevent reuse
            try {
                JWTAuth::invalidate(JWTAuth::getToken());
            } catch (\Exception $e) {
                // Log warning but don't fail the request
                // Token invalidation failure isn't critical for account switching
            }

            // Create response with new token and account context
            $responseDTO = new AuthenticatedResponseDTO(
                token: $newToken,
                expiresIn: auth()->factory()->getTTL() * 60,
                accounts: $accounts,
                user: $user,
            );

            // Store the current account ID in the request for the resource
            $request->merge(['account_id' => $accountId]);

            $response = $this->jsonResponse(new MobileAuthResponseResource($responseDTO));

            // Add headers for mobile clients
            $response->header('Authorization', 'Bearer ' . $newToken);
            $response->header('X-Auth-Token', $newToken);
            $response->header('X-Account-Switched', 'true');
            $response->header('X-Current-Account-ID', (string) $accountId);

            return $response;

        } catch (ValidationException $e) {
            return $this->mobileErrorResponse(
                'VALIDATION_ERROR',
                'Invalid request data',
                ResponseCodes::HTTP_BAD_REQUEST,
                ['validation_errors' => $e->errors()]
            );

        } catch (\Exception $e) {
            return $this->mobileErrorResponse(
                'ACCOUNT_SWITCH_ERROR',
                'Failed to switch account',
                ResponseCodes::HTTP_INTERNAL_SERVER_ERROR,
                ['error_type' => get_class($e)]
            );
        }
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