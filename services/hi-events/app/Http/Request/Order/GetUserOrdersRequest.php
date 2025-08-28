<?php

declare(strict_types=1);

namespace HiEvents\Http\Request\Order;

use HiEvents\Http\Request\BaseRequest;

class GetUserOrdersRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'status' => 'sometimes|string|in:upcoming,past,all',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:50',
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'The status must be one of: upcoming, past, all.',
            'per_page.max' => 'The maximum number of orders per page is 50.',
        ];
    }
}