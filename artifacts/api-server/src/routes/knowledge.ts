import { Router, type IRouter } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { db, knowledgeTable } from "@workspace/db";
import {
  ListKnowledgeArticlesQueryParams,
  ListKnowledgeArticlesResponse,
  CreateKnowledgeArticleBody,
  CreateKnowledgeArticleResponse,
  GetKnowledgeArticleParams,
  GetKnowledgeArticleResponse,
  UpdateKnowledgeArticleParams,
  UpdateKnowledgeArticleBody,
  UpdateKnowledgeArticleResponse,
  DeleteKnowledgeArticleParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function enrichArticle(a: typeof knowledgeTable.$inferSelect) {
  // tags may be stored as JSON array (from seed) or comma-separated string — normalise to string
  let tags: string | null = a.tags ?? null;
  if (tags && tags.startsWith("[")) {
    try {
      const arr = JSON.parse(tags);
      tags = Array.isArray(arr) ? arr.join(",") : tags;
    } catch {}
  }
  return {
    ...a,
    tags,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt?.toISOString() ?? null,
  };
}

router.get("/knowledge", async (req, res): Promise<void> => {
  const query = ListKnowledgeArticlesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let articles = await db.select().from(knowledgeTable).orderBy(knowledgeTable.title);

  if (query.data.category) {
    articles = articles.filter(a => a.category === query.data.category);
  }
  if (query.data.search) {
    const s = query.data.search.toLowerCase();
    articles = articles.filter(a =>
      a.title.toLowerCase().includes(s) ||
      a.content.toLowerCase().includes(s) ||
      (a.tags ?? "").toLowerCase().includes(s)
    );
  }

  // enrichArticle splits tags string → array
  res.json(ListKnowledgeArticlesResponse.parse(articles.map(enrichArticle)));
});

router.post("/knowledge", async (req, res): Promise<void> => {
  const parsed = CreateKnowledgeArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [article] = await db.insert(knowledgeTable).values(parsed.data).returning();
  res.status(201).json(CreateKnowledgeArticleResponse.parse(enrichArticle(article)));
});

router.get("/knowledge/:id", async (req, res): Promise<void> => {
  const params = GetKnowledgeArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [article] = await db.select().from(knowledgeTable).where(eq(knowledgeTable.id, params.data.id));
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  await db.update(knowledgeTable).set({ viewCount: article.viewCount + 1 }).where(eq(knowledgeTable.id, params.data.id));
  res.json(GetKnowledgeArticleResponse.parse(enrichArticle({ ...article, viewCount: article.viewCount + 1 })));
});

router.patch("/knowledge/:id", async (req, res): Promise<void> => {
  const params = UpdateKnowledgeArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateKnowledgeArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [article] = await db.update(knowledgeTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(knowledgeTable.id, params.data.id))
    .returning();

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json(UpdateKnowledgeArticleResponse.parse(enrichArticle(article)));
});

router.delete("/knowledge/:id", async (req, res): Promise<void> => {
  const params = DeleteKnowledgeArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [article] = await db.delete(knowledgeTable).where(eq(knowledgeTable.id, params.data.id)).returning();
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
