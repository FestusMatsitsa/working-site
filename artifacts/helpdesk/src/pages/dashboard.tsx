import { useLocation } from "wouter";
import { Link } from "wouter";
import { 
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetTicketsByStatus, getGetTicketsByStatusQueryKey,
  useGetTicketsByCategory, getGetTicketsByCategoryQueryKey,
  useGetRecentTickets, getGetRecentTicketsQueryKey,
  useGetUpcomingMaintenance, getGetUpcomingMaintenanceQueryKey,
  useGetLowStockItems, getGetLowStockItemsQueryKey
} from "@workspace/api-client-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { 
  Ticket as TicketIcon, 
  Monitor, 
  AlertTriangle, 
  Clock, 
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";

const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: summary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: ticketsStatus } = useGetTicketsByStatus({ query: { queryKey: getGetTicketsByStatusQueryKey() } });
  const { data: ticketsCategory } = useGetTicketsByCategory({ query: { queryKey: getGetTicketsByCategoryQueryKey() } });
  const { data: recentTickets } = useGetRecentTickets({ query: { queryKey: getGetRecentTicketsQueryKey() } });
  const { data: upcomingMaintenance } = useGetUpcomingMaintenance({ query: { queryKey: getGetUpcomingMaintenanceQueryKey() } });
  const { data: lowStock } = useGetLowStockItems({ query: { queryKey: getGetLowStockItemsQueryKey() } });

  if (!summary) {
    return <div className="animate-pulse space-y-8">
      <div className="h-10 w-48 bg-muted rounded"></div>
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded"></div>)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Open Tickets" 
          value={summary.openTickets} 
          subtitle={`${summary.resolvedToday} resolved today`}
          icon={<TicketIcon className="text-primary w-5 h-5" />}
          onClick={() => setLocation("/tickets?status=open")}
        />
        <SummaryCard 
          title="Active Assets" 
          value={summary.activeAssets} 
          subtitle={`${summary.assetsUnderRepair} under repair`}
          icon={<Monitor className="text-blue-500 w-5 h-5" />}
          onClick={() => setLocation("/assets")}
        />
        <SummaryCard 
          title="Low Stock Alerts" 
          value={summary.lowStockItems} 
          subtitle="Items below threshold"
          icon={<AlertTriangle className="text-destructive w-5 h-5" />}
          onClick={() => setLocation("/inventory?lowStock=true")}
          danger={summary.lowStockItems > 0}
        />
        <SummaryCard 
          title="Upcoming Maint." 
          value={summary.upcomingMaintenance} 
          subtitle={`${summary.overdueMaintenace} overdue tasks`}
          icon={<Clock className="text-orange-500 w-5 h-5" />}
          onClick={() => setLocation("/maintenance")}
          danger={summary.overdueMaintenace > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Tickets by Status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketsStatus}>
                <XAxis dataKey="status" tick={{fontSize: 12}} />
                <YAxis allowDecimals={false} tick={{fontSize: 12}} />
                <RechartsTooltip cursor={{fill: 'var(--muted)'}} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border rounded-lg bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Tickets by Category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={ticketsCategory} 
                  dataKey="count" 
                  nameKey="category" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label 
                >
                  {ticketsCategory?.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border rounded-lg bg-card shadow-sm flex flex-col">
          <div className="p-4 border-b bg-muted/30">
            <h2 className="text-lg font-semibold">Recent Tickets</h2>
          </div>
          <div className="p-0 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium p-3">Ticket</th>
                  <th className="text-left font-medium p-3">Category</th>
                  <th className="text-left font-medium p-3">Status</th>
                  <th className="text-left font-medium p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentTickets?.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setLocation(`/tickets/${ticket.id}`)}>
                    <td className="p-3 font-medium text-primary">#{ticket.id} {ticket.title}</td>
                    <td className="p-3 capitalize">{ticket.category}</td>
                    <td className="p-3 capitalize">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.status === 'open' ? 'bg-destructive/10 text-destructive' :
                        ticket.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600' :
                        'bg-green-500/10 text-green-600'
                      }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{format(new Date(ticket.createdAt), "MMM d, yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border rounded-lg bg-card shadow-sm flex flex-col">
          <div className="p-4 border-b bg-muted/30">
            <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
          </div>
          <div className="p-4 space-y-4 flex-1 overflow-auto">
            {lowStock?.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                No low stock items
              </div>
            ) : (
              lowStock?.map((item) => (
                <div key={item.id} className="flex justify-between items-center pb-4 border-b last:border-0 last:pb-0">
                  <div>
                    <Link href={`/inventory`} className="font-medium text-primary hover:underline block">{item.name}</Link>
                    <span className="text-xs text-muted-foreground uppercase">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-destructive font-bold">{item.quantity} {item.unit}</div>
                    <div className="text-xs text-muted-foreground">Min: {item.minimumStock}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon, onClick, danger }: any) {
  return (
    <div 
      className={`border rounded-lg p-5 shadow-sm transition-shadow hover:shadow-md cursor-pointer ${danger ? 'bg-destructive/5 border-destructive/20' : 'bg-card'}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}