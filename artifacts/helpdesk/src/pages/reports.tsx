import {
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetTicketsByStatus, getGetTicketsByStatusQueryKey,
  useGetTicketsByCategory, getGetTicketsByCategoryQueryKey,
  useListAssets, getListAssetsQueryKey,
  useListInventory, getListInventoryQueryKey,
  useListMaintenanceSchedules, getListMaintenanceSchedulesQueryKey,
} from "@workspace/api-client-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { format } from "date-fns";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function Reports() {
  const { data: summary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: byStatus } = useGetTicketsByStatus({ query: { queryKey: getGetTicketsByStatusQueryKey() } });
  const { data: byCategory } = useGetTicketsByCategory({ query: { queryKey: getGetTicketsByCategoryQueryKey() } });
  const { data: assets = [] } = useListAssets({}, { query: { queryKey: getListAssetsQueryKey({}) } });
  const { data: inventory = [] } = useListInventory({}, { query: { queryKey: getListInventoryQueryKey({}) } });
  const { data: schedules = [] } = useListMaintenanceSchedules({}, { query: { queryKey: getListMaintenanceSchedulesQueryKey({}) } });

  const assetsByType = Object.entries(
    assets.reduce<Record<string, number>>((acc, a) => { acc[a.type ?? "other"] = (acc[a.type ?? "other"] ?? 0) + 1; return acc; }, {})
  ).map(([type, count]) => ({ type, count }));

  const assetsByStatus = Object.entries(
    assets.reduce<Record<string, number>>((acc, a) => { acc[a.status ?? "unknown"] = (acc[a.status ?? "unknown"] ?? 0) + 1; return acc; }, {})
  ).map(([status, count]) => ({ status, count }));

  const maintenanceByStatus = Object.entries(
    schedules.reduce<Record<string, number>>((acc, s) => { acc[s.status ?? "unknown"] = (acc[s.status ?? "unknown"] ?? 0) + 1; return acc; }, {})
  ).map(([status, count]) => ({ status, count }));

  const lowStock = inventory.filter(i => (i.quantity ?? 0) <= (i.minimumStock ?? 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">System-wide performance overview — {format(new Date(), "MMMM d, yyyy")}</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Tickets", value: summary.totalTickets, sub: `${summary.openTickets} open` },
            { label: "Total Assets", value: summary.totalAssets, sub: `${summary.activeAssets} active` },
            { label: "Low Stock Items", value: summary.lowStockItems, sub: "below minimum", danger: summary.lowStockItems > 0 },
            { label: "Upcoming Maintenance", value: summary.upcomingMaintenance, sub: `${summary.overdueMaintenance} overdue`, danger: summary.overdueMaintenance > 0 },
          ].map(card => (
            <div key={card.label} className={`border rounded-lg p-4 shadow-sm ${card.danger ? "bg-red-50 border-red-200" : "bg-card"}`}>
              <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
              <p className={`text-3xl font-bold my-1 ${card.danger ? "text-destructive" : ""}`}>{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Tickets by Status">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byStatus} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tickets by Category">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byCategory} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={75} label={({ payload, percent }) => `${payload?.category ?? payload?.name ?? ""} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {byCategory?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Assets by Type">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={assetsByType} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 11 }} width={70} />
              <Tooltip cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Assets by Status">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={assetsByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={75} label={({ payload, percent }) => `${(payload?.status ?? payload?.name ?? "").toString().replace("_", " ")} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {assetsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Maintenance Status">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={maintenanceByStatus} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Low Stock Items">
          {lowStock.length === 0 ? (
            <div className="flex items-center justify-center h-55 text-muted-foreground text-sm">All items fully stocked</div>
          ) : (
            <div className="overflow-auto max-h-55">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-muted-foreground text-xs">Item</th>
                    <th className="text-right p-2 font-medium text-muted-foreground text-xs">Qty</th>
                    <th className="text-right p-2 font-medium text-muted-foreground text-xs">Min</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lowStock.map(item => (
                    <tr key={item.id}>
                      <td className="p-2 font-medium">{item.name}</td>
                      <td className="p-2 text-right text-destructive font-bold">{item.quantity}</td>
                      <td className="p-2 text-right text-muted-foreground">{item.minimumStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg bg-card shadow-sm p-6">
      <h2 className="text-base font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}
