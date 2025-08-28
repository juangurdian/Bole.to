<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Events;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Http\Request\Events\GetPublicEventsDiscoveryRequest;
use HiEvents\Resources\Event\EventDiscoveryResourcePublic;
use HiEvents\Services\Application\Handlers\Event\DTO\GetPublicEventsDiscoveryDTO;
use HiEvents\Services\Application\Handlers\Event\GetPublicEventsDiscoveryHandler;
use Illuminate\Http\JsonResponse;

class GetPublicEventsDiscoveryAction extends BaseAction
{
    public function __construct(
        private readonly GetPublicEventsDiscoveryHandler $handler,
    ) {
    }

    public function __invoke(GetPublicEventsDiscoveryRequest $request): JsonResponse
    {
        $dto = GetPublicEventsDiscoveryDTO::fromArray([
            'search' => $request->input('search'),
            'city' => $request->input('city'),
            'category' => $request->input('category'),
            'dateFrom' => $request->input('date_from'),
            'dateTo' => $request->input('date_to'),
            'sort' => $request->input('sort', 'recommended'),
            'queryParams' => $this->getPaginationQueryParams($request),
        ]);

        $events = $this->handler->handle($dto);

        return $this->resourceResponse(
            EventDiscoveryResourcePublic::class,
            $events
        );
    }
}