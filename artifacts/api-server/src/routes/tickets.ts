import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, ticketsTable, ticketCommentsTable, usersTable } from "@workspace/db";
import {
  ListTicketsQueryParams,
  ListTicketsResponse,
  CreateTicketBody,
  CreateTicketResponse,
  GetTicketParams,
  GetTicketResponse,
  UpdateTicketParams,
  UpdateTicketBody,
  UpdateTicketResponse,
  ListTicketCommentsParams,
  ListTicketCommentsResponse,
  AddTicketCommentParams,
  AddTicketCommentBody,
  AddTicketCommentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichTicket(ticket: typeof ticketsTable.$inferSelect) {
  let assignedToName: string | null = null;
  if (ticket.assignedTo) {
    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, ticket.assignedTo));
    assignedToName = user?.name ?? null;
  }
  return {
    ...ticket,
    assignedToName,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt?.toISOString() ?? null,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
  };
}

router.get("/tickets", async (req, res): Promise<void> => {
  const query = ListTicketsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.status) conditions.push(eq(ticketsTable.status, query.data.status));
  if (query.data.category) conditions.push(eq(ticketsTable.category, query.data.category));
  if (query.data.priority) conditions.push(eq(ticketsTable.priority, query.data.priority));
  if (query.data.assignedTo != null) conditions.push(eq(ticketsTable.assignedTo, query.data.assignedTo));

  const tickets = await db.select().from(ticketsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(ticketsTable.createdAt));

  const enriched = await Promise.all(tickets.map(enrichTicket));
  res.json(ListTicketsResponse.parse(enriched));
});

router.post("/tickets", async (req, res): Promise<void> => {
  const parsed = CreateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { assignedTo, assetId, ...rest } = parsed.data;
  const [ticket] = await db.insert(ticketsTable).values({
    ...rest,
    assignedTo: assignedTo ?? null,
    assetId: assetId ?? null,
  }).returning();

  const enriched = await enrichTicket(ticket);
  res.status(201).json(CreateTicketResponse.parse(enriched));
});

router.get("/tickets/:id", async (req, res): Promise<void> => {
  const params = GetTicketParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, params.data.id));
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const enriched = await enrichTicket(ticket);
  res.json(GetTicketResponse.parse(enriched));
});

router.patch("/tickets/:id", async (req, res): Promise<void> => {
  const params = UpdateTicketParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const now = new Date();
  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: now };

  if (parsed.data.status === "resolved" || parsed.data.status === "closed") {
    updateData.resolvedAt = now;
  }

  const [ticket] = await db.update(ticketsTable)
    .set(updateData)
    .where(eq(ticketsTable.id, params.data.id))
    .returning();

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const enriched = await enrichTicket(ticket);
  res.json(UpdateTicketResponse.parse(enriched));
});

router.get("/tickets/:id/comments", async (req, res): Promise<void> => {
  const params = ListTicketCommentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const comments = await db.select().from(ticketCommentsTable)
    .where(eq(ticketCommentsTable.ticketId, params.data.id))
    .orderBy(ticketCommentsTable.createdAt);

  const mapped = comments.map(c => ({
    ...c,
    isInternal: c.isInternal === 1,
    createdAt: c.createdAt.toISOString(),
  }));

  res.json(ListTicketCommentsResponse.parse(mapped));
});

router.post("/tickets/:id/comments", async (req, res): Promise<void> => {
  const params = AddTicketCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AddTicketCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [comment] = await db.insert(ticketCommentsTable).values({
    ticketId: params.data.id,
    authorName: parsed.data.authorName,
    content: parsed.data.content,
    isInternal: parsed.data.isInternal ? 1 : 0,
  }).returning();

  res.status(201).json(AddTicketCommentResponse.parse({
    ...comment,
    isInternal: comment.isInternal === 1,
    createdAt: comment.createdAt.toISOString(),
  }));
});

export default router;
