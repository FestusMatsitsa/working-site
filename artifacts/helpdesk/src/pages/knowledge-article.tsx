import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetKnowledgeArticle, getGetKnowledgeArticleQueryKey,
  useUpdateKnowledgeArticle,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Edit2, Check, X, BookOpen } from "lucide-react";

export default function KnowledgeArticle() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const articleId = Number(id);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const { data: article, isLoading } = useGetKnowledgeArticle(articleId, { query: { queryKey: getGetKnowledgeArticleQueryKey(articleId) } });
  const { mutate: updateArticle, isPending } = useUpdateKnowledgeArticle();

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-muted rounded" /><div className="h-96 bg-muted rounded" /></div>;
  if (!article) return <div className="text-muted-foreground text-center py-20">Article not found.</div>;

  function startEdit() {
    setEditContent(article!.content ?? "");
    setEditing(true);
  }

  function saveEdit() {
    updateArticle(
      { id: articleId, data: { content: editContent } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetKnowledgeArticleQueryKey(articleId) }); setEditing(false); } }
    );
  }

  const formattedContent = (article.content ?? "")
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold mt-6 mb-3">{line.slice(2)}</h1>;
      if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-semibold mt-5 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
      if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="ml-4 text-sm">{line.slice(2)}</li>;
      if (line.match(/^\d+\. /)) return <li key={i} className="ml-4 text-sm list-decimal">{line.replace(/^\d+\. /, "")}</li>;
      if (line === "") return <br key={i} />;
      const bold = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: bold }} />;
    });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/knowledge")} className="p-2 rounded-md hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span className="capitalize">{article.category}</span>
          </div>
        </div>
        {!editing ? (
          <button onClick={startEdit} className="flex items-center gap-2 border px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex items-center gap-2 border px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button onClick={saveEdit} disabled={isPending} className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
              <Check className="w-3.5 h-3.5" /> {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="border rounded-lg bg-card shadow-sm p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-3">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {article.authorName && <span>By {article.authorName}</span>}
            {article.createdAt && <span>· {format(new Date(article.createdAt), "MMMM d, yyyy")}</span>}
            {!article.isPublished && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Draft</span>
            )}
          </div>
          {(article.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {(article.tags ?? []).map(tag => (
                <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <hr className="border-border mb-6" />

        {editing ? (
          <textarea
            className="w-full border rounded-md px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono min-h-[400px]"
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
          />
        ) : (
          <div className="prose prose-sm max-w-none space-y-1 text-foreground">
            {formattedContent}
          </div>
        )}
      </div>
    </div>
  );
}
