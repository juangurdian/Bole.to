<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Events;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Resources\Event\EventCategoriesResourcePublic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GetEventCategoriesPublicAction extends BaseAction
{
    public function __invoke(Request $request): JsonResponse
    {
        // Since this is just returning static enum data, we don't need a handler
        return $this->jsonResponse((new EventCategoriesResourcePublic(null))->toArray($request));
    }
}