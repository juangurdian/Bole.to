import eventsFixt from "./fixtures/events.json";
import productsEv1 from "./fixtures/products_event_1.json";
import ordersFixt from "./fixtures/orders.json";
import ticketsFixt from "./fixtures/tickets.json";
import postsEv1 from "./fixtures/posts_event_1.json";
import pollsEv1 from "./fixtures/polls_event_1.json";
import attendeesEv1 from "./fixtures/attendees_event_1.json";
import galleryEv1 from "./fixtures/gallery_event_1.json";
import checkinEv1 from "./fixtures/checkin_list_event_1.json";
import discoverEventsFixt from "./fixtures/discover_events.json";
import categoriesFixt from "./fixtures/categories.json";
import feedMineFixt from "./fixtures/feed_mine.json";
import feedEventEv1Fixt from "./fixtures/feed_event_ev_1.json";
import attendeesEv1Fixt from "./fixtures/attendees_ev_1.json";
import profileFixt from "./fixtures/profile.json";
import profileShowcaseFixt from "./fixtures/profile_showcase.json";
import eventDraftsFixt from "./fixtures/event_drafts.json";
import eventDetailFixt from "./fixtures/event_detail.json";
import { mockToggles, delay } from "./toggles";
import { z } from "zod";
import { Event, ProductTier, Order, Ticket, Post, Poll } from "../types/models";

const Events = z.array(Event);
const Tiers = z.array(ProductTier);
const Orders = z.array(Order);
const Posts = z.array(Post);
const Polls = z.array(Poll);

async function maybeFail() {
  if (mockToggles.offline) throw new Error("Offline");
  if (mockToggles.forceError) throw new Error("Forced error");
}

export const mockApi = {
  async listEvents() {
    await delay(mockToggles.delayMs); 
    await maybeFail();
    return Events.parse(eventsFixt);
  },

  async getEvent(id: string) {
    await delay(mockToggles.delayMs); 
    await maybeFail();
    const e = Events.parse(eventsFixt).find(x => x.id === id);
    if (!e) throw new Error("Not found");
    const tiers = id === "ev_1" ? Tiers.parse(productsEv1) : [];
    return { ...e, tiers };
  },


  async completeOrderMock(orderId: string) {
    await delay(mockToggles.delayMs); 
    await maybeFail();
    const o = Orders.parse(ordersFixt).find(o => o.id === orderId);
    if (!o) throw new Error("Order not found");
    return o;
  },

  async listMyTickets() {
    await delay(mockToggles.delayMs); 
    await maybeFail();
    // Return tickets as-is since they already have the complete structure
    return ticketsFixt;
  },

  async getTicket(id: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    const ticket = ticketsFixt.find(t => t.id === id);
    if (!ticket) throw new Error("Ticket not found");
    
    // Return the ticket as-is since it already has the complete structure
    return ticket;
  },

  async listPosts(eventId: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    return Posts.parse(postsEv1).filter(p => p.eventId === eventId);
  },

  async listPolls(eventId: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    return Polls.parse(pollsEv1).filter(p => p.eventId === eventId);
  },

  async createPost(eventId: string, content: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    const newPost = {
      id: `post_${Date.now()}`,
      eventId,
      content,
      authorName: "Mock User",
      createdAt: new Date().toISOString()
    };
    return Post.parse(newPost);
  },

  async getGallery(eventId: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    return galleryEv1.filter((img: any) => img.eventId === eventId);
  },

  async uploadPhoto(eventId: string, uri: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    const newPhoto = {
      id: `img_${Date.now()}`,
      eventId,
      url: uri,
      takenAt: new Date().toISOString(),
      revealed: false
    };
    return newPhoto;
  },

  // Staff/Scanner mock functions
  async getAttendeesForEvent(eventId: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    return attendeesEv1;
  },

  async checkInAttendee(code: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    const attendee = checkinEv1.find((a: any) => a.code === code);
    if (!attendee) throw new Error("Ticket not found");
    
    if (attendee.checkedIn) {
      return { 
        success: false, 
        message: "Already checked in", 
        checkedInAt: attendee.checkedInAt 
      };
    }
    
    attendee.checkedIn = true;
    attendee.checkedInAt = new Date().toISOString();
    return { 
      success: true, 
      message: "Check-in successful", 
      attendee 
    };
  },

  // Missing API functions
  async getOrder(orderId: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    const orders = Orders.parse(ordersFixt);
    const events = Events.parse(eventsFixt);
    const tiers = Tiers.parse(productsEv1);
    
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");
    
    const event = events.find(e => e.id === order.eventId) || events[0];
    const tickets = ticketsFixt.filter((t: any) => t.eventId === order.eventId).map((t: any) => ({
      ...t,
      tier: tiers[0] || { id: "default", name: "General Admission", price: { amount: 25, currency: "USD" } }
    }));
    
    return {
      ...order,
      event,
      tickets,
      totalAmount: 50,
      currency: "USD",
      createdAt: new Date().toISOString()
    };
  },

  async getEventGallery() {
    await delay(mockToggles.delayMs);
    await maybeFail();
    return galleryEv1 || [];
  },

  async listPosts() {
    await delay(mockToggles.delayMs);
    await maybeFail();
    const posts = Posts.parse(postsEv1);
    const events = Events.parse(eventsFixt);
    
    return posts.map(post => {
      const event = events.find(e => e.id === post.eventId) || events[0];
      return {
        ...post,
        event,
        author: { name: post.authorName },
        likes: Math.floor(Math.random() * 20),
        comments: Math.floor(Math.random() * 10),
        type: post.content.includes('📊') ? 'poll' : 'text',
        pollOptions: post.content.includes('📊') ? [
          { id: 'opt1', text: 'Option A', votes: Math.floor(Math.random() * 15) },
          { id: 'opt2', text: 'Option B', votes: Math.floor(Math.random() * 12) }
        ] : undefined
      };
    });
  },

  async getPost(postId: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    const posts = Posts.parse(postsEv1);
    const events = Events.parse(eventsFixt);
    
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error("Post not found");
    
    const event = events.find(e => e.id === post.eventId) || events[0];
    return {
      ...post,
      event,
      author: { name: post.authorName },
      pollOptions: [
        { id: 'opt1', text: 'Yes, great idea!', votes: 12 },
        { id: 'opt2', text: 'Maybe later', votes: 8 },
        { id: 'opt3', text: 'Not interested', votes: 3 }
      ]
    };
  },

  async createPost(postData: any) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    const events = Events.parse(eventsFixt);
    const event = events.find(e => e.id === postData.eventId) || events[0];
    
    const newPost = {
      id: `post_${Date.now()}`,
      eventId: postData.eventId,
      content: postData.content,
      authorName: "Demo User",
      createdAt: new Date().toISOString(),
      event,
      author: { name: "Demo User" },
      type: postData.type || 'text',
      pollOptions: postData.pollOptions || undefined,
      likes: 0,
      comments: 0
    };
    
    return newPost;
  },

  async votePoll(pollId: string, optionId: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    return { success: true, message: "Vote recorded" };
  },

  async createOrderMock(orderData: any) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    const events = Events.parse(eventsFixt);
    const event = events.find(e => e.id === orderData.eventId) || events[0];
    
    const newOrder = {
      id: `ord_${Date.now()}`,
      eventId: orderData.eventId,
      event,
      items: orderData.items || [],
      totalAmount: 50,
      currency: "USD",
      status: "confirmed",
      createdAt: new Date().toISOString(),
      tickets: orderData.items?.map((item: any, index: number) => ({
        id: `tck_${Date.now()}_${index}`,
        eventId: orderData.eventId,
        code: `TKT${Math.random().toString().slice(2, 8)}`,
        holderName: "Demo User",
        tier: { id: item.tierId, name: "General Admission", price: { amount: 25, currency: "USD" } },
        status: "valid",
        orderId: `ord_${Date.now()}`,
        createdAt: new Date().toISOString()
      }))
    };
    
    return newOrder;
  },

  // Comprehensive Home payload
  async getHomePayload() {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const events = Events.parse(eventsFixt);
    const tickets = ticketsFixt;
    const posts = Posts.parse(postsEv1);
    
    // Mock user data
    const user = {
      id: "user_1",
      city: "Managua",
      roles: ["user"] // could be ["user", "staff", "promoter"]
    };

    // Upcoming events with tickets
    const upcoming = tickets.slice(0, 3).map((ticket: any) => {
      const event = ticket.event; // Use embedded event data
      const now = new Date();
      const eventDate = new Date(event.startsAt);
      const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      return {
        eventId: event.id,
        eventTitle: event.title,
        startsAt: event.startsAt,
        coverUrl: event.coverUrl,
        hasTicket: true,
        venue: event.venue,
        isToday: diffHours > 0 && diffHours < 24,
        isTomorrow: diffHours >= 24 && diffHours < 48,
        hoursUntil: Math.max(0, Math.floor(diffHours))
      };
    });

    // Social digest - mix of announcements, posts, and polls
    const socialDigest = [
      {
        id: "ann_1",
        type: "announcement" as const,
        title: "Doors open at 9PM!",
        description: "Don't forget to bring ID.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
        author: {
          name: "Event Organizer",
          avatar: undefined
        },
        event: {
          name: "Sunset Rooftop Party",
          date: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        id: "post_1",
        type: "post" as const,
        title: "Who's ready for tonight? Can't wait! 🎉",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1h ago
        author: {
          name: "Ana Rodriguez",
          avatar: undefined
        },
        engagement: {
          likes: 12,
          comments: 3,
          shares: 1
        }
      },
      {
        id: "poll_1",
        type: "poll" as const,
        title: "What music are you hoping to hear tonight?",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30m ago
        author: {
          name: "DJ Mix Master",
          avatar: undefined
        }
      }
    ];

    // Discovery lists
    const discover = {
      trending: events.slice(0, 4).map(event => ({
        id: event.id,
        title: event.title,
        coverUrl: event.coverUrl,
        startsAt: event.startsAt,
        venue: event.venue,
        priceFrom: 25,
        isTonight: new Date(event.startsAt).toDateString() === new Date().toDateString(),
        isFree: Math.random() > 0.7,
        isLowStock: Math.random() > 0.8,
        category: ["Music", "Party", "Rooftop", "Social"][Math.floor(Math.random() * 4)]
      })),
      tonight: events.filter(e => new Date(e.startsAt).toDateString() === new Date().toDateString()).slice(0, 3).map(event => ({
        id: event.id,
        title: event.title,
        coverUrl: event.coverUrl,
        startsAt: event.startsAt,
        venue: event.venue,
        priceFrom: 20,
        isTonight: true,
        category: ["Music", "Nightlife"][Math.floor(Math.random() * 2)]
      })),
      justAnnounced: events.slice(2, 5).map(event => ({
        id: event.id,
        title: event.title,
        coverUrl: event.coverUrl,
        startsAt: event.startsAt,
        venue: event.venue,
        priceFrom: 30,
        isNew: true,
        category: ["Music", "Party", "Culture"][Math.floor(Math.random() * 3)]
      }))
    };

    // Gallery teasers (D+1 locked galleries)
    const galleries = [
      {
        eventId: "ev_1",
        eventTitle: "Sunset Rooftop Party",
        revealAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12h from now
        previewUrls: ["img1_blur.jpg", "img2_blur.jpg", "img3_blur.jpg", "img4_blur.jpg"],
        photoCount: 24
      }
    ];

    // Resume/Continue checkout
    const resume = Math.random() > 0.7 ? {
      orderId: "ord_pending_123",
      eventId: "ev_2",
      eventTitle: "Weekend Music Festival",
      expiresAt: new Date(Date.now() + 13 * 60 * 1000).toISOString(), // 13m left
      itemsCount: 2,
      total: 50
    } : null;

    // Promoter tools (role-gated)
    const promoterStats = user.roles.includes("promoter") ? {
      linkShares: 45,
      conversions: 8,
      revenue: 400
    } : null;

    // Events Near You - from discover events
    const nearby = discoverEventsFixt.slice(0, 10).map(event => ({
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      venue: event.venue,
      coverUrl: event.coverUrl,
      tiers: event.tiers
    }));

    // Released Photos - galleries that have been unlocked
    const releasedGalleries = [
      {
        eventId: "ev_1",
        eventTitle: "Indie Night Rooftop",
        thumbUrls: [
          "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400", 
          "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400",
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=400"
        ],
        releasedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3h ago
      },
      {
        eventId: "ev_2", 
        eventTitle: "EDM Summer Fest",
        thumbUrls: [
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
          "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=400",
          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400"
        ],
        releasedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8h ago
      }
    ];

    return {
      city: user.city,
      notifications: { unread: Math.floor(Math.random() * 5) },
      user,
      upcoming,
      socialDigest,
      discover,
      galleries,
      nearby,
      releasedGalleries,
      resume,
      promoterStats,
      unreadNotifications: Math.floor(Math.random() * 5)
    };
  },

  // Discover API
  async discover(query: any = {}) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const {
      city = "Managua",
      dateRange = "all",
      categories = [],
      price,
      sort = "recommended",
      page = 1,
      pageSize = 12
    } = query;

    let events = [...discoverEventsFixt];
    
    // Apply filters
    if (dateRange === "tonight") {
      const today = new Date().toDateString();
      events = events.filter(event => 
        new Date(event.startsAt).toDateString() === today
      );
    } else if (dateRange === "weekend") {
      const now = new Date();
      const weekendStart = new Date(now);
      weekendStart.setDate(now.getDate() + (6 - now.getDay())); // Next Saturday
      const weekendEnd = new Date(weekendStart);
      weekendEnd.setDate(weekendStart.getDate() + 1); // Sunday
      
      events = events.filter(event => {
        const eventDate = new Date(event.startsAt);
        return eventDate >= weekendStart && eventDate <= weekendEnd;
      });
    }
    
    if (categories.length > 0) {
      events = events.filter(event => 
        event.categories?.some(cat => categories.includes(cat))
      );
    }
    
    if (price) {
      if (price.max === 0) {
        // Free events only
        events = events.filter(event => event.isFree);
      } else {
        events = events.filter(event => {
          if (event.isFree) return price.min === 0;
          const eventPrice = event.priceFrom || 0;
          return (!price.min || eventPrice >= price.min) && 
                 (!price.max || eventPrice <= price.max);
        });
      }
    }
    
    // Apply sorting
    switch (sort) {
      case "soonest":
        events.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
        break;
      case "price_low":
        events.sort((a, b) => {
          const priceA = a.isFree ? 0 : (a.priceFrom || 999);
          const priceB = b.isFree ? 0 : (b.priceFrom || 999);
          return priceA - priceB;
        });
        break;
      case "popular":
        events.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case "new":
        events.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case "recommended":
      default:
        events.sort((a, b) => (b.score || 0) - (a.score || 0));
        break;
    }
    
    // Create sections (before pagination)
    const now = new Date();
    const today = now.toDateString();
    const weekendStart = new Date(now);
    weekendStart.setDate(now.getDate() + (6 - now.getDay()));
    const weekendEnd = new Date(weekendStart);
    weekendEnd.setDate(weekendStart.getDate() + 1);
    
    const sections = {
      trending: events
        .filter(e => (e.score || 0) >= 85)
        .slice(0, 6),
      tonight: events
        .filter(e => new Date(e.startsAt).toDateString() === today)
        .slice(0, 4),
      weekend: events
        .filter(e => {
          const eventDate = new Date(e.startsAt);
          return eventDate >= weekendStart && eventDate <= weekendEnd;
        })
        .slice(0, 4),
      justAnnounced: events
        .filter(e => e.badges?.includes("NEW"))
        .slice(0, 4)
    };
    
    // Pagination for "all" events
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedEvents = events.slice(startIndex, endIndex);
    const hasMore = endIndex < events.length;
    
    return {
      sections,
      all: {
        data: paginatedEvents,
        meta: {
          page,
          pageSize,
          hasMore,
          total: events.length
        }
      }
    };
  },

  async searchSuggestions(q: string) {
    await delay(mockToggles.delayMs / 2);
    await maybeFail();
    
    const suggestions = [
      "music", "concert", "party", "sports", "football", 
      "comedy", "art", "food", "dance", "theater"
    ].filter(term => term.toLowerCase().includes(q.toLowerCase()));
    
    return suggestions.slice(0, 5);
  },

  async listCategories() {
    await delay(mockToggles.delayMs);
    await maybeFail();
    return categoriesFixt;
  },

  // Feed API functions
  async feed(query: any = {}) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const {
      scope = "mine",
      city = "Managua",
      after,
      pageSize = 10
    } = query;

    let feedItems = [...feedMineFixt];
    
    // Apply scope filtering
    switch (scope) {
      case "mine":
        // For "mine", return items from events user has tickets for
        const userEvents = ticketsFixt.map(t => t.eventId);
        feedItems = feedItems.filter(item => userEvents.includes(item.eventId));
        break;
      case "following":
        // Mock: filter for events user is following (simplified as events with tickets)
        feedItems = feedItems.filter(item => ticketsFixt.some(t => t.eventId === item.eventId));
        break;
      case "nearby":
        // Mock: filter by city (all items are in same city for simplicity)
        break;
      case "all":
      default:
        // Return all feed items
        break;
    }

    // Apply ranking algorithm
    const now = new Date().getTime();
    feedItems = feedItems.map(item => {
      const itemTime = new Date(item.createdAt).getTime();
      const hoursAgo = (now - itemTime) / (1000 * 60 * 60);
      
      // Recency weight (linear decay over 48h)
      let recencyWeight = Math.max(0, 1 - hoursAgo / 48);
      
      // Proximity weight (events within 7 days get boost)
      let proximityWeight = 0;
      if (item.eventId && ticketsFixt.some(t => t.eventId === item.eventId)) {
        const ticket = ticketsFixt.find(t => t.eventId === item.eventId);
        if (ticket) {
          const eventTime = new Date(ticket.event.startsAt).getTime();
          const daysFromEvent = Math.abs(now - eventTime) / (1000 * 60 * 60 * 24);
          if (daysFromEvent <= 7) {
            proximityWeight = daysFromEvent <= 1 ? 0.5 : 0.3; // Today > Tomorrow > This week
          }
        }
      }
      
      // Organizer bonus (announcements pinned for 4 hours)
      let organizerBonus = 0;
      if (item.type === "announcement" && hoursAgo <= 4) {
        organizerBonus = 0.4;
      }
      
      // Engagement weight
      let engagementWeight = 0;
      if (item.type === "post") {
        engagementWeight = Math.min(0.3, (item.likeCount + item.commentCount) / 100);
      } else if (item.type === "poll") {
        const totalVotes = item.options.reduce((sum, opt) => sum + opt.votes, 0);
        engagementWeight = Math.min(0.3, totalVotes / 200);
      }
      
      const score = recencyWeight + proximityWeight + organizerBonus + engagementWeight;
      
      return { ...item, _score: score };
    });

    // Sort by score
    feedItems.sort((a, b) => b._score - a._score);

    // Handle cursor-based pagination
    let startIndex = 0;
    if (after) {
      const afterIndex = feedItems.findIndex(item => item.id === after);
      startIndex = afterIndex > -1 ? afterIndex + 1 : 0;
    }

    const items = feedItems.slice(startIndex, startIndex + pageSize);
    const nextCursor = items.length === pageSize && startIndex + pageSize < feedItems.length 
      ? items[items.length - 1].id 
      : undefined;

    return {
      items: items.map(item => {
        const { _score, ...cleanItem } = item;
        return cleanItem;
      }),
      nextCursor
    };
  },

  async eventFeed(eventId: string, after?: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    let feedItems = [...feedEventEv1Fixt];
    
    // Filter by eventId (for now we only have event_001 fixture)
    if (eventId !== "event_001") {
      feedItems = [];
    }

    // Handle cursor-based pagination
    let startIndex = 0;
    if (after) {
      const afterIndex = feedItems.findIndex(item => item.id === after);
      startIndex = afterIndex > -1 ? afterIndex + 1 : 0;
    }

    const pageSize = 10;
    const items = feedItems.slice(startIndex, startIndex + pageSize);
    const nextCursor = items.length === pageSize && startIndex + pageSize < feedItems.length 
      ? items[items.length - 1].id 
      : undefined;

    return {
      items,
      nextCursor
    };
  },

  async getAttendees(eventId: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    // For now, return attendees for event_001
    if (eventId === "event_001") {
      return attendeesEv1Fixt;
    }
    
    return [];
  },

  async createPost(eventId: string, text: string, media?: string[]) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const newPost = {
      type: "post",
      id: `post_${Date.now()}`,
      eventId,
      eventName: ticketsFixt.find(t => t.eventId === eventId)?.event.title || "Unknown Event",
      author: {
        id: "current_user",
        name: "You",
        avatarUrl: null
      },
      text,
      mediaUrls: media || null,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
      liked: false
    };
    
    return newPost;
  },

  async votePoll(pollId: string, optionId: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    // Find poll in feed fixtures
    let poll = feedMineFixt.find(item => item.type === "poll" && item.id === pollId);
    if (!poll) {
      poll = feedEventEv1Fixt.find(item => item.type === "poll" && item.id === pollId);
    }
    
    if (!poll || poll.type !== "poll") {
      throw new Error("Poll not found");
    }
    
    // Update vote count optimistically
    const updatedPoll = {
      ...poll,
      options: poll.options.map(opt => 
        opt.id === optionId 
          ? { ...opt, votes: opt.votes + 1 }
          : opt
      ),
      userVoteId: optionId
    };
    
    return updatedPoll;
  },

  async toggleLike(postId: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    // Find post in feed fixtures
    let post = feedMineFixt.find(item => item.type === "post" && item.id === postId);
    if (!post) {
      post = feedEventEv1Fixt.find(item => item.type === "post" && item.id === postId);
    }
    
    if (!post || post.type !== "post") {
      throw new Error("Post not found");
    }
    
    const wasLiked = post.liked || false;
    const newLikeCount = wasLiked ? post.likeCount - 1 : post.likeCount + 1;
    
    return {
      likeCount: Math.max(0, newLikeCount),
      liked: !wasLiked
    };
  },

  async hasTicket(eventId: string) {
    await delay(mockToggles.delayMs / 4);
    await maybeFail();
    
    return ticketsFixt.some(ticket => ticket.eventId === eventId);
  },

  async getEventAttendees(eventId: string, query: any = {}) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const { after, pageSize = 20 } = query;
    
    // Use the attendees fixture for event_001
    let attendees = eventId === "event_001" ? [...attendeesEv1Fixt] : [];
    
    // Add some mock connection status (random for demo)
    attendees = attendees.map(attendee => ({
      ...attendee,
      isConnected: Math.random() > 0.7 // 30% are connections
    }));
    
    // Handle cursor-based pagination
    let startIndex = 0;
    if (after) {
      const afterIndex = attendees.findIndex(attendee => attendee.id === after);
      startIndex = afterIndex > -1 ? afterIndex + 1 : 0;
    }
    
    const items = attendees.slice(startIndex, startIndex + pageSize);
    const nextCursor = items.length === pageSize && startIndex + pageSize < attendees.length 
      ? items[items.length - 1].id 
      : undefined;
    
    return {
      attendees: items,
      totalCount: attendees.length,
      nextCursor
    };
  },

  async getMyProfile() {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    return { ...profileFixt };
  },

  async updateMyProfile(patch: any) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    // In a real app, this would update the backend
    const updatedProfile = { ...profileFixt, ...patch };
    return updatedProfile;
  },

  async getMyShowcase() {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    return { ...profileShowcaseFixt };
  },

  async setPrivacy(patch: any) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const updatedPrivacy = { ...profileFixt.privacy, ...patch };
    return updatedPrivacy;
  },

  async listFollowers(query: any = {}) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const { after, pageSize = 20 } = query;
    
    // Generate mock followers
    const mockFollowers = Array.from({ length: profileFixt.followers }, (_, i) => ({
      id: `follower_${i + 1}`,
      name: `Follower ${i + 1}`,
      handle: `follower${i + 1}`,
      avatarUrl: null,
      isFollowing: Math.random() > 0.6 // 40% mutual follows
    }));
    
    // Handle cursor-based pagination
    let startIndex = 0;
    if (after) {
      const afterIndex = mockFollowers.findIndex(user => user.id === after);
      startIndex = afterIndex > -1 ? afterIndex + 1 : 0;
    }
    
    const items = mockFollowers.slice(startIndex, startIndex + pageSize);
    const nextCursor = items.length === pageSize && startIndex + pageSize < mockFollowers.length 
      ? items[items.length - 1].id 
      : undefined;
    
    return {
      users: items,
      totalCount: mockFollowers.length,
      nextCursor
    };
  },

  async listFollowing(query: any = {}) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const { after, pageSize = 20 } = query;
    
    // Generate mock following
    const mockFollowing = Array.from({ length: profileFixt.following }, (_, i) => ({
      id: `following_${i + 1}`,
      name: `Following ${i + 1}`,
      handle: `following${i + 1}`,
      avatarUrl: null,
      isFollowing: true
    }));
    
    // Handle cursor-based pagination
    let startIndex = 0;
    if (after) {
      const afterIndex = mockFollowing.findIndex(user => user.id === after);
      startIndex = afterIndex > -1 ? afterIndex + 1 : 0;
    }
    
    const items = mockFollowing.slice(startIndex, startIndex + pageSize);
    const nextCursor = items.length === pageSize && startIndex + pageSize < mockFollowing.length 
      ? items[items.length - 1].id 
      : undefined;
    
    return {
      users: items,
      totalCount: mockFollowing.length,
      nextCursor
    };
  },

  async toggleEventVisibility(eventId: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    // Mock toggling event visibility in profile
    const event = profileShowcaseFixt.pastEvents.find(e => e.id === eventId);
    if (event) {
      return { 
        eventId, 
        isHidden: !event.isHiddenFromProfile 
      };
    }
    throw new Error("Event not found");
  },

  async getMyPhotos(query: any = {}) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const { filter = "all", after, pageSize = 20 } = query;
    
    let photos = [...profileShowcaseFixt.recentPhotos];
    
    // Apply filter
    if (filter === "revealed") {
      photos = photos.filter(photo => photo.isRevealed);
    }
    
    // Handle cursor-based pagination
    let startIndex = 0;
    if (after) {
      const afterIndex = photos.findIndex(photo => photo.id === after);
      startIndex = afterIndex > -1 ? afterIndex + 1 : 0;
    }
    
    const items = photos.slice(startIndex, startIndex + pageSize);
    const nextCursor = items.length === pageSize && startIndex + pageSize < photos.length 
      ? items[items.length - 1].id 
      : undefined;
    
    return {
      photos: items,
      totalCount: photos.length,
      nextCursor
    };
  },

  async getMyPosts(query: any = {}) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const { eventId, after, pageSize = 15 } = query;
    
    let posts = [...profileShowcaseFixt.recentPosts];
    
    // Filter by event if specified
    if (eventId) {
      posts = posts.filter(post => post.eventId === eventId);
    }
    
    // Handle cursor-based pagination
    let startIndex = 0;
    if (after) {
      const afterIndex = posts.findIndex(post => post.id === after);
      startIndex = afterIndex > -1 ? afterIndex + 1 : 0;
    }
    
    const items = posts.slice(startIndex, startIndex + pageSize);
    const nextCursor = items.length === pageSize && startIndex + pageSize < posts.length 
      ? items[items.length - 1].id 
      : undefined;
    
    return {
      posts: items,
      totalCount: posts.length,
      nextCursor
    };
  },

  // Event Management APIs
  async listMyEvents() {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    return [...eventDraftsFixt];
  },

  async createEventDraft() {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const newDraftId = `draft_${Date.now()}`;
    const newDraft = {
      id: newDraftId,
      status: "DRAFT",
      title: "",
      category: "",
      organizerName: "Alex Rivera",
      description: "",
      timezone: "America/Managua",
      startsAt: "",
      endsAt: "",
      venue: {
        name: "",
        city: "",
        country: "Nicaragua"
      },
      social: { enabled: true },
      camera: { enabled: false },
      policies: {
        refundPolicy: "WINDOW",
        refundWindowHours: 24,
        reentry: true,
        attendeeListVisibility: "PUBLIC"
      },
      checkout: {},
      products: [],
      metrics: {
        views: 0,
        wishlists: 0,
        sold: 0,
        revenue: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return { id: newDraftId, draft: newDraft };
  },

  async getEventDraft(id: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const draft = eventDraftsFixt.find(d => d.id === id);
    if (!draft) {
      throw new Error("Draft not found");
    }
    
    return { ...draft };
  },

  async updateEventDraft(id: string, patch: any) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const draft = eventDraftsFixt.find(d => d.id === id);
    if (!draft) {
      throw new Error("Draft not found");
    }
    
    const updatedDraft = {
      ...draft,
      ...patch,
      updatedAt: new Date().toISOString()
    };
    
    return updatedDraft;
  },

  async publishEvent(id: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const draft = eventDraftsFixt.find(d => d.id === id);
    if (!draft) {
      throw new Error("Draft not found");
    }
    
    return {
      ...draft,
      status: "PUBLISHED",
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  async scheduleEvent(id: string, publishAtISO: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const draft = eventDraftsFixt.find(d => d.id === id);
    if (!draft) {
      throw new Error("Draft not found");
    }
    
    return {
      ...draft,
      status: "SCHEDULED",
      scheduledPublishAt: publishAtISO,
      updatedAt: new Date().toISOString()
    };
  },

  async duplicateEvent(id: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const original = eventDraftsFixt.find(d => d.id === id);
    if (!original) {
      throw new Error("Event not found");
    }
    
    const newId = `draft_${Date.now()}`;
    const duplicated = {
      ...original,
      id: newId,
      status: "DRAFT",
      title: `${original.title} (Copy)`,
      metrics: {
        views: 0,
        wishlists: 0,
        sold: 0,
        revenue: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: undefined,
      scheduledPublishAt: undefined
    };
    
    return { id: newId, draft: duplicated };
  },

  async addProduct(eventId: string, input: any) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const productId = `prod_${Date.now()}`;
    const newProduct = {
      id: productId,
      currency: "USD",
      capacity: 100,
      ...input,
      order: input.order || 1
    };
    
    return newProduct;
  },

  async updateProduct(eventId: string, productId: string, patch: any) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    // Find product in event drafts
    const event = eventDraftsFixt.find(e => e.id === eventId);
    const product = event?.products.find(p => p.id === productId);
    
    if (!product) {
      throw new Error("Product not found");
    }
    
    return { ...product, ...patch };
  },

  async removeProduct(eventId: string, productId: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    return { success: true };
  },

  async reorderProducts(eventId: string, newOrder: string[]) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    return { success: true, order: newOrder };
  },

  async generateCheckInList(eventId: string, name?: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const listId = `checkin_${Date.now()}`;
    const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return {
      id: listId,
      shortId,
      name: name || `Check-in List ${shortId}`,
      eventId,
      createdAt: new Date().toISOString()
    };
  },

  async getQuickMetrics(eventId: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const event = eventDraftsFixt.find(e => e.id === eventId);
    if (!event) {
      return { sold: 0, capacity: 0, revenue: 0 };
    }
    
    const capacity = event.products.reduce((sum, p) => sum + p.capacity, 0);
    
    return {
      sold: event.metrics?.sold || 0,
      capacity,
      revenue: event.metrics?.revenue || 0
    };
  },

  async getEventCategories() {
    await delay(mockToggles.delayMs / 2);
    
    return [
      "Music",
      "Sports",
      "Party",
      "Business",
      "Food & Drink",
      "Arts",
      "Comedy",
      "Education",
      "Community",
      "Other"
    ];
  },

  async getEventDetail(id: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    // For now, return the same event for any ID
    // In a real app, this would fetch by ID
    return { ...eventDetailFixt };
  },

  async createOrderMock(eventId: string, tiers: { tierId: string; quantity: number }[]) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    // Mock order creation - in real app this would process payment
    const orderId = `order_${Date.now()}`;
    
    // Update user's ticket status for this event (mock)
    // This simulates the user now having a ticket
    return {
      orderId,
      eventId,
      status: "confirmed",
      total: 55.00, // Mock total
      items: tiers,
      hasTicket: true // This would trigger UI mode change
    };
  },

  async toggleEventFollow(eventId: string) {
    await delay(mockToggles.delayMs / 2);
    await maybeFail();
    
    // Toggle follow status
    const isFollowing = Math.random() > 0.5; // Mock toggle
    
    return {
      eventId,
      following: isFollowing,
      followersCount: eventDetailFixt.stats.interestedCount + (isFollowing ? 1 : -1)
    };
  },

  async setEventReminder(eventId: string, enabled: boolean) {
    await delay(mockToggles.delayMs / 2);
    await maybeFail();
    
    return {
      eventId,
      reminderOn: enabled,
      message: enabled 
        ? "You'll be notified when tickets go on sale"
        : "Reminder removed"
    };
  },

  async getTicketsPayload() {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const events = Events.parse(eventsFixt);
    const tickets = ticketsFixt;
    
    // Mock user data
    const user = {
      id: "user_1",
      city: "Managua",
      roles: ["user", "organizer"] // User is both attendee and organizer
    };

    // Upcoming tickets (2-3 items)
    const upcoming = tickets.slice(0, 3).map((ticket: any, index: number) => {
      const event = ticket.event;
      const now = new Date();
      const eventDate = new Date(event.startsAt);
      const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      return {
        id: `ticket_${index + 1}`,
        eventId: event.id,
        title: event.title,
        startsAt: event.startsAt,
        venue: event.venue.name,
        city: event.venue.city,
        coverUrl: event.coverUrl,
        seatInfo: index === 0 ? "Section A, Row 5, Seats 12-13" : undefined,
        hasQr: true,
        photosReleased: false
      };
    });

    // Past tickets (3-5 items)
    const past = [
      {
        id: "ticket_past_1",
        eventId: "ev_past_1",
        title: "Indie Night Rooftop",
        startsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        venue: "Sky Lounge",
        city: "Managua",
        coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
        hasQr: true,
        photosReleased: true
      },
      {
        id: "ticket_past_2", 
        eventId: "ev_past_2",
        title: "EDM Summer Fest",
        startsAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
        venue: "Beach Club",
        city: "San Juan del Sur",
        coverUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
        hasQr: true,
        photosReleased: true
      },
      {
        id: "ticket_past_3",
        eventId: "ev_past_3", 
        title: "Jazz & Wine Evening",
        startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
        venue: "Cultural Center",
        city: "Granada",
        coverUrl: "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=400",
        hasQr: true,
        photosReleased: false
      },
      {
        id: "ticket_past_4",
        eventId: "ev_past_4",
        title: "Food & Music Festival", 
        startsAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 2 months ago
        venue: "Central Park",
        city: "Managua",
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
        hasQr: true,
        photosReleased: false
      }
    ];

    // My Events (as organizer) - 2-3 items
    const myEvents = [
      {
        id: "my_event_1",
        title: "Sunset Beach Party 2024",
        startsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
        venue: "Playa Maderas",
        city: "San Juan del Sur",
        coverUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
        stats: {
          sold: 127,
          revenue: 3175,
          checkins: 0
        }
      },
      {
        id: "my_event_2",
        title: "Tech Meetup: AI & Future",
        startsAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days from now
        venue: "Innovation Hub",
        city: "Managua", 
        coverUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400",
        stats: {
          sold: 45,
          revenue: 0, // Free event
          checkins: 0
        }
      },
      {
        id: "my_event_3",
        title: "Cooking Workshop Series",
        startsAt: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(), // 22 days from now
        venue: "Culinary Institute",
        city: "Granada",
        coverUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
        stats: {
          sold: 23,
          revenue: 690,
          checkins: 0
        }
      }
    ];

    return {
      city: user.city,
      notifications: { unread: Math.floor(Math.random() * 3) },
      upcoming,
      past,
      myEvents
    };
  },

  async getFeedPayload(scope: "all" | "following" | "nearby" | "trending" = "all") {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const user = {
      id: "usr_001",
      name: "John Doe",
      city: "Managua"
    };

    // Stories data
    const stories = [
      {
        id: "story_1",
        userId: "usr_002",
        userName: "Sarah Johnson",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
        hasNewStory: true,
        isViewed: false
      },
      {
        id: "story_2",
        userId: "usr_003",
        userName: "Mike Chen",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
        hasNewStory: true,
        isViewed: false
      },
      {
        id: "story_3",
        userId: "usr_004",
        userName: "Emma Davis",
        userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200",
        hasNewStory: true,
        isViewed: true
      },
      {
        id: "story_4",
        userId: "usr_005",
        userName: "Alex Rodriguez",
        userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
        hasNewStory: true,
        isViewed: false
      },
      {
        id: "story_5",
        userId: "usr_006",
        userName: "Lisa Wang",
        userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
        hasNewStory: false,
        isViewed: true
      }
    ];

    // Feed posts based on scope
    const basePosts = [
      {
        id: "post_1",
        author: {
          id: "usr_002",
          name: "Sarah Johnson",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
          verified: true
        },
        event: {
          id: "ev_1",
          name: "Sunset Rooftop Party",
          coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400"
        },
        content: "Can't wait for tonight's rooftop party! Who else is coming? 🎉 The sunset view is going to be incredible!",
        media: [
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"
          }
        ],
        likes: 245,
        comments: 32,
        shares: 8,
        hasLiked: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "post_2",
        author: {
          id: "usr_003",
          name: "Mike Chen",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
          verified: false
        },
        event: {
          id: "ev_2",
          name: "EDM Night",
          coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"
        },
        content: "Last night was INSANE! Best DJ set I've heard all year 🔥🎵",
        media: [
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800"
          },
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800"
          }
        ],
        likes: 892,
        comments: 124,
        shares: 45,
        hasLiked: true,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "post_3",
        author: {
          id: "usr_004",
          name: "Emma Davis",
          avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200",
          verified: true
        },
        content: "Just got my tickets for next week's festival! Who's going? Let's meet up! 🎪✨",
        likes: 156,
        comments: 28,
        shares: 5,
        hasLiked: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "post_4",
        author: {
          id: "usr_005",
          name: "Alex Rodriguez",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
          verified: false
        },
        event: {
          id: "ev_3",
          name: "Jazz & Wine Night",
          coverUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"
        },
        content: "Perfect evening vibes at Jazz & Wine Night. The band is phenomenal! 🍷🎺",
        media: [
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800"
          }
        ],
        likes: 423,
        comments: 67,
        shares: 12,
        hasLiked: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "post_5",
        author: {
          id: "usr_006",
          name: "Lisa Wang",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
          verified: true
        },
        content: "Festival season is here! Check out my new event planning tips on the blog. Link in bio 💫",
        likes: 567,
        comments: 89,
        shares: 34,
        hasLiked: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Filter posts based on scope
    let posts = basePosts;
    if (scope === "following") {
      posts = basePosts.filter(p => p.author.verified);
    } else if (scope === "nearby") {
      posts = basePosts.filter(p => p.event);
    } else if (scope === "trending") {
      posts = basePosts.sort((a, b) => b.likes - a.likes);
    }

    return {
      city: user.city,
      notifications: { unread: Math.floor(Math.random() * 5) },
      stories,
      posts
    };
  },

  async getProfilePayload() {
    await delay(mockToggles.delayMs);
    await maybeFail();
    
    const profile = {
      id: "usr_001",
      name: "Juan Sandino",
      username: "juansandino",
      bio: "Event enthusiast & photographer. Living life one concert at a time 🎵",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
      verified: true,
      location: "Managua, Nicaragua",
      joinedDate: "March 2022"
    };

    const stats = {
      followers: 1247,
      following: 834,
      events: 47,
      photos: 312,
      points: 8750,
      level: "Gold Member"
    };

    const overview = {
      recentEvents: [
        {
          id: "ev_recent_1",
          title: "Sunset Rooftop Party",
          date: "2 weeks ago",
          coverUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400"
        },
        {
          id: "ev_recent_2", 
          title: "EDM Festival 2024",
          date: "1 month ago",
          coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"
        },
        {
          id: "ev_recent_3",
          title: "Jazz & Wine Night", 
          date: "2 months ago",
          coverUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"
        }
      ],
      topPhotos: [
        {
          id: "photo_1",
          url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300",
          eventName: "Sunset Rooftop"
        },
        {
          id: "photo_2", 
          url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300",
          eventName: "EDM Festival"
        },
        {
          id: "photo_3",
          url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300", 
          eventName: "Jazz Night"
        },
        {
          id: "photo_4",
          url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
          eventName: "Music Fest"
        },
        {
          id: "photo_5",
          url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300",
          eventName: "Concert Hall"
        },
        {
          id: "photo_6",
          url: "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=300",
          eventName: "Beach Party"
        }
      ],
      achievements: [
        {
          id: "ach_1",
          title: "Night Owl",
          icon: "🦉",
          unlockedAt: "1 week ago"
        },
        {
          id: "ach_2",
          title: "Social Butterfly", 
          icon: "🦋",
          unlockedAt: "2 weeks ago"
        },
        {
          id: "ach_3",
          title: "Photo Pro",
          icon: "📸", 
          unlockedAt: "1 month ago"
        },
        {
          id: "ach_4",
          title: "Party Legend",
          icon: "🎉",
          unlockedAt: "2 months ago"
        }
      ]
    };

    const events = [
      {
        id: "ev_1",
        title: "Sunset Rooftop Party 2024",
        date: "Dec 15, 2024",
        venue: "Sky Lounge",
        coverUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
        attendees: 247
      },
      {
        id: "ev_2", 
        title: "EDM Summer Festival",
        date: "Nov 28, 2024", 
        venue: "Festival Grounds",
        coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
        attendees: 1834
      },
      {
        id: "ev_3",
        title: "Jazz & Wine Evening",
        date: "Oct 20, 2024",
        venue: "Grand Hotel Ballroom", 
        coverUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
        attendees: 156
      }
    ];

    const photos = [
      {
        id: "photo_1",
        url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
        eventName: "Sunset Rooftop",
        date: "2 weeks ago"
      },
      {
        id: "photo_2",
        url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400", 
        eventName: "EDM Festival",
        date: "1 month ago"
      },
      {
        id: "photo_3",
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
        eventName: "Jazz Night", 
        date: "2 months ago"
      },
      {
        id: "photo_4",
        url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
        eventName: "Music Festival",
        date: "3 months ago"
      },
      {
        id: "photo_5", 
        url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400",
        eventName: "Concert Hall",
        date: "4 months ago"
      },
      {
        id: "photo_6",
        url: "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=400",
        eventName: "Beach Party",
        date: "5 months ago"
      }
    ];

    const badges = [
      {
        id: "badge_1",
        title: "Early Adopter",
        description: "One of the first 1000 users",
        icon: "🚀",
        rarity: "legendary" as const,
        unlockedAt: "March 2022"
      },
      {
        id: "badge_2", 
        title: "Social Star",
        description: "Gained 1000+ followers",
        icon: "⭐",
        rarity: "epic" as const,
        unlockedAt: "June 2023"
      },
      {
        id: "badge_3",
        title: "Event Explorer",
        description: "Attended 25+ events",
        icon: "🗺️", 
        rarity: "rare" as const,
        unlockedAt: "August 2023"
      },
      {
        id: "badge_4",
        title: "Photo Hunter",
        description: "Uploaded 100+ photos", 
        icon: "📷",
        rarity: "rare" as const,
        unlockedAt: "October 2023"
      },
      {
        id: "badge_5",
        title: "Night Owl",
        description: "Attended 10 late night events",
        icon: "🦉",
        rarity: "common" as const, 
        unlockedAt: "1 week ago"
      },
      {
        id: "badge_6",
        title: "Weekend Warrior", 
        description: "Perfect weekend attendance",
        icon: "⚔️",
        rarity: "epic" as const,
        unlockedAt: "2 months ago"
      }
    ];

    return {
      profile,
      stats,
      overview,
      events,
      photos,
      badges
    };
  }
};