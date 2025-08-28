import { z } from "zod";

// Money/Currency
export const Money = z.object({ 
  amount: z.number(), 
  currency: z.string() 
});
export type Money = z.infer<typeof Money>;

// User types for authentication
export const User = z.object({
  id: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});
export type User = z.infer<typeof User>;

export const Account = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
});
export type Account = z.infer<typeof Account>;

export const LoginResponse = z.object({
  user: User,
  accounts: z.array(Account),
  token: z.string().optional(), // Only present if single account
});
export type LoginResponse = z.infer<typeof LoginResponse>;

export const TokenResponse = z.object({
  token: z.string(),
  user: User,
  account: Account,
});
export type TokenResponse = z.infer<typeof TokenResponse>;

// Event Category
export const Category = z.object({
  id: z.string(),
  name: z.string(),
});
export type Category = z.infer<typeof Category>;

// Product/Tier types
export const ProductTier = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  price_including_taxes: z.number().optional(),
  currency: z.string(),
  quantity_available: z.number().nullable(),
  quantity_sold: z.number().optional().default(0),
  description: z.string().optional(),
  is_available: z.boolean().default(true),
});
export type ProductTier = z.infer<typeof ProductTier>;

// Event types
export const EventVenue = z.object({
  name: z.string(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(), 
  city: z.string(),
  state_or_region: z.string().optional(),
  zip_or_postal_code: z.string().optional(),
  country: z.string(),
});
export type EventVenue = z.infer<typeof EventVenue>;

export const Event = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  start_date: z.string(), // ISO date
  end_date: z.string().optional(),
  timezone: z.string(),
  venue: EventVenue.optional(),
  images: z.array(z.object({
    url: z.string(),
    type: z.string().optional(),
  })).optional().default([]),
  status: z.enum(['DRAFT', 'LIVE', 'ARCHIVED']).default('LIVE'),
  categories: z.array(Category).optional().default([]),
  currency: z.string(),
  // For list view
  tickets: z.array(ProductTier).optional().default([]),
  // Computed fields
  price_from: z.number().optional(),
  is_free: z.boolean().optional(),
});
export type Event = z.infer<typeof Event>;

export const EventDetail = Event.extend({
  tickets: z.array(ProductTier), // Required for detail view
  settings: z.object({
    pre_event_access: z.boolean().default(false),
    require_attendance_confirmation: z.boolean().default(false),
  }).optional(),
});
export type EventDetail = z.infer<typeof EventDetail>;

// Order types
export const OrderItem = z.object({
  id: z.string(),
  product_id: z.string(),
  product_title: z.string(),
  price: z.number(),
  quantity: z.number(),
  total: z.number(),
});
export type OrderItem = z.infer<typeof OrderItem>;

export const Order = z.object({
  id: z.string(),
  short_id: z.string(),
  event_id: z.string(),
  total_before_additions: z.number(),
  total_tax: z.number(),
  total_fee: z.number(),
  total_gross: z.number(),
  currency: z.string(),
  status: z.enum(['RESERVED', 'CONFIRMED', 'CANCELLED', 'REFUNDED']),
  payment_status: z.enum(['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED']),
  reserved_until: z.string().optional(),
  created_at: z.string(),
  items: z.array(OrderItem),
  event: Event.optional(),
});
export type Order = z.infer<typeof Order>;

// Ticket types with QR codes
export const Ticket = z.object({
  id: z.string(),
  uuid: z.string(),
  order_id: z.string(),
  event_id: z.string(),
  product_id: z.string(),
  product_title: z.string(),
  attendee_first_name: z.string().optional(),
  attendee_last_name: z.string().optional(),
  attendee_email: z.string().optional(),
  qr_code: z.string(), // QR code data
  status: z.enum(['ACTIVE', 'CHECKED_IN', 'CANCELLED']),
  created_at: z.string(),
  event: Event.optional(),
});
export type Ticket = z.infer<typeof Ticket>;

// Search and filtering
export const EventFilters = z.object({
  query: z.string().optional(),
  category_ids: z.array(z.string()).optional(),
  city: z.string().optional(),
  start_date: z.string().optional(), // ISO date
  end_date: z.string().optional(), // ISO date
  price_min: z.number().optional(),
  price_max: z.number().optional(),
  is_free: z.boolean().optional(),
  page: z.number().default(1),
  per_page: z.number().default(20),
});
export type EventFilters = z.infer<typeof EventFilters>;

// Legacy types for backwards compatibility (used by existing screens)
export const Post = z.object({
  id: z.string(),
  eventId: z.string(),
  content: z.string(),
  authorName: z.string(),
  createdAt: z.string(),
});
export type Post = z.infer<typeof Post>;

export const Poll = z.object({
  id: z.string(),
  eventId: z.string(),
  question: z.string(),
  options: z.array(z.object({ text: z.string(), votes: z.number() })),
  totalVotes: z.number(),
  endsAt: z.string(),
});
export type Poll = z.infer<typeof Poll>;