<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Orders;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Http\Request\Order\GetUserOrdersRequest;
use HiEvents\Resources\Order\UserOrderResourcePublic;
use HiEvents\Services\Application\Handlers\Order\DTO\GetUserOrdersDTO;
use HiEvents\Services\Application\Handlers\Order\GetUserOrdersHandler;
use Illuminate\Http\JsonResponse;

class GetUserOrdersAction extends BaseAction
{
    public function __construct(
        private readonly GetUserOrdersHandler $handler,
    ) {
    }

    public function __invoke(GetUserOrdersRequest $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser();
        
        $dto = GetUserOrdersDTO::fromArray([
            'userId' => $user->getId(),
            'status' => $request->input('status', 'all'),
            'queryParams' => $this->getPaginationQueryParams($request),
        ]);

        $orders = $this->handler->handle($dto);

        return $this->resourceResponse(
            UserOrderResourcePublic::class,
            $orders
        );
    }
}