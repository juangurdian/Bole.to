<?php

declare(strict_types=1);

namespace HiEvents\Resources\Event;

use HiEvents\DomainObjects\EventDomainObject;
use HiEvents\Resources\BaseResource;
use HiEvents\Resources\Image\ImageResource;
use Illuminate\Http\Request;

/**
 * @mixin EventDomainObject
 */
class EventDiscoveryResourcePublic extends BaseResource
{
    public function toArray(Request $request): array
    {
        // Calculate price range from products
        $priceRange = $this->calculatePriceRange();
        
        // Calculate availability from products
        $availability = $this->calculateAvailability();

        return [
            'id' => $this->getId(),
            'title' => $this->getTitle(),
            'description_preview' => $this->getDescriptionPreview(),
            'start_date' => $this->getStartDate()?->toISOString(),
            'end_date' => $this->getEndDate()?->toISOString(),
            'currency' => $this->getCurrency(),
            'slug' => $this->getSlug(),
            'location_details' => $this->getLocationDetails(),
            'images' => ImageResource::collection($this->getImages() ?? []),
            'organizer' => $this->when($this->getOrganizer(), [
                'id' => $this->getOrganizer()?->getId(),
                'name' => $this->getOrganizer()?->getName(),
            ]),
            'price_range' => $priceRange,
            'availability' => $availability,
            'category' => $this->getCategory(),
        ];
    }

    private function getDescriptionPreview(): ?string
    {
        $description = $this->getDescription();
        if (!$description) {
            return null;
        }

        // Strip HTML tags and limit to ~100 characters
        $plainText = strip_tags($description);
        if (strlen($plainText) <= 100) {
            return $plainText;
        }

        return substr($plainText, 0, 97) . '...';
    }

    private function calculatePriceRange(): array
    {
        $products = $this->getProducts();
        if (!$products || $products->isEmpty()) {
            return [
                'min' => 0,
                'max' => 0
            ];
        }

        $prices = [];
        foreach ($products as $product) {
            $productPrices = $product->getProductPrices();
            if ($productPrices) {
                foreach ($productPrices as $price) {
                    if ($price->getPrice() && $price->getPrice() > 0) {
                        $prices[] = (float) $price->getPrice();
                    }
                }
            }
        }

        if (empty($prices)) {
            return [
                'min' => 0,
                'max' => 0
            ];
        }

        return [
            'min' => min($prices),
            'max' => max($prices)
        ];
    }

    private function calculateAvailability(): array
    {
        $products = $this->getProducts();
        if (!$products || $products->isEmpty()) {
            return [
                'total_capacity' => 0,
                'available_tickets' => 0
            ];
        }

        $totalCapacity = 0;
        $availableTickets = 0;

        foreach ($products as $product) {
            if ($product->getQuantityAvailable() !== null) {
                $totalCapacity += $product->getQuantityAvailable();
                // For simplicity, assume all are available for public display
                // In a real scenario, you'd calculate based on sold tickets
                $availableTickets += $product->getQuantityAvailable();
            }
        }

        return [
            'total_capacity' => $totalCapacity,
            'available_tickets' => $availableTickets
        ];
    }
}