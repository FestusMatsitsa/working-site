import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListTickets, getListTicketsQueryKey,
  useCreateTicket, getListTicketsQueryKey as ticketsKey,
  useListUsers, getListUsersQueryKey,
  useListAssets, getListAssetsQueryKey,
} from "@workspace/api-client-react";
import type { TicketInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Search, Filter } from "lucide-react";

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

export default function Tickets() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: tickets = [] } = useListTickets(
    { status: statusFilter || undefined, category: categoryFilter || undefined },
    { query: { queryKey: getListTicketsQueryKey({ status: statusFilter || undefined, category: categoryFilter || undefined }) } }
  );

  const filtered = tickets.filter(t =>
    search === "" ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.reportedBy && t.reportedBy.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} support request{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search tickets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="hardware">Hardware</option>
          <option value="software">Software</option>
          <option value="network">Network</option>
          <option value="user_support">User Support</option>
        </select>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left font-medium p-3 w-12">#</th>
              <th className="text-left font-medium p-3">Title</th>
              <th className="text-left font-medium p-3">Category</th>
              <th className="text-left font-medium p-3">Priority</th>
              <th className="text-left font-medium p-3">Status</th>
              <th className="text-left font-medium p-3">Reported By</th>
              <th className="text-left font-medium p-3">Assigned To</th>
              <th className="text-left font-medium p-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-muted-foreground">
                  No tickets found
                </td>
              </tr>
            ) : (
              filtered.map(ticket => (
                <tr
                  key={ticket.id}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => setLocation(`/tickets/${ticket.id}`)}
                >
                  <td className="p-3 text-muted-foreground font-mono">{ticket.id}</td>
                  <td className="p-3 font-medium text-primary max-w-xs truncate">{ticket.title}</td>
                  <td className="p-3 capitalize">{ticket.category?.replace("_", " ")}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PRIORITY_COLORS[ticket.priority ?? ""] ?? ""}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status ?? ""] ?? ""}`}>
                      {ticket.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{ticket.reportedBy ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{ticket.assignedToName ?? <span className="italic text-muted-foreground/60">Unassigned</span>}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {ticket.createdAt ? format(new Date(ticket.createdAt), "MMM d, yyyy") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateTicketModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateTicketModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { mutate: createTicket, isPending } = useCreateTicket();
  const { data: users = [] } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });
  const { data: assets = [] } = useListAssets({}, { query: { queryKey: getListAssetsQueryKey({}) } });

  const [form, setForm] = useState<Partial<TicketInput>>({
    category: "hardware",
    priority: "medium",
    status: "open",
  });

  function set(field: keyof TicketInput, value: string | number | null) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.description || !form.reportedBy || !form.reporterEmail || !form.category || !form.priority) return;
    createTicket(
      { data: form as TicketInput },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ticketsKey() });
          onClose();
        },
      }
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Submit New Ticket</h2>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <Field label="Title *">
            <input required className={inputCls} placeholder="Describe the issue briefly" value={form.title ?? ""} onChange={e => set("title", e.target.value)} />
          </Field>
          <Field label="Description *">
            <textarea required rows={3} className={inputCls} placeholder="Full details of the issue..." value={form.description ?? ""} onChange={e => set("description", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category *">
              <select className={inputCls} value={form.category ?? ""} onChange={e => set("category", e.target.value)}>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="network">Network</option>
                <option value="user_support">User Support</option>
              </select>
            </Field>
            <Field label="Priority *">
              <select className={inputCls} value={form.priority ?? ""} onChange={e => set("priority", e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </Field>
          </div>
          <Field label="Reported By *">
            <input required className={inputCls} placeholder="Full name" value={form.reportedBy ?? ""} onChange={e => set("reportedBy", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email *">
              <input required type="email" className={inputCls} placeholder="email@kilifi.go.ke" value={form.reporterEmail ?? ""} onChange={e => set("reporterEmail", e.target.value)} />
            </Field>
            <Field label="Department">
              <input className={inputCls} placeholder="Department" value={form.reporterDepartment ?? ""} onChange={e => set("reporterDepartment", e.target.value)} />
            </Field>
          </div>
          <Field label="Assign To">
            <select className={inputCls} value={form.assignedTo ?? ""} onChange={e => set("assignedTo", e.target.value ? Number(e.target.value) : null)}>
              <option value="">— Unassigned —</option>
              {users.filter(u => u.role === "technician" || u.role === "admin").map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </Field>
          <Field label="Related Asset">
            <select className={inputCls} value={form.assetId ?? ""} onChange={e => set("assetId", e.target.value ? Number(e.target.value) : null)}>
              <option value="">— None —</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>
              ))}
            </select>
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded-md py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
              {isPending ? "Submitting..." : "Submit Ticket"}
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
