<?php

declare(strict_types=1);

namespace HiEvents\Http\Request\Events;

use HiEvents\DomainObjects\Enums\EventCategory;
use HiEvents\Http\Request\BaseRequest;

class GetPublicEventsDiscoveryRequest extends BaseRequest
{
    public function rules(): array
    {
        $allowedCategories = array_map(fn($case) => $case->value, EventCategory::cases());
        $allowedSorts = ['recommended', 'date', 'price', 'popularity'];

        return [
            'search' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:100',
            'category' => 'sometimes|string|in:' . implode(',', $allowedCategories),
            'date_from' => 'sometimes|date_format:Y-m-d',
            'date_to' => 'sometimes|date_format:Y-m-d|after_or_equal:date_from',
            'sort' => 'sometimes|string|in:' . implode(',', $allowedSorts),
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:50',
        ];
    }

    public function messages(): array
    {
        return [
            'category.in' => 'The selected category is invalid.',
            'sort.in' => 'The selected sort option is invalid.',
            'date_from.date_format' => 'The date from must be in YYYY-MM-DD format.',
            'date_to.date_format' => 'The date to must be in YYYY-MM-DD format.',
            'date_to.after_or_equal' => 'The date to must be equal or after the date from.',
            'per_page.max' => 'The maximum number of events per page is 50.',
        ];
    }
}