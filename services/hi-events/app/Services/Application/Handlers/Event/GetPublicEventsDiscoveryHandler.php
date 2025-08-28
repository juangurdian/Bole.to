<?php

declare(strict_types=1);

namespace HiEvents\Services\Application\Handlers\Event;

use Carbon\Carbon;
use HiEvents\DomainObjects\EventSettingDomainObject;
use HiEvents\DomainObjects\ImageDomainObject;
use HiEvents\DomainObjects\OrganizerDomainObject;
use HiEvents\DomainObjects\ProductDomainObject;
use HiEvents\DomainObjects\Status\EventStatus;
use HiEvents\Repository\Eloquent\Value\Relationship;
use HiEvents\Repository\Interfaces\EventRepositoryInterface;
use HiEvents\Services\Application\Handlers\Event\DTO\GetPublicEventsDiscoveryDTO;
use Illuminate\Pagination\LengthAwarePaginator;

class GetPublicEventsDiscoveryHandler
{
    public function __construct(
        private readonly EventRepositoryInterface $eventRepository,
    ) {
    }

    public function handle(GetPublicEventsDiscoveryDTO $dto): LengthAwarePaginator
    {
        $query = $this->eventRepository
            ->loadRelation(new Relationship(ImageDomainObject::class))
            ->loadRelation(new Relationship(OrganizerDomainObject::class))
            ->loadRelation(new Relationship(EventSettingDomainObject::class))
            ->loadRelation(new Relationship(ProductDomainObject::class));

        $where = [
            'status' => EventStatus::LIVE->name,
        ];

        // Build search conditions
        $whereRaw = [];
        $whereRawBindings = [];

        // Text search in title and description
        if ($dto->search) {
            $searchTerm = '%' . $dto->search . '%';
            $whereRaw[] = '(LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))';
            $whereRawBindings[] = $searchTerm;
            $whereRawBindings[] = $searchTerm;
        }

        // City filter - search in location_details JSON
        if ($dto->city) {
            $whereRaw[] = 'JSON_EXTRACT(location_details, "$.city") LIKE ?';
            $whereRawBindings[] = '%' . $dto->city . '%';
        }

        // Category filter
        if ($dto->category) {
            $where['category'] = strtoupper($dto->category);
        }

        // Date range filter
        if ($dto->dateFrom) {
            try {
                $fromDate = Carbon::parse($dto->dateFrom)->startOfDay();
                $whereRaw[] = 'start_date >= ?';
                $whereRawBindings[] = $fromDate->toDateTimeString();
            } catch (\Exception $e) {
                // Invalid date format, ignore filter
            }
        }

        if ($dto->dateTo) {
            try {
                $toDate = Carbon::parse($dto->dateTo)->endOfDay();
                $whereRaw[] = 'start_date <= ?';
                $whereRawBindings[] = $toDate->toDateTimeString();
            } catch (\Exception $e) {
                // Invalid date format, ignore filter
            }
        }

        // Apply sorting
        $orderBy = [];
        switch ($dto->sort) {
            case 'date':
                $orderBy = ['start_date' => 'asc'];
                break;
            case 'price':
                // Sort by minimum ticket price (we'll need to handle this in the repository)
                $orderBy = ['title' => 'asc']; // Fallback to title for now
                break;
            case 'popularity':
                // Sort by view count or similar metric
                $orderBy = ['created_at' => 'desc']; // Fallback for now
                break;
            case 'recommended':
            default:
                // Default recommended sorting - could be a mix of factors
                $orderBy = ['start_date' => 'asc'];
                break;
        }

        return $query->findEventsWithFilters(
            where: $where,
            whereRaw: $whereRaw,
            whereRawBindings: $whereRawBindings,
            orderBy: $orderBy,
            params: $dto->queryParams
        );
    }
}