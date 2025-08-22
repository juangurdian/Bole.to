import { z } from "zod";

export const Money = z.object({ amount: z.number(), currency: z.string() });

export const ProductTier = z.object({
  id: z.string(),
  name: z.string(),
  price: Money,
  remaining: z.number(),
});

export const Event = z.object({
  id: z.string(),
  title: z.string(),
  coverUrl: z.string().nullable(),
  startsAt: z.string(), // ISO
  venue: z.object({ name: z.string(), city: z.string() }),
  tiers: z.array(ProductTier).optional(), // for detail
});
export type Event = z.infer<typeof Event>;

export const Order = z.object({
  id: z.string(),
  eventId: z.string(),
  total: Money,
  status: z.enum(["RESERVED","COMPLETED","CANCELLED"]).default("COMPLETED")
});
export type Order = z.infer<typeof Order>;

export const Ticket = z.object({
  id: z.string(),
  eventId: z.string(),
  code: z.string(),
  holderName: z.string(),
});
export type Ticket = z.infer<typeof Ticket>;

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