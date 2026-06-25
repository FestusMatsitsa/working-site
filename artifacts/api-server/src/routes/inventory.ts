import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, inventoryTable } from "@workspace/db";
import {
  ListInventoryQueryParams,
  ListInventoryResponse,
  CreateInventoryItemBody,
  CreateInventoryItemResponse,
  GetInventoryItemParams,
  GetInventoryItemResponse,
  UpdateInventoryItemParams,
  UpdateInventoryItemBody,
  UpdateInventoryItemResponse,
  DeleteInventoryItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function enrichItem(item: typeof inventoryTable.$inferSelect) {
  return {
    ...item,
    isLowStock: item.quantity <= item.minimumStock,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt?.toISOString() ?? null,
  };
}

router.get("/inventory", async (req, res): Promise<void> => {
  const query = ListInventoryQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let items = await db.select().from(inventoryTable).orderBy(inventoryTable.name);

  if (query.data.lowStock === true || String(query.data.lowStock) === "true") {
    items = items.filter(i => i.quantity <= i.minimumStock);
  }

  res.json(ListInventoryResponse.parse(items.map(enrichItem)));
});

router.post("/inventory", async (req, res): Promise<void> => {
  const parsed = CreateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db.insert(inventoryTable).values(parsed.data).returning();
  res.status(201).json(CreateInventoryItemResponse.parse(enrichItem(item)));
});

router.get("/inventory/:id", async (req, res): Promise<void> => {
  const params = GetInventoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db.select().from(inventoryTable).where(eq(inventoryTable.id, params.data.id));
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  res.json(GetInventoryItemResponse.parse(enrichItem(item)));
});

router.patch("/inventory/:id", async (req, res): Promise<void> => {
  const params = UpdateInventoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db.update(inventoryTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(inventoryTable.id, params.data.id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  res.json(UpdateInventoryItemResponse.parse(enrichItem(item)));
});

router.delete("/inventory/:id", async (req, res): Promise<void> => {
  const params = DeleteInventoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db.delete(inventoryTable).where(eq(inventoryTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
