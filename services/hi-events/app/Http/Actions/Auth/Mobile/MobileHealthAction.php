<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Auth\Mobile;

use HiEvents\Http\Actions\BaseAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Mobile Health Check Action
 * 
 * Provides health check endpoint for mobile applications:
 * - Backend connectivity validation
 * - Server status and version information
 * - Mobile-specific configuration data
 * - No authentication required for basic connectivity test
 */
class MobileHealthAction extends BaseAction
{
    /**
     * Health check for mobile applications
     */
    public function __invoke(Request $request): JsonResponse
    {
        $timestamp = now();
        
        return $this->jsonResponse([
            'success' => true,
            'data' => [
                'status' => 'healthy',
                'timestamp' => $timestamp->toISOString(),
                'server_time' => $timestamp->format('Y-m-d H:i:s T'),
                'environment' => app()->environment(),
                'version' => config('app.version', '1.0.0'),
                'api' => [
                    'version' => '1.0',
                    'mobile_optimized' => true,
                    'auth_methods' => ['jwt'],
                    'token_type' => 'Bearer',
                ],
                'mobile' => [
                    'features' => [
                        'account_switching' => true,
                        'token_verification' => true,
                        'push_notifications' => false, // Can be configured based on setup
                        'offline_mode' => false, // Can be configured based on setup
                    ],
                    'rate_limits' => [
                        'auth_requests_per_minute' => 10,
                        'api_requests_per_minute' => 100,
                    ],
                    'token_config' => [
                        'default_ttl_hours' => (int) (config('jwt.ttl', 10080) / 60), // Convert minutes to hours
                        'refresh_ttl_hours' => (int) (config('jwt.refresh_ttl', 20160) / 60),
                        'blacklist_enabled' => config('jwt.blacklist_enabled', true),
                        'grace_period_seconds' => config('jwt.blacklist_grace_period', 0),
                    ],
                ],
                'checks' => [
                    'database' => $this->checkDatabase(),
                    'jwt_config' => $this->checkJwtConfig(),
                    'cache' => $this->checkCache(),
                ],
            ],
        ]);
    }

    /**
     * Check database connectivity
     */
    private function checkDatabase(): array
    {
        try {
            \DB::connection()->getPdo();
            return [
                'status' => 'healthy',
                'connection' => \DB::connection()->getDatabaseName(),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Database connection failed',
            ];
        }
    }

    /**
     * Check JWT configuration
     */
    private function checkJwtConfig(): array
    {
        $jwtSecret = config('jwt.secret');
        
        return [
            'status' => $jwtSecret ? 'healthy' : 'error',
            'secret_configured' => !empty($jwtSecret),
            'algorithm' => config('jwt.algo', 'HS256'),
            'ttl_minutes' => config('jwt.ttl', 10080),
        ];
    }

    /**
     * Check cache system
     */
    private function checkCache(): array
    {
        try {
            $testKey = 'mobile_health_check_' . time();
            $testValue = 'test';
            
            cache()->put($testKey, $testValue, 60);
            $retrieved = cache()->get($testKey);
            cache()->forget($testKey);
            
            return [
                'status' => $retrieved === $testValue ? 'healthy' : 'error',
                'driver' => config('cache.default'),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Cache system unavailable',
            ];
        }
    }
}