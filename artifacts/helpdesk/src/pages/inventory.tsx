import { useState } from "react";
import {
  useListInventory, getListInventoryQueryKey,
  useCreateInventoryItem,
  useUpdateInventoryItem,
} from "@workspace/api-client-react";
import type { InventoryItemInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Search, AlertTriangle, Package } from "lucide-react";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [adjustItem, setAdjustItem] = useState<{ id: number; name: string; quantity: number } | null>(null);

  const { data: items = [] } = useListInventory(
    { category: categoryFilter || undefined },
    { query: { queryKey: getListInventoryQueryKey({ category: categoryFilter || undefined }) } }
  );

  const filtered = items.filter(i => {
    const matchSearch = search === "" || i.name.toLowerCase().includes(search.toLowerCase());
    const matchLow = !lowStockOnly || (i.quantity ?? 0) <= (i.minimumStock ?? 0);
    return matchSearch && matchLow;
  });

  const lowCount = items.filter(i => (i.quantity ?? 0) <= (i.minimumStock ?? 0)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">Consumables & spare parts stock</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {lowCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">{lowCount} item{lowCount !== 1 ? "s" : ""} below minimum stock level</p>
            <button className="text-xs text-red-600 underline" onClick={() => setLowStockOnly(true)}>Show only low stock</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search inventory..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="consumable">Consumable</option>
          <option value="spare_part">Spare Part</option>
          <option value="accessory">Accessory</option>
          <option value="cable">Cable</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer border rounded-md px-3 py-2 bg-background select-none">
          <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} className="rounded" />
          Low stock only
        </label>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left font-medium p-3">Item</th>
              <th className="text-left font-medium p-3">Category</th>
              <th className="text-left font-medium p-3">Quantity</th>
              <th className="text-left font-medium p-3">Min. Stock</th>
              <th className="text-left font-medium p-3">Unit Price</th>
              <th className="text-left font-medium p-3">Supplier</th>
              <th className="text-left font-medium p-3">Last Restocked</th>
              <th className="text-left font-medium p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No items found</td></tr>
            ) : (
              filtered.map(item => {
                const isLow = (item.quantity ?? 0) <= (item.minimumStock ?? 0);
                return (
                  <tr key={item.id} className={`hover:bg-muted/30 ${isLow ? "bg-red-50/40" : ""}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {isLow && <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 capitalize">{item.category?.replace("_", " ")}</td>
                    <td className="p-3">
                      <span className={`font-semibold ${isLow ? "text-destructive" : "text-foreground"}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{item.minimumStock} {item.unit}</td>
                    <td className="p-3 text-muted-foreground">
                      {item.unitPrice != null ? `KES ${Number(item.unitPrice).toLocaleString()}` : "—"}
                    </td>
                    <td className="p-3 text-muted-foreground">{item.supplier ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">
                      {item.lastRestocked ? format(new Date(item.lastRestocked), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setAdjustItem({ id: item.id!, name: item.name, quantity: item.quantity ?? 0 })}
                        className="text-xs border rounded px-2 py-1 hover:bg-muted transition-colors"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateItemModal onClose={() => setShowCreate(false)} />}
      {adjustItem && <AdjustStockModal item={adjustItem} onClose={() => setAdjustItem(null)} />}
    </div>
  );
}

function AdjustStockModal({ item, onClose }: { item: { id: number; name: string; quantity: number }; onClose: () => void }) {
  const qc = useQueryClient();
  const { mutate: updateItem, isPending } = useUpdateInventoryItem();
  const [qty, setQty] = useState(item.quantity);
  const [restocked, setRestocked] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    updateItem(
      { id: item.id, data: { quantity: qty, lastRestocked: restocked ? new Date().toISOString().split("T")[0] : undefined } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getListInventoryQueryKey({}) }); onClose(); } }
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-5 border-b">
          <h2 className="text-base font-semibold">Adjust Stock — {item.name}</h2>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">New Quantity</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={qty}
              onChange={e => setQty(Number(e.target.value))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={restocked} onChange={e => setRestocked(e.target.checked)} className="rounded" />
            Mark as restocked today
          </label>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border rounded-md py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateItemModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { mutate: createItem, isPending } = useCreateInventoryItem();
  const [form, setForm] = useState<Partial<InventoryItemInput>>({ category: "consumable", unit: "pcs", quantity: 0, minimumStock: 5 });

  function set(field: keyof InventoryItemInput, value: string | number) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.category) return;
    createItem({ data: form as InventoryItemInput }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListInventoryQueryKey({}) }); onClose(); },
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b"><h2 className="text-lg font-semibold">Add Inventory Item</h2></div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <Field label="Item Name *">
            <input required className={inputCls} value={form.name ?? ""} onChange={e => set("name", e.target.value)} placeholder="e.g. HP 85A Toner Cartridge" />
          </Field>
          <Field label="Category *">
            <select className={inputCls} value={form.category ?? ""} onChange={e => set("category", e.target.value)}>
              <option value="consumable">Consumable</option>
              <option value="spare_part">Spare Part</option>
              <option value="accessory">Accessory</option>
              <option value="cable">Cable</option>
            </select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Quantity">
              <input type="number" min={0} className={inputCls} value={form.quantity ?? 0} onChange={e => set("quantity", Number(e.target.value))} />
            </Field>
            <Field label="Min. Stock">
              <input type="number" min={0} className={inputCls} value={form.minimumStock ?? 0} onChange={e => set("minimumStock", Number(e.target.value))} />
            </Field>
            <Field label="Unit">
              <input className={inputCls} value={form.unit ?? ""} onChange={e => set("unit", e.target.value)} placeholder="pcs" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit Price (KES)">
              <input type="number" min={0} className={inputCls} value={form.unitPrice ?? ""} onChange={e => set("unitPrice", e.target.value)} />
            </Field>
            <Field label="Supplier">
              <input className={inputCls} value={form.supplier ?? ""} onChange={e => set("supplier", e.target.value)} />
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={2} className={inputCls} value={form.description ?? ""} onChange={e => set("description", e.target.value)} />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded-md py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
              {isPending ? "Adding..." : "Add Item"}
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
