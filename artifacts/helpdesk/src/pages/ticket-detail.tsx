import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetTicket, getGetTicketQueryKey,
  useUpdateTicket,
  useListTicketComments, getListTicketCommentsQueryKey,
  useAddTicketComment,
  useListUsers, getListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, MessageSquare, User, Clock, Tag } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const ticketId = Number(id);

  const { data: ticket, isLoading } = useGetTicket(ticketId, { query: { queryKey: getGetTicketQueryKey(ticketId) } });
  const { data: comments = [] } = useListTicketComments(ticketId, { query: { queryKey: getListTicketCommentsQueryKey(ticketId) } });
  const { data: users = [] } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });
  const { mutate: updateTicket } = useUpdateTicket();
  const { mutate: addComment, isPending: commenting } = useAddTicketComment();

  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editAssignee, setEditAssignee] = useState("");

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-muted rounded" /><div className="h-48 bg-muted rounded" /></div>;
  if (!ticket) return <div className="text-muted-foreground text-center py-20">Ticket not found.</div>;

  function handleStatusUpdate() {
    if (!editStatus) return;
    updateTicket({ id: ticketId, data: { status: editStatus as any, resolution: editStatus === "resolved" ? "Issue resolved by ICT team" : undefined } }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getGetTicketQueryKey(ticketId) }); setEditStatus(""); },
    });
  }

  function handleAssigneeUpdate() {
    if (!editAssignee) return;
    updateTicket({ id: ticketId, data: { assignedTo: Number(editAssignee) } }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getGetTicketQueryKey(ticketId) }); setEditAssignee(""); },
    });
  }

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(
      { id: ticketId, data: { comment: commentText, isInternal, authorId: 1 } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListTicketCommentsQueryKey(ticketId) });
          setCommentText("");
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setLocation("/tickets")} className="p-2 rounded-md hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ticket #{ticket.id}</h1>
          <p className="text-muted-foreground text-sm">{ticket.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-lg bg-card shadow-sm p-6">
            <h2 className="font-semibold mb-3">Description</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
            {ticket.resolution && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-xs font-medium text-green-700 mb-1">Resolution</p>
                <p className="text-sm text-green-800">{ticket.resolution}</p>
              </div>
            )}
          </div>

          <div className="border rounded-lg bg-card shadow-sm">
            <div className="p-4 border-b flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold">Comments ({comments.length})</h2>
            </div>
            <div className="divide-y">
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No comments yet.</p>
              )}
              {comments.map(c => (
                <div key={c.id} className={`p-4 ${c.isInternal ? "bg-amber-50" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{c.authorName ?? "System"}</span>
                    <div className="flex items-center gap-2">
                      {c.isInternal && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Internal</span>}
                      <span className="text-xs text-muted-foreground">{c.createdAt ? format(new Date(c.createdAt), "MMM d, yyyy HH:mm") : ""}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.comment}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleComment} className="p-4 border-t space-y-3">
              <textarea
                rows={3}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Add a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded" />
                  Internal note (not visible to reporter)
                </label>
                <button type="submit" disabled={commenting || !commentText.trim()} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                  {commenting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border rounded-lg bg-card shadow-sm p-4 space-y-4">
            <h3 className="font-semibold text-sm">Details</h3>
            <InfoRow icon={<Tag className="w-3.5 h-3.5" />} label="Status">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status ?? ""] ?? ""}`}>
                {ticket.status?.replace("_", " ")}
              </span>
            </InfoRow>
            <InfoRow icon={<Tag className="w-3.5 h-3.5" />} label="Priority">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PRIORITY_COLORS[ticket.priority ?? ""] ?? ""}`}>
                {ticket.priority}
              </span>
            </InfoRow>
            <InfoRow icon={<Tag className="w-3.5 h-3.5" />} label="Category">
              <span className="text-sm capitalize">{ticket.category?.replace("_", " ")}</span>
            </InfoRow>
            {ticket.subcategory && (
              <InfoRow icon={<Tag className="w-3.5 h-3.5" />} label="Subcategory">
                <span className="text-sm">{ticket.subcategory}</span>
              </InfoRow>
            )}
            <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Reporter">
              <div>
                <p className="text-sm font-medium">{ticket.reportedBy}</p>
                <p className="text-xs text-muted-foreground">{ticket.reporterEmail}</p>
                {ticket.reporterDepartment && <p className="text-xs text-muted-foreground">{ticket.reporterDepartment}</p>}
              </div>
            </InfoRow>
            <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Assigned To">
              <span className="text-sm">{ticket.assignedToName ?? <span className="italic text-muted-foreground">Unassigned</span>}</span>
            </InfoRow>
            <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="Created">
              <span className="text-sm">{ticket.createdAt ? format(new Date(ticket.createdAt), "MMM d, yyyy") : "—"}</span>
            </InfoRow>
            {ticket.assetId && (
              <InfoRow icon={<Tag className="w-3.5 h-3.5" />} label="Related Asset">
                <span className="text-sm font-mono text-primary cursor-pointer hover:underline" onClick={() => setLocation(`/assets/${ticket.assetId}`)}>
                  View Asset
                </span>
              </InfoRow>
            )}
          </div>

          <div className="border rounded-lg bg-card shadow-sm p-4 space-y-3">
            <h3 className="font-semibold text-sm">Update Status</h3>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={editStatus}
              onChange={e => setEditStatus(e.target.value)}
            >
              <option value="">— Select status —</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <button onClick={handleStatusUpdate} disabled={!editStatus} className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              Update Status
            </button>
          </div>

          <div className="border rounded-lg bg-card shadow-sm p-4 space-y-3">
            <h3 className="font-semibold text-sm">Assign Technician</h3>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={editAssignee}
              onChange={e => setEditAssignee(e.target.value)}
            >
              <option value="">— Select technician —</option>
              {users.filter(u => u.role === "technician" || u.role === "admin").map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <button onClick={handleAssigneeUpdate} disabled={!editAssignee} className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  );
}
