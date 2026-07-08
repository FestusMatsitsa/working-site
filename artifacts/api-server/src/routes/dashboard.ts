import { Router, type IRouter } from "express";
import { eq, gte, desc } from "drizzle-orm";
import { db, ticketsTable, assetsTable, inventoryTable, maintenanceTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetTicketsByStatusResponse,
  GetTicketsByCategoryResponse,
  GetRecentTicketsResponse,
  GetUpcomingMaintenanceResponse,
  GetLowStockItemsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [tickets, assets, inventory, maintenance] = await Promise.all([
    db.select().from(ticketsTable),
    db.select().from(assetsTable),
    db.select().from(inventoryTable),
    db.select().from(maintenanceTable),
  ]);

  const today = new Date().toISOString().split("T")[0];

  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === "open").length;
  const inProgressTickets = tickets.filter(t => t.status === "in_progress").length;
  const resolvedToday = tickets.filter(t =>
    t.resolvedAt && t.resolvedAt.toISOString().startsWith(today)
  ).length;

  const totalAssets = assets.length;
  const activeAssets = assets.filter(a => a.status === "active").length;
  const assetsUnderRepair = assets.filter(a => a.status === "under_repair").length;

  const lowStockItems = inventory.filter(i => i.quantity <= i.minimumStock).length;

  const upcomingMaintenance = maintenance.filter(m =>
    m.status === "scheduled" && m.scheduledDate >= today
  ).length;
  const overdueMaintenance = maintenance.filter(m =>
    m.status === "scheduled" && m.scheduledDate < today
  ).length;

  res.json(GetDashboardSummaryResponse.parse({
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedToday,
    totalAssets,
    activeAssets,
    assetsUnderRepair,
    lowStockItems,
    upcomingMaintenance,
    overdueMaintenance,
  }));
});

router.get("/dashboard/tickets-by-status", async (_req, res): Promise<void> => {
  const tickets = await db.select().from(ticketsTable);
  const statusMap: Record<string, number> = {};
  for (const t of tickets) {
    statusMap[t.status] = (statusMap[t.status] ?? 0) + 1;
  }
  const result = Object.entries(statusMap).map(([status, count]) => ({ status, count }));
  res.json(GetTicketsByStatusResponse.parse(result));
});

router.get("/dashboard/tickets-by-category", async (_req, res): Promise<void> => {
  const tickets = await db.select().from(ticketsTable);
  const catMap: Record<string, number> = {};
  for (const t of tickets) {
    catMap[t.category] = (catMap[t.category] ?? 0) + 1;
  }
  const result = Object.entries(catMap).map(([category, count]) => ({ category, count }));
  res.json(GetTicketsByCategoryResponse.parse(result));
});

router.get("/dashboard/recent-tickets", async (_req, res): Promise<void> => {
  const tickets = await db.select().from(ticketsTable).orderBy(desc(ticketsTable.createdAt)).limit(10);
  const mapped = tickets.map(t => ({
    ...t,
    assignedToName: null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt?.toISOString() ?? null,
    resolvedAt: t.resolvedAt?.toISOString() ?? null,
  }));
  res.json(GetRecentTicketsResponse.parse(mapped));
});

router.get("/dashboard/upcoming-maintenance", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const items = await db.select().from(maintenanceTable)
    .where(eq(maintenanceTable.status, "scheduled"))
    .orderBy(maintenanceTable.scheduledDate)
    .limit(5);

  const upcoming = items.filter(i => i.scheduledDate >= today);
  const mapped = upcoming.map(m => ({
    ...m,
    assignedToName: null,
    assetName: null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt?.toISOString() ?? null,
  }));

  res.json(GetUpcomingMaintenanceResponse.parse(mapped));
});

router.get("/dashboard/low-stock-items", async (_req, res): Promise<void> => {
  const items = await db.select().from(inventoryTable).orderBy(inventoryTable.name);
  const lowStock = items
    .filter(i => i.quantity <= i.minimumStock)
    .map(i => ({
      ...i,
      isLowStock: true,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt?.toISOString() ?? null,
    }));

  res.json(GetLowStockItemsResponse.parse(lowStock));
});

export default router;
