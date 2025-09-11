<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Auth\Mobile;

use HiEvents\Exceptions\UnauthorizedException;
use HiEvents\Http\Actions\BaseAction;
use HiEvents\Http\Request\Auth\LoginRequest;
use HiEvents\Http\ResponseCodes;
use HiEvents\Resources\Auth\MobileAuthResponseResource;
use HiEvents\Services\Application\Handlers\Auth\DTO\AuthenticatedResponseDTO;
use HiEvents\Services\Application\Handlers\Auth\DTO\LoginCredentialsDTO;
use HiEvents\Services\Application\Handlers\Auth\LoginHandler;
use Illuminate\Http\JsonResponse;

/**
 * Mobile Login Action
 * 
 * Provides mobile-optimized login with:
 * - Standardized mobile response format
 * - Authorization header token distribution
 * - Mobile-friendly error responses
 * - Current account context for immediate use
 */
class MobileLoginAction extends BaseAction
{
    private LoginHandler $loginHandler;

    public function __construct(LoginHandler $loginHandler)
    {
        $this->loginHandler = $loginHandler;
    }

    /**
     * Handle mobile login request
     */
    public function __invoke(LoginRequest $request): JsonResponse
    {
        try {
            $loginResponse = $this->loginHandler->handle(new LoginCredentialsDTO(
                email: strtolower($request->validated('email')),
                password: $request->validated('password'),
                accountId: (int)$request->validated('account_id'),
            ));
        } catch (UnauthorizedException $e) {
            return $this->mobileErrorResponse(
                'AUTH_INVALID_CREDENTIALS',
                'Invalid email or password',
                ResponseCodes::HTTP_UNAUTHORIZED
            );
        }

        return $this->mobileSuccessResponse($loginResponse, $request);
    }

    /**
     * Create mobile-optimized success response
     */
    private function mobileSuccessResponse($loginResponse, LoginRequest $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser();
        
        $responseDTO = new AuthenticatedResponseDTO(
            token: $loginResponse->token,
            expiresIn: auth()->factory()->getTTL() * 60,
            accounts: $loginResponse->accounts,
            user: $user,
        );

        $response = $this->jsonResponse(new MobileAuthResponseResource($responseDTO));

        // Add Authorization header for mobile clients (primary method)
        $response->header('Authorization', 'Bearer ' . $loginResponse->token);
        
        // Add X-Auth-Token header for compatibility
        $response->header('X-Auth-Token', $loginResponse->token);

        return $response;
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