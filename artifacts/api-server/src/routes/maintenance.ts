import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, maintenanceTable, usersTable, assetsTable } from "@workspace/db";
import {
  ListMaintenanceSchedulesQueryParams,
  ListMaintenanceSchedulesResponse,
  CreateMaintenanceScheduleBody,
  CreateMaintenanceScheduleResponse,
  GetMaintenanceScheduleParams,
  GetMaintenanceScheduleResponse,
  UpdateMaintenanceScheduleParams,
  UpdateMaintenanceScheduleBody,
  UpdateMaintenanceScheduleResponse,
  DeleteMaintenanceScheduleParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichMaintenance(m: typeof maintenanceTable.$inferSelect) {
  let assignedToName: string | null = null;
  let assetName: string | null = null;

  if (m.assignedTo) {
    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, m.assignedTo));
    assignedToName = user?.name ?? null;
  }
  if (m.assetId) {
    const [asset] = await db.select({ name: assetsTable.name }).from(assetsTable).where(eq(assetsTable.id, m.assetId));
    assetName = asset?.name ?? null;
  }

  return {
    ...m,
    assignedToName,
    assetName,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt?.toISOString() ?? null,
  };
}

router.get("/maintenance", async (req, res): Promise<void> => {
  const query = ListMaintenanceSchedulesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.status) conditions.push(eq(maintenanceTable.status, query.data.status));

  let items = await db.select().from(maintenanceTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(maintenanceTable.scheduledDate);

  if (query.data.upcoming === true || String(query.data.upcoming) === "true") {
    const today = new Date().toISOString().split("T")[0];
    items = items.filter(i => i.scheduledDate >= today && i.status === "scheduled");
  }

  const enriched = await Promise.all(items.map(enrichMaintenance));
  res.json(ListMaintenanceSchedulesResponse.parse(enriched));
});

router.post("/maintenance", async (req, res): Promise<void> => {
  const parsed = CreateMaintenanceScheduleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { assignedTo, assetId, ...rest } = parsed.data;
  const [item] = await db.insert(maintenanceTable).values({
    ...rest,
    assignedTo: assignedTo ?? null,
    assetId: assetId ?? null,
  }).returning();

  const enriched = await enrichMaintenance(item);
  res.status(201).json(CreateMaintenanceScheduleResponse.parse(enriched));
});

router.get("/maintenance/:id", async (req, res): Promise<void> => {
  const params = GetMaintenanceScheduleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db.select().from(maintenanceTable).where(eq(maintenanceTable.id, params.data.id));
  if (!item) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }

  const enriched = await enrichMaintenance(item);
  res.json(GetMaintenanceScheduleResponse.parse(enriched));
});

router.patch("/maintenance/:id", async (req, res): Promise<void> => {
  const params = UpdateMaintenanceScheduleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMaintenanceScheduleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { assignedTo, assetId, ...rest } = parsed.data;
  const [item] = await db.update(maintenanceTable)
    .set({ ...rest, assignedTo: assignedTo ?? undefined, assetId: assetId ?? undefined, updatedAt: new Date() })
    .where(eq(maintenanceTable.id, params.data.id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }

  const enriched = await enrichMaintenance(item);
  res.json(UpdateMaintenanceScheduleResponse.parse(enriched));
});

router.delete("/maintenance/:id", async (req, res): Promise<void> => {
  const params = DeleteMaintenanceScheduleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db.delete(maintenanceTable).where(eq(maintenanceTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
