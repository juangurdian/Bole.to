// Event types
export interface Event {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  organizer_id: number;
  short_id: string;
}

// User types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  email_verified_at?: string;
}

// Order types
export interface Order {
  id: number;
  short_id: string;
  event_id: number;
  status: 'RESERVED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  payment_status: 'AWAITING_PAYMENT' | 'PAYMENT_RECEIVED' | 'REFUNDED';
  total_gross: number;
  currency: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

// Product/Ticket types
export interface Product {
  id: number;
  title: string;
  type: 'TICKET' | 'MERCHANDISE' | 'DONATION';
  event_id: number;
  sale_start_date?: string;
  sale_end_date?: string;
  description?: string;
  prices: ProductPrice[];
}

export interface ProductPrice {
  id: number;
  price: number;
  label?: string;
  is_default?: boolean;
}

// Attendee types
export interface Attendee {
  id: number;
  public_id: string;
  first_name: string;
  last_name: string;
  email: string;
  order_id: number;
  ticket_id: number;
  checked_in?: boolean;
  checked_in_at?: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: User;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}