<?php

declare(strict_types=1);

namespace HiEvents\Services\Application\Handlers\Order;

use Carbon\Carbon;
use HiEvents\DomainObjects\AttendeeDomainObject;
use HiEvents\DomainObjects\EventDomainObject;
use HiEvents\DomainObjects\OrderItemDomainObject;
use HiEvents\DomainObjects\Status\OrderPaymentStatus;
use HiEvents\Repository\Eloquent\Value\Relationship;
use HiEvents\Repository\Interfaces\OrderRepositoryInterface;
use HiEvents\Services\Application\Handlers\Order\DTO\GetUserOrdersDTO;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class GetUserOrdersHandler
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
    ) {
    }

    public function handle(GetUserOrdersDTO $dto): LengthAwarePaginator
    {
        $query = $this->orderRepository
            ->loadRelation(new Relationship(EventDomainObject::class))
            ->loadRelation(new Relationship(OrderItemDomainObject::class))
            ->loadRelation(new Relationship(AttendeeDomainObject::class));

        $where = [
            'user_id' => $dto->userId,
            'payment_status' => OrderPaymentStatus::PAYMENT_RECEIVED->name, // Only show paid orders
        ];

        $whereRaw = [];
        $whereRawBindings = [];

        // Apply status filtering based on event dates
        if ($dto->status === 'upcoming') {
            // Events that haven't ended yet
            $whereRaw[] = 'EXISTS (SELECT 1 FROM events WHERE events.id = orders.event_id AND (events.end_date IS NULL OR events.end_date >= ?))';
            $whereRawBindings[] = Carbon::now()->toDateTimeString();
        } elseif ($dto->status === 'past') {
            // Events that have already ended
            $whereRaw[] = 'EXISTS (SELECT 1 FROM events WHERE events.id = orders.event_id AND events.end_date IS NOT NULL AND events.end_date < ?)';
            $whereRawBindings[] = Carbon::now()->toDateTimeString();
        }
        // For 'all' status, no additional filtering

        return $query->findOrdersWithFilters(
            where: $where,
            whereRaw: $whereRaw,
            whereRawBindings: $whereRawBindings,
            orderBy: ['created_at' => 'desc'],
            params: $dto->queryParams
        );
    }
}