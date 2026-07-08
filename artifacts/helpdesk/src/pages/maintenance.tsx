import { useState } from "react";
import {
  useListMaintenanceSchedules, getListMaintenanceSchedulesQueryKey,
  useCreateMaintenanceSchedule,
  useUpdateMaintenanceSchedule,
  useListAssets, getListAssetsQueryKey,
  useListUsers, getListUsersQueryKey,
} from "@workspace/api-client-react";
import type { MaintenanceScheduleInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, isPast, isWithinInterval, addDays } from "date-fns";
import { Plus, Search, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
};

const FREQ_LABELS: Record<string, string> = {
  daily: "Daily", weekly: "Weekly", monthly: "Monthly",
  quarterly: "Quarterly", biannual: "Bi-annual", annual: "Annual", adhoc: "Ad-hoc",
};

export default function Maintenance() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [completeItem, setCompleteItem] = useState<{ id: number; title: string } | null>(null);

  const { data: schedules = [] } = useListMaintenanceSchedules(
    { status: statusFilter || undefined },
    { query: { queryKey: getListMaintenanceSchedulesQueryKey({ status: statusFilter || undefined }) } }
  );

  const filtered = schedules.filter(s =>
    search === "" ||
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.assetName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const overdue = schedules.filter(s => s.scheduledDate && isPast(new Date(s.scheduledDate)) && s.status !== "completed" && s.status !== "cancelled").length;
  const upcoming = schedules.filter(s => {
    if (!s.scheduledDate || s.status === "completed" || s.status === "cancelled") return false;
    const d = new Date(s.scheduledDate);
    return isWithinInterval(d, { start: new Date(), end: addDays(new Date(), 30) });
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Preventive Maintenance</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule and track ICT maintenance activities</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Schedule Maintenance
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className={`border rounded-lg p-4 shadow-sm ${overdue > 0 ? "bg-red-50 border-red-200" : "bg-card"}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={`w-4 h-4 ${overdue > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            <p className="text-sm font-medium text-muted-foreground">Overdue</p>
          </div>
          <p className={`text-3xl font-bold ${overdue > 0 ? "text-destructive" : ""}`}>{overdue}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-medium text-muted-foreground">Due in 30 days</p>
          </div>
          <p className="text-3xl font-bold">{upcoming}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <p className="text-sm font-medium text-muted-foreground">Total Scheduled</p>
          </div>
          <p className="text-3xl font-bold">{schedules.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search maintenance tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left font-medium p-3">Task</th>
              <th className="text-left font-medium p-3">Asset</th>
              <th className="text-left font-medium p-3">Frequency</th>
              <th className="text-left font-medium p-3">Scheduled</th>
              <th className="text-left font-medium p-3">Assigned To</th>
              <th className="text-left font-medium p-3">Status</th>
              <th className="text-left font-medium p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No maintenance tasks found</td></tr>
            ) : (
              filtered.map(s => {
                const isOverdue = s.scheduledDate && isPast(new Date(s.scheduledDate)) && s.status !== "completed" && s.status !== "cancelled";
                return (
                  <tr key={s.id} className={`hover:bg-muted/30 ${isOverdue ? "bg-red-50/30" : ""}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                        <div>
                          <p className="font-medium">{s.title}</p>
                          {s.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{s.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{s.assetName ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{FREQ_LABELS[s.frequency ?? ""] ?? s.frequency}</td>
                    <td className="p-3">
                      <span className={isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {s.scheduledDate ? format(new Date(s.scheduledDate), "MMM d, yyyy") : "—"}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{s.assignedToName ?? "—"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status ?? ""] ?? ""}`}>
                        {s.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3">
                      {s.status !== "completed" && s.status !== "cancelled" && (
                        <button
                          onClick={() => setCompleteItem({ id: s.id!, title: s.title })}
                          className="text-xs border rounded px-2 py-1 hover:bg-muted transition-colors"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateMaintenanceModal onClose={() => setShowCreate(false)} />}
      {completeItem && <CompleteModal item={completeItem} onClose={() => setCompleteItem(null)} />}
    </div>
  );
}

function CompleteModal({ item, onClose }: { item: { id: number; title: string }; onClose: () => void }) {
  const qc = useQueryClient();
  const { mutate: updateSchedule, isPending } = useUpdateMaintenanceSchedule();
  const [notes, setNotes] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    updateSchedule(
      { id: item.id, data: { status: "completed", notes } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getListMaintenanceSchedulesQueryKey({}) }); onClose(); } }
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-5 border-b flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <h2 className="text-base font-semibold">Complete: {item.title}</h2>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Completion Notes</label>
            <textarea rows={3} className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" value={notes} onChange={e => setNotes(e.target.value)} placeholder="What was done, findings, etc." />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border rounded-md py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-60">
              {isPending ? "Saving..." : "Mark Complete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateMaintenanceModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { mutate: createSchedule, isPending } = useCreateMaintenanceSchedule();
  const { data: assets = [] } = useListAssets({}, { query: { queryKey: getListAssetsQueryKey({}) } });
  const { data: users = [] } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });
  const [form, setForm] = useState<Partial<MaintenanceScheduleInput>>({ frequency: "monthly" });

  function set(field: keyof MaintenanceScheduleInput, value: string | number | null) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.assetCategory || !form.frequency || !form.scheduledDate) return;
    createSchedule({ data: form as MaintenanceScheduleInput }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListMaintenanceSchedulesQueryKey({}) }); onClose(); },
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b"><h2 className="text-lg font-semibold">Schedule Maintenance</h2></div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <Field label="Task Title *">
            <input required className={inputCls} value={form.title ?? ""} onChange={e => set("title", e.target.value)} placeholder="e.g. Monthly server backup check" />
          </Field>
          <Field label="Description">
            <textarea rows={2} className={inputCls} value={form.description ?? ""} onChange={e => set("description", e.target.value)} />
          </Field>
          <Field label="Asset Category *">
            <input required className={inputCls} value={form.assetCategory ?? ""} onChange={e => set("assetCategory", e.target.value)} placeholder="e.g. Server, Workstation, Network" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Frequency *">
              <select className={inputCls} value={form.frequency ?? ""} onChange={e => set("frequency", e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="biannual">Bi-annual</option>
                <option value="annual">Annual</option>
                <option value="adhoc">Ad-hoc</option>
              </select>
            </Field>
            <Field label="Scheduled Date *">
              <input required type="date" className={inputCls} value={form.scheduledDate ?? ""} onChange={e => set("scheduledDate", e.target.value)} />
            </Field>
          </div>
          <Field label="Related Asset">
            <select className={inputCls} value={form.assetId ?? ""} onChange={e => set("assetId", e.target.value ? Number(e.target.value) : null)}>
              <option value="">— None —</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
            </select>
          </Field>
          <Field label="Assigned To">
            <select className={inputCls} value={form.assignedTo ?? ""} onChange={e => set("assignedTo", e.target.value ? Number(e.target.value) : null)}>
              <option value="">— Unassigned —</option>
              {users.filter(u => u.role === "technician" || u.role === "admin").map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded-md py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
              {isPending ? "Scheduling..." : "Schedule"}
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
