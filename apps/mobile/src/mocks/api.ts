import eventsFixt from "./fixtures/events.json";
import productsEv1 from "./fixtures/products_event_1.json";
import ordersFixt from "./fixtures/orders.json";
import ticketsFixt from "./fixtures/tickets.json";
import postsEv1 from "./fixtures/posts_event_1.json";
import pollsEv1 from "./fixtures/polls_event_1.json";
import attendeesEv1 from "./fixtures/attendees_event_1.json";
import galleryEv1 from "./fixtures/gallery_event_1.json";
import checkinEv1 from "./fixtures/checkin_list_event_1.json";
import { mockToggles, delay } from "./toggles";
import { z } from "zod";
import { Event, ProductTier, Order, Ticket, Post, Poll } from "../types/models";

const Events = z.array(Event);
const Tiers = z.array(ProductTier);
const Orders = z.array(Order);
const Tickets = z.array(Ticket);
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
    const tickets = Tickets.parse(ticketsFixt);
    const events = Events.parse(eventsFixt);
    const tiers = Tiers.parse(productsEv1);
    
    // Populate tickets with event and tier data
    return tickets.map(ticket => {
      const event = events.find(e => e.id === ticket.eventId);
      const tier = tiers.find(t => t.id.includes("general")) || tiers[0]; // Default to first tier
      
      return {
        ...ticket,
        event: event || events[0], // Default to first event if not found
        tier: tier || { id: "default", name: "General Admission", price: { amount: 25, currency: "USD" } },
        status: "valid", // Add ticket status
        orderId: `ord_${ticket.id}`,
        createdAt: new Date().toISOString()
      };
    });
  },

  async getTicket(id: string) {
    await delay(mockToggles.delayMs);
    await maybeFail();
    const ticket = Tickets.parse(ticketsFixt).find(t => t.id === id);
    if (!ticket) throw new Error("Ticket not found");
    
    const events = Events.parse(eventsFixt);
    const tiers = Tiers.parse(productsEv1);
    const event = events.find(e => e.id === ticket.eventId);
    const tier = tiers.find(t => t.id.includes("general")) || tiers[0];
    
    return {
      ...ticket,
      event: event || events[0],
      tier: tier || { id: "default", name: "General Admission", price: { amount: 25, currency: "USD" } },
      status: "valid",
      orderId: `ord_${ticket.id}`,
      createdAt: new Date().toISOString()
    };
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
  }
};