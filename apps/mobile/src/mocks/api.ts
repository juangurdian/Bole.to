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
        type: "announcement" as const,
        id: "ann_1",
        eventId: "ev_1",
        eventTitle: "Sunset Rooftop Party",
        text: "Doors open at 9PM! Don't forget to bring ID.",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
        userName: "Event Organizer"
      },
      {
        type: "post" as const,
        id: "post_1",
        eventId: "ev_1",
        eventTitle: "Sunset Rooftop Party",
        userName: "Ana Rodriguez",
        text: "Who's ready for tonight? Can't wait! 🎉",
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1h ago
        likes: 12
      },
      {
        type: "poll" as const,
        id: "poll_1",
        eventId: "ev_1",
        eventTitle: "Sunset Rooftop Party",
        question: "What music are you hoping to hear tonight?",
        options: [
          { id: "opt1", label: "House & Electronic", pct: 65, votes: 23 },
          { id: "opt2", label: "Latin Pop", pct: 35, votes: 12 }
        ],
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30m ago
        hasVoted: false
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

    return {
      user,
      upcoming,
      socialDigest,
      discover,
      galleries,
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
  }
};