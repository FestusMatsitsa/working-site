import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListKnowledgeArticles, getListKnowledgeArticlesQueryKey,
  useCreateKnowledgeArticle,
} from "@workspace/api-client-react";
import type { KnowledgeArticleInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Search, BookOpen, FileText, Settings, HelpCircle, ScrollText } from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  troubleshooting: <Settings className="w-4 h-4" />,
  procedure: <FileText className="w-4 h-4" />,
  policy: <ScrollText className="w-4 h-4" />,
  faq: <HelpCircle className="w-4 h-4" />,
  manual: <BookOpen className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  troubleshooting: "bg-orange-100 text-orange-700",
  procedure: "bg-blue-100 text-blue-700",
  policy: "bg-purple-100 text-purple-700",
  faq: "bg-green-100 text-green-700",
  manual: "bg-gray-100 text-gray-700",
};

export default function Knowledge() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: articles = [] } = useListKnowledgeArticles(
    { category: categoryFilter || undefined },
    { query: { queryKey: getListKnowledgeArticlesQueryKey({ category: categoryFilter || undefined }) } }
  );

  const filtered = articles.filter(a =>
    search === "" ||
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.tags ?? []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const published = filtered.filter(a => a.isPublished);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground text-sm mt-1">{published.length} published article{published.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Article
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search articles and tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["", "troubleshooting", "procedure", "policy", "faq", "manual"].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                categoryFilter === cat ? "bg-primary text-primary-foreground" : "border hover:bg-muted"
              }`}
            >
              {cat === "" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No articles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(article => (
            <div
              key={article.id}
              className="border rounded-lg bg-card shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3"
              onClick={() => setLocation(`/knowledge/${article.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[article.category ?? ""] ?? "bg-muted text-muted-foreground"}`}>
                  {CATEGORY_ICONS[article.category ?? ""]}
                  {article.category}
                </span>
                {!article.isPublished && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Draft</span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-snug">{article.title}</h3>
                {article.content && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                    {article.content.replace(/#{1,6}\s/g, "").replace(/\*\*/g, "").slice(0, 200)}
                  </p>
                )}
              </div>
              {(article.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(article.tags ?? []).slice(0, 4).map(tag => (
                    <span key={tag} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-auto">
                {article.authorName && <span>{article.authorName} · </span>}
                {article.createdAt && format(new Date(article.createdAt), "MMM d, yyyy")}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateArticleModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateArticleModal({ onClose }: { onClose: () => void }) {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { mutate: createArticle, isPending } = useCreateKnowledgeArticle();
  const [form, setForm] = useState<Partial<KnowledgeArticleInput>>({ category: "troubleshooting", isPublished: true, authorId: 1 });
  const [tagsInput, setTagsInput] = useState("");

  function set(field: keyof KnowledgeArticleInput, value: string | number | boolean | null) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.content || !form.category) return;
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    createArticle({ data: { ...form, tags } as KnowledgeArticleInput }, {
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: getListKnowledgeArticlesQueryKey({}) });
        onClose();
        if (data?.id) setLocation(`/knowledge/${data.id}`);
      },
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b"><h2 className="text-lg font-semibold">New Knowledge Article</h2></div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <Field label="Title *">
            <input required className={inputCls} value={form.title ?? ""} onChange={e => set("title", e.target.value)} placeholder="Article title" />
          </Field>
          <Field label="Category *">
            <select className={inputCls} value={form.category ?? ""} onChange={e => set("category", e.target.value)}>
              <option value="troubleshooting">Troubleshooting</option>
              <option value="procedure">Procedure</option>
              <option value="policy">Policy</option>
              <option value="faq">FAQ</option>
              <option value="manual">Manual</option>
            </select>
          </Field>
          <Field label="Content * (Markdown supported)">
            <textarea required rows={10} className={inputCls} value={form.content ?? ""} onChange={e => set("content", e.target.value)} placeholder="Write article content here. Markdown formatting is supported." />
          </Field>
          <Field label="Tags (comma separated)">
            <input className={inputCls} value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="e.g. printer, hp, connectivity" />
          </Field>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isPublished ?? true} onChange={e => set("isPublished", e.target.checked)} className="rounded" />
            Publish immediately
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded-md py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
              {isPending ? "Publishing..." : "Publish Article"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring";
