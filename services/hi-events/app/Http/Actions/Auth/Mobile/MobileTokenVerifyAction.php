<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Auth\Mobile;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Http\ResponseCodes;
use HiEvents\Resources\Account\AccountResource;
use HiEvents\Resources\User\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

/**
 * Mobile Token Verification Action
 * 
 * Provides token introspection for mobile applications:
 * - Validates JWT token without requiring database lookup
 * - Returns token metadata (expiration, validity)
 * - Provides user and account information if token is valid
 * - Mobile-friendly error responses for offline validation
 */
class MobileTokenVerifyAction extends BaseAction
{
    /**
     * Verify and introspect JWT token for mobile clients
     */
    public function __invoke(Request $request): JsonResponse
    {
        try {
            // Extract token from request
            $token = $this->extractToken($request);
            
            if (!$token) {
                return $this->mobileErrorResponse(
                    'AUTH_TOKEN_MISSING',
                    'No authentication token provided',
                    ResponseCodes::HTTP_BAD_REQUEST
                );
            }

            // Set token for JWT processing
            JWTAuth::setToken($token);
            
            // Get token payload without database lookup
            $payload = JWTAuth::getPayload();
            
            // Verify token and get user (this will hit the database)
            $user = JWTAuth::authenticate();
            
            if (!$user) {
                return $this->mobileErrorResponse(
                    'AUTH_USER_NOT_FOUND',
                    'User associated with token not found',
                    ResponseCodes::HTTP_UNAUTHORIZED
                );
            }

            // Get user accounts
            $accounts = $user->accounts ?? collect();

            // Calculate token metadata
            $expirationTimestamp = $payload->get('exp');
            $issuedAtTimestamp = $payload->get('iat');
            $expiresAt = \Carbon\Carbon::createFromTimestamp($expirationTimestamp);
            $issuedAt = \Carbon\Carbon::createFromTimestamp($issuedAtTimestamp);
            $ttlSeconds = $expirationTimestamp - time();

            return $this->jsonResponse([
                'success' => true,
                'data' => [
                    'valid' => true,
                    'token_type' => 'Bearer',
                    'expires_at' => $expiresAt->toISOString(),
                    'issued_at' => $issuedAt->toISOString(),
                    'expires_in' => max(0, $ttlSeconds), // Don't return negative values
                    'user' => new UserResource($user),
                    'accounts' => AccountResource::collection($accounts),
                    'token_metadata' => [
                        'jti' => $payload->get('jti'), // JWT ID
                        'iss' => $payload->get('iss'), // Issuer
                        'sub' => $payload->get('sub'), // Subject (user ID)
                    ],
                ],
            ]);

        } catch (TokenExpiredException $e) {
            return $this->mobileErrorResponse(
                'AUTH_TOKEN_EXPIRED',
                'Authentication token has expired',
                ResponseCodes::HTTP_UNAUTHORIZED,
                [
                    'expired_at' => $e->getMessage(),
                    'action_required' => 'refresh_token',
                ]
            );
            
        } catch (TokenInvalidException $e) {
            return $this->mobileErrorResponse(
                'AUTH_TOKEN_INVALID',
                'Authentication token is invalid or malformed',
                ResponseCodes::HTTP_UNAUTHORIZED,
                ['action_required' => 'login_required']
            );
            
        } catch (JWTException $e) {
            return $this->mobileErrorResponse(
                'AUTH_TOKEN_ERROR',
                'Error processing authentication token',
                ResponseCodes::HTTP_UNAUTHORIZED,
                ['action_required' => 'login_required']
            );
        }
    }

    /**
     * Extract token from various request sources
     */
    private function extractToken(Request $request): ?string
    {
        // 1. Authorization header (preferred for mobile)
        $authHeader = $request->header('Authorization');
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            return substr($authHeader, 7);
        }

        // 2. X-Auth-Token header
        $xAuthToken = $request->header('X-Auth-Token');
        if ($xAuthToken) {
            return $xAuthToken;
        }

        // 3. Query parameter (for debugging/testing only)
        return $request->query('token');
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