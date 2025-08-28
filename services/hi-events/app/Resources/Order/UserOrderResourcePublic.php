<?php

declare(strict_types=1);

namespace HiEvents\Resources\Order;

use HiEvents\DomainObjects\OrderDomainObject;
use HiEvents\Resources\Attendee\AttendeeResourcePublic;
use HiEvents\Resources\BaseResource;
use Illuminate\Http\Request;

/**
 * @mixin OrderDomainObject
 */
class UserOrderResourcePublic extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->getId(),
            'short_id' => $this->getShortId(),
            'public_id' => $this->getPublicId(),
            'total_gross' => $this->getTotalGross(),
            'total_tax' => $this->getTotalTax(),
            'total_fee' => $this->getTotalFee(),
            'currency' => $this->getCurrency(),
            'status' => $this->getStatus(),
            'payment_status' => $this->getPaymentStatus(),
            'created_at' => $this->getCreatedAt()?->toISOString(),
            'event' => $this->when($this->getEvent(), [
                'id' => $this->getEvent()?->getId(),
                'title' => $this->getEvent()?->getTitle(),
                'start_date' => $this->getEvent()?->getStartDate()?->toISOString(),
                'end_date' => $this->getEvent()?->getEndDate()?->toISOString(),
                'location_details' => $this->getEvent()?->getLocationDetails(),
                'slug' => $this->getEvent()?->getSlug(),
            ]),
            'tickets' => AttendeeResourcePublic::collection($this->getAttendees() ?? []),
            'qr_codes' => $this->generateQrCodes(),
        ];
    }

    private function generateQrCodes(): array
    {
        $attendees = $this->getAttendees() ?? collect();
        $qrCodes = [];

        foreach ($attendees as $attendee) {
            $qrCodes[] = [
                'attendee_id' => $attendee->getId(),
                'attendee_short_id' => $attendee->getShortId(),
                'first_name' => $attendee->getFirstName(),
                'last_name' => $attendee->getLastName(),
                // QR code content - this would typically be a JWT or encrypted string
                // For now, we'll use the attendee short ID
                'qr_code_content' => $attendee->getShortId(),
                // You might want to generate a proper QR code URL or data here
                'qr_code_url' => route('api.public.attendees.show', [
                    'event_id' => $this->getEventId(),
                    'attendee_short_id' => $attendee->getShortId()
                ], false),
            ];
        }

        return $qrCodes;
    }
}