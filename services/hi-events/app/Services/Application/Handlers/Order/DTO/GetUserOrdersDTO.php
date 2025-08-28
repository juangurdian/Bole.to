<?php

declare(strict_types=1);

namespace HiEvents\Services\Application\Handlers\Order\DTO;

use HiEvents\DataTransferObjects\BaseDTO;
use HiEvents\Http\DTO\QueryParamsDTO;

readonly class GetUserOrdersDTO extends BaseDTO
{
    public function __construct(
        public int $userId,
        public ?string $status = 'all', // upcoming, past, all
        public QueryParamsDTO $queryParams = new QueryParamsDTO(),
    ) {
    }
}