import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListAssets, getListAssetsQueryKey,
  useCreateAsset,
  useListUsers, getListUsersQueryKey,
} from "@workspace/api-client-react";
import type { AssetInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Search, Monitor } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  under_repair: "bg-orange-100 text-orange-700",
  disposed: "bg-red-100 text-red-700",
};

export default function Assets() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: assets = [] } = useListAssets(
    { type: typeFilter || undefined, status: statusFilter || undefined },
    { query: { queryKey: getListAssetsQueryKey({ type: typeFilter || undefined, status: statusFilter || undefined }) } }
  );

  const filtered = assets.filter(a =>
    search === "" ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.assetTag.toLowerCase().includes(search.toLowerCase()) ||
    (a.assignedToName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} ICT asset{filtered.length !== 1 ? "s" : ""} registered</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Register Asset
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search by name, tag, or assignee..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="desktop">Desktop</option>
          <option value="laptop">Laptop</option>
          <option value="printer">Printer</option>
          <option value="server">Server</option>
          <option value="network">Network</option>
          <option value="ups">UPS</option>
          <option value="plotter">Plotter</option>
          <option value="cctv">CCTV</option>
          <option value="other">Other</option>
        </select>
        <select className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="under_repair">Under Repair</option>
          <option value="disposed">Disposed</option>
        </select>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left font-medium p-3">Asset Tag</th>
              <th className="text-left font-medium p-3">Name</th>
              <th className="text-left font-medium p-3">Type</th>
              <th className="text-left font-medium p-3">Status</th>
              <th className="text-left font-medium p-3">Assigned To</th>
              <th className="text-left font-medium p-3">Location</th>
              <th className="text-left font-medium p-3">Warranty Until</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No assets found</td></tr>
            ) : (
              filtered.map(asset => (
                <tr key={asset.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setLocation(`/assets/${asset.id}`)}>
                  <td className="p-3 font-mono text-primary font-medium">{asset.assetTag}</td>
                  <td className="p-3 font-medium">{asset.name}</td>
                  <td className="p-3 capitalize">{asset.type}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[asset.status ?? ""] ?? ""}`}>
                      {asset.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{asset.assignedToName ?? <span className="italic text-muted-foreground/60">Unassigned</span>}</td>
                  <td className="p-3 text-muted-foreground">{asset.location ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">
                    {asset.warrantyUntil ? format(new Date(asset.warrantyUntil), "MMM d, yyyy") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateAssetModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateAssetModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { mutate: createAsset, isPending } = useCreateAsset();
  const { data: users = [] } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });
  const [form, setForm] = useState<Partial<AssetInput>>({ type: "desktop", status: "active" });

  function set(field: keyof AssetInput, value: string | number | null) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.type) return;
    createAsset({ data: form as AssetInput }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAssetsQueryKey({}) });
        onClose();
      },
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Register New Asset</h2>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <Field label="Asset Name *">
            <input required className={inputCls} placeholder="e.g. Dell OptiPlex 7090" value={form.name ?? ""} onChange={e => set("name", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type *">
              <select required className={inputCls} value={form.type ?? ""} onChange={e => set("type", e.target.value)}>
                <option value="desktop">Desktop</option>
                <option value="laptop">Laptop</option>
                <option value="printer">Printer</option>
                <option value="server">Server</option>
                <option value="network">Network</option>
                <option value="ups">UPS</option>
                <option value="plotter">Plotter</option>
                <option value="cctv">CCTV</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Status">
              <select className={inputCls} value={form.status ?? ""} onChange={e => set("status", e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="under_repair">Under Repair</option>
                <option value="disposed">Disposed</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Make / Brand">
              <input className={inputCls} placeholder="e.g. Dell" value={form.make ?? ""} onChange={e => set("make", e.target.value)} />
            </Field>
            <Field label="Model">
              <input className={inputCls} placeholder="e.g. OptiPlex 7090" value={form.model ?? ""} onChange={e => set("model", e.target.value)} />
            </Field>
          </div>
          <Field label="Serial Number">
            <input className={inputCls} placeholder="Serial number" value={form.serialNumber ?? ""} onChange={e => set("serialNumber", e.target.value)} />
          </Field>
          <Field label="Asset Tag (leave blank to auto-generate)">
            <input className={inputCls} placeholder="ICT-XXXX" value={form.assetTag ?? ""} onChange={e => set("assetTag", e.target.value)} />
          </Field>
          <Field label="Location">
            <input className={inputCls} placeholder="e.g. Block A, Room 101" value={form.location ?? ""} onChange={e => set("location", e.target.value)} />
          </Field>
          <Field label="Assigned To">
            <select className={inputCls} value={form.assignedTo ?? ""} onChange={e => set("assignedTo", e.target.value ? Number(e.target.value) : null)}>
              <option value="">— Unassigned —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Purchase Date">
              <input type="date" className={inputCls} value={form.purchaseDate ?? ""} onChange={e => set("purchaseDate", e.target.value)} />
            </Field>
            <Field label="Warranty Until">
              <input type="date" className={inputCls} value={form.warrantyUntil ?? ""} onChange={e => set("warrantyUntil", e.target.value)} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea rows={2} className={inputCls} placeholder="Any additional notes..." value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded-md py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {isPending ? "Registering..." : "Register Asset"}
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
