<?php

declare(strict_types=1);

namespace HiEvents\Http\Middleware;

use Closure;
use HiEvents\Http\ResponseCodes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Mobile Authentication Middleware
 * 
 * Provides mobile-optimized authentication with:
 * - Priority for Authorization header over cookies
 * - Standardized error response format for mobile apps
 * - Mobile-specific rate limiting
 * - Graceful error handling for network delays
 */
class MobileAuthMiddleware
{
    /**
     * Handle an incoming request for mobile authentication
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Apply mobile-specific rate limiting
        if ($this->shouldRateLimit($request)) {
            return $this->mobileErrorResponse(
                'RATE_LIMIT_EXCEEDED',
                'Too many requests. Please try again later.',
                ResponseCodes::HTTP_TOO_MANY_REQUESTS
            );
        }

        try {
            // Prioritize Authorization header for mobile clients
            $token = $this->extractTokenForMobile($request);
            
            if (!$token) {
                return $this->mobileErrorResponse(
                    'AUTH_TOKEN_MISSING',
                    'Authentication token is required',
                    ResponseCodes::HTTP_UNAUTHORIZED
                );
            }

            // Set the token for JWT processing
            JWTAuth::setToken($token);
            
            // Authenticate the user
            $user = JWTAuth::authenticate();
            
            if (!$user) {
                return $this->mobileErrorResponse(
                    'AUTH_INVALID_TOKEN',
                    'Invalid authentication token',
                    ResponseCodes::HTTP_UNAUTHORIZED
                );
            }

            // Set the authenticated user
            Auth::setUser($user);

        } catch (TokenExpiredException $e) {
            return $this->mobileErrorResponse(
                'AUTH_TOKEN_EXPIRED',
                'Authentication token has expired',
                ResponseCodes::HTTP_UNAUTHORIZED,
                ['expired_at' => $e->getMessage()]
            );
            
        } catch (TokenInvalidException $e) {
            return $this->mobileErrorResponse(
                'AUTH_TOKEN_INVALID',
                'Authentication token is invalid',
                ResponseCodes::HTTP_UNAUTHORIZED
            );
            
        } catch (JWTException $e) {
            return $this->mobileErrorResponse(
                'AUTH_TOKEN_ERROR',
                'Token processing error',
                ResponseCodes::HTTP_UNAUTHORIZED
            );
        }

        return $next($request);
    }

    /**
     * Extract token prioritizing Authorization header for mobile clients
     */
    private function extractTokenForMobile(Request $request): ?string
    {
        // 1. Check Authorization header (preferred for mobile)
        $authHeader = $request->header('Authorization');
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            return substr($authHeader, 7);
        }

        // 2. Check X-Auth-Token header (fallback)
        $xAuthToken = $request->header('X-Auth-Token');
        if ($xAuthToken) {
            return $xAuthToken;
        }

        // 3. Check cookie (last resort for mobile)
        return $request->cookie('token');
    }

    /**
     * Check if request should be rate limited for mobile endpoints
     */
    private function shouldRateLimit(Request $request): bool
    {
        $key = 'mobile_auth_' . $request->ip();
        $maxAttempts = 10; // More lenient for mobile due to network conditions
        $decayMinutes = 5;

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            return true;
        }

        RateLimiter::hit($key, $decayMinutes * 60);
        return false;
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
        return response()->json([
            'success' => false,
            'error' => [
                'code' => $errorCode,
                'message' => $message,
                'details' => $details,
            ],
        ], $statusCode);
    }
}