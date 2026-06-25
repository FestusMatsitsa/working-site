import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, assetsTable, usersTable } from "@workspace/db";
import {
  ListAssetsQueryParams,
  ListAssetsResponse,
  CreateAssetBody,
  CreateAssetResponse,
  GetAssetParams,
  GetAssetResponse,
  UpdateAssetParams,
  UpdateAssetBody,
  UpdateAssetResponse,
  DeleteAssetParams,
  GetAssetStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

let assetTagCounter = 1000;

async function enrichAsset(asset: typeof assetsTable.$inferSelect) {
  let assignedToName: string | null = null;
  if (asset.assignedTo) {
    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, asset.assignedTo));
    assignedToName = user?.name ?? null;
  }
  return {
    ...asset,
    assignedToName,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt?.toISOString() ?? null,
  };
}

router.get("/assets/stats/summary", async (_req, res): Promise<void> => {
  const all = await db.select().from(assetsTable);
  const total = all.length;
  const active = all.filter(a => a.status === "active").length;
  const underRepair = all.filter(a => a.status === "under_repair").length;
  const inactive = all.filter(a => a.status === "inactive").length;
  const disposed = all.filter(a => a.status === "disposed").length;

  const categoryMap: Record<string, number> = {};
  for (const a of all) {
    categoryMap[a.category] = (categoryMap[a.category] ?? 0) + 1;
  }
  const byCategory = Object.entries(categoryMap).map(([category, count]) => ({ category, count }));

  res.json(GetAssetStatsResponse.parse({ total, active, underRepair, inactive, disposed, byCategory }));
});

router.get("/assets", async (req, res): Promise<void> => {
  const query = ListAssetsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.category) conditions.push(eq(assetsTable.category, query.data.category));
  if (query.data.status) conditions.push(eq(assetsTable.status, query.data.status));
  if (query.data.location) conditions.push(eq(assetsTable.location, query.data.location));

  const assets = await db.select().from(assetsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(assetsTable.name);

  const enriched = await Promise.all(assets.map(enrichAsset));
  res.json(ListAssetsResponse.parse(enriched));
});

router.post("/assets", async (req, res): Promise<void> => {
  const parsed = CreateAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const assetTag = parsed.data.assetTag || `ICT-${++assetTagCounter}`;
  const { assignedTo, ...rest } = parsed.data;
  const [asset] = await db.insert(assetsTable).values({
    ...rest,
    assetTag,
    assignedTo: assignedTo ?? null,
    status: rest.status ?? "active",
  }).returning();

  const enriched = await enrichAsset(asset);
  res.status(201).json(CreateAssetResponse.parse(enriched));
});

router.get("/assets/:id", async (req, res): Promise<void> => {
  const params = GetAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, params.data.id));
  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  const enriched = await enrichAsset(asset);
  res.json(GetAssetResponse.parse(enriched));
});

router.patch("/assets/:id", async (req, res): Promise<void> => {
  const params = UpdateAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [asset] = await db.update(assetsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(assetsTable.id, params.data.id))
    .returning();

  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  const enriched = await enrichAsset(asset);
  res.json(UpdateAssetResponse.parse(enriched));
});

router.delete("/assets/:id", async (req, res): Promise<void> => {
  const params = DeleteAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [asset] = await db.delete(assetsTable).where(eq(assetsTable.id, params.data.id)).returning();
  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
