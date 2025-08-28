import { httpClient } from './httpClient';
import {
  Event,
  EventDetail,
  EventFilters,
  Category,
  Order,
  Ticket,
  LoginResponse,
  TokenResponse,
  User,
  Account
} from '../types/models';

export class RealApiService {
  // Authentication
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/api/auth/login', {
      email,
      password
    });
    return response;
  }

  async selectAccount(accountId: string): Promise<TokenResponse> {
    const response = await httpClient.post<TokenResponse>('/api/auth/select-account', {
      account_id: accountId
    });
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return await httpClient.get<User>('/api/users/me');
  }

  // Events
  async getEvents(filters: Partial<EventFilters> = {}): Promise<{ data: Event[], meta: any }> {
    const params = new URLSearchParams();
    
    if (filters.query) params.append('query', filters.query);
    if (filters.category_ids?.length) {
      filters.category_ids.forEach(id => params.append('category_ids[]', id));
    }
    if (filters.city) params.append('city', filters.city);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.price_min !== undefined) params.append('price_min', filters.price_min.toString());
    if (filters.price_max !== undefined) params.append('price_max', filters.price_max.toString());
    if (filters.is_free !== undefined) params.append('is_free', filters.is_free.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());

    const queryString = params.toString();
    const url = `/api/public/events${queryString ? `?${queryString}` : ''}`;
    
    return await httpClient.getPaginated<Event>(url);
  }

  async getEvent(eventId: string): Promise<EventDetail> {
    return await httpClient.get<EventDetail>(`/api/public/events/${eventId}`);
  }

  async getCategories(): Promise<Category[]> {
    return await httpClient.get<Category[]>('/api/public/categories');
  }

  // Orders & Tickets
  async getUserOrders(): Promise<Order[]> {
    return await httpClient.get<Order[]>('/api/users/me/orders');
  }

  async getUserTickets(): Promise<Ticket[]> {
    const orders = await this.getUserOrders();
    // Extract all tickets from all orders
    const tickets: Ticket[] = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        // Note: The real API might structure this differently
        // This is a placeholder - you may need to adjust based on actual API response
        tickets.push({
          id: `ticket_${item.id}`,
          uuid: `uuid_${item.id}`,
          order_id: order.id,
          event_id: order.event_id,
          product_id: item.product_id,
          product_title: item.product_title,
          qr_code: `qr_${item.id}`, // This would come from the API
          status: 'ACTIVE',
          created_at: order.created_at,
          event: order.event,
        } as Ticket);
      });
    });
    return tickets;
  }

  async getOrder(orderId: string): Promise<Order> {
    return await httpClient.get<Order>(`/api/users/me/orders/${orderId}`);
  }

  // Order creation and checkout
  async createOrder(eventId: string, items: { product_id: string, quantity: number }[]): Promise<Order & { client_secret?: string }> {
    const response = await httpClient.post<Order & { client_secret?: string }>(`/api/public/events/${eventId}/order`, {
      items
    });
    return response;
  }

  async confirmOrder(orderId: string, paymentIntentId?: string): Promise<Order> {
    return await httpClient.post<Order>(`/api/orders/${orderId}/confirm`, {
      payment_intent_id: paymentIntentId
    });
  }

  // Stripe Payment Intent methods
  async createPaymentIntent(eventId: string, orderShortId: string): Promise<{client_secret: string, id: string, amount: number, currency: string}> {
    const response = await httpClient.post<{client_secret: string, id: string, amount: number, currency: string}>(
      `/api/public/events/${eventId}/order/${orderShortId}/stripe/payment_intent`
    );
    return response;
  }

  async getPaymentIntent(eventId: string, orderShortId: string): Promise<{client_secret: string, id: string, status: string, amount: number, currency: string}> {
    return await httpClient.get<{client_secret: string, id: string, status: string, amount: number, currency: string}>(
      `/api/public/events/${eventId}/order/${orderShortId}/stripe/payment_intent`
    );
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    return await httpClient.healthCheck();
  }

  // Legacy compatibility methods for existing screens
  // These adapt the new API responses to match what the existing UI expects

  async listEvents(): Promise<any[]> {
    const result = await this.getEvents({ per_page: 50 });
    return result.data.map(event => this.adaptEventForLegacyUI(event));
  }

  async getEventLegacy(id: string): Promise<any> {
    const event = await this.getEvent(id);
    return this.adaptEventDetailForLegacyUI(event);
  }

  async listMyTickets(): Promise<any[]> {
    const tickets = await this.getUserTickets();
    return tickets.map(ticket => this.adaptTicketForLegacyUI(ticket));
  }

  async getTicket(id: string): Promise<any> {
    const tickets = await this.getUserTickets();
    const ticket = tickets.find(t => t.id === id || t.uuid === id);
    if (!ticket) throw new Error('Ticket not found');
    return this.adaptTicketForLegacyUI(ticket);
  }

  async discover(query: any = {}): Promise<any> {
    const filters: Partial<EventFilters> = {
      query: query.query,
      city: query.city,
      category_ids: query.categories,
      price_min: query.price?.min,
      price_max: query.price?.max,
      is_free: query.price?.max === 0,
      page: query.page || 1,
      per_page: query.pageSize || 12
    };

    // Handle date ranges
    if (query.dateRange === 'tonight') {
      const today = new Date().toISOString().split('T')[0];
      filters.start_date = today;
      filters.end_date = today;
    } else if (query.dateRange === 'weekend') {
      const now = new Date();
      const saturday = new Date(now);
      saturday.setDate(now.getDate() + (6 - now.getDay()));
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      filters.start_date = saturday.toISOString().split('T')[0];
      filters.end_date = sunday.toISOString().split('T')[0];
    }

    const result = await this.getEvents(filters);
    
    // Adapt response to legacy format
    const events = result.data.map(event => this.adaptEventForLegacyUI(event));
    
    // Create sections
    const sections = {
      trending: events.filter((_, index) => index < 6),
      tonight: events.filter(event => {
        const today = new Date().toDateString();
        return new Date(event.startsAt).toDateString() === today;
      }).slice(0, 4),
      weekend: events.slice(0, 4),
      justAnnounced: events.slice(0, 4)
    };

    return {
      sections,
      all: {
        data: events,
        meta: {
          page: result.meta.current_page,
          pageSize: result.meta.per_page,
          hasMore: result.meta.current_page < result.meta.last_page,
          total: result.meta.total
        }
      }
    };
  }

  async listCategories(): Promise<any[]> {
    return await this.getCategories();
  }

  // Legacy adapter methods
  private adaptEventForLegacyUI(event: Event): any {
    return {
      id: event.id,
      title: event.title,
      coverUrl: event.images?.[0]?.url || null,
      startsAt: event.start_date,
      venue: {
        name: event.venue?.name || 'TBD',
        city: event.venue?.city || 'TBD'
      },
      tiers: event.tickets || [],
      priceFrom: event.price_from,
      isFree: event.is_free || false,
      categories: event.categories?.map(cat => cat.name) || []
    };
  }

  private adaptEventDetailForLegacyUI(event: EventDetail): any {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      coverUrl: event.images?.[0]?.url || null,
      startsAt: event.start_date,
      endsAt: event.end_date,
      venue: {
        name: event.venue?.name || 'TBD',
        city: event.venue?.city || 'TBD',
        address: event.venue?.address_line_1 || ''
      },
      tiers: event.tickets.map(ticket => ({
        id: ticket.id,
        name: ticket.title,
        price: {
          amount: ticket.price,
          currency: ticket.currency
        },
        remaining: ticket.quantity_available
      })),
      stats: {
        interestedCount: 0 // This would need to come from a different endpoint
      }
    };
  }

  private adaptTicketForLegacyUI(ticket: Ticket): any {
    return {
      id: ticket.id,
      eventId: ticket.event_id,
      code: ticket.qr_code,
      holderName: ticket.attendee_first_name && ticket.attendee_last_name 
        ? `${ticket.attendee_first_name} ${ticket.attendee_last_name}`
        : 'Ticket Holder',
      tier: {
        id: ticket.product_id,
        name: ticket.product_title,
        price: { amount: 0, currency: 'USD' } // Price info not available in ticket
      },
      status: ticket.status.toLowerCase(),
      orderId: ticket.order_id,
      createdAt: ticket.created_at,
      event: ticket.event ? this.adaptEventForLegacyUI(ticket.event) : undefined
    };
  }
}

export const realApiService = new RealApiService();