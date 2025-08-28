<?php

declare(strict_types=1);

namespace HiEvents\Services\Application\Handlers\Event\DTO;

use HiEvents\DataTransferObjects\BaseDTO;
use HiEvents\Http\DTO\QueryParamsDTO;

readonly class GetPublicEventsDiscoveryDTO extends BaseDTO
{
    public function __construct(
        public ?string $search = null,
        public ?string $city = null,
        public ?string $category = null,
        public ?string $dateFrom = null,
        public ?string $dateTo = null,
        public ?string $sort = 'recommended',
        public QueryParamsDTO $queryParams = new QueryParamsDTO(),
    ) {
    }
}