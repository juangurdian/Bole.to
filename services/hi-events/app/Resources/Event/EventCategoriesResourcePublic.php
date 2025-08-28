<?php

declare(strict_types=1);

namespace HiEvents\Resources\Event;

use HiEvents\DomainObjects\Enums\EventCategory;
use HiEvents\Resources\BaseResource;
use Illuminate\Http\Request;

class EventCategoriesResourcePublic extends BaseResource
{
    public function toArray(Request $request): array
    {
        $categories = [];

        foreach (EventCategory::cases() as $category) {
            $categories[] = [
                'value' => $category->value,
                'label' => $category->label(),
                'emoji' => $category->emoji(),
            ];
        }

        return [
            'data' => $categories
        ];
    }
}