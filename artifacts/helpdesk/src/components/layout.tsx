import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Ticket as TicketIcon, 
  Monitor, 
  Box, 
  Wrench, 
  BookOpen, 
  Users, 
  BarChart,
  LogOut,
  Activity,
  ChevronDown,
} from "lucide-react";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { useAuth, useCurrentUser, hasRole } from "@/context/auth";

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin: { label: "Admin", cls: "bg-red-500/20 text-red-300" },
  technician: { label: "Technician", cls: "bg-blue-500/20 text-blue-300" },
  ict_officer: { label: "ICT Officer", cls: "bg-blue-500/20 text-blue-300" },
  user: { label: "Staff", cls: "bg-green-500/20 text-green-300" },
};

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const { logout } = useAuth();
  const user = useCurrentUser();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, minRole: "user" as const },
    { href: "/tickets", label: "Tickets", icon: TicketIcon, minRole: "user" as const },
    { href: "/assets", label: "Assets", icon: Monitor, minRole: "technician" as const },
    { href: "/inventory", label: "Inventory", icon: Box, minRole: "technician" as const },
    { href: "/maintenance", label: "Maintenance", icon: Wrench, minRole: "technician" as const },
    { href: "/knowledge", label: "Knowledge Base", icon: BookOpen, minRole: "user" as const },
    { href: "/users", label: "Staff", icon: Users, minRole: "admin" as const },
    { href: "/reports", label: "Reports", icon: BarChart, minRole: "technician" as const },
  ];

  const visibleItems = navItems.filter(item =>
    !user || hasRole(user.role, item.minRole)
  );

  const roleBadge = user ? (ROLE_BADGE[user.role] ?? ROLE_BADGE["user"]) : null;

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col text-sidebar-foreground">
        <div className="p-4 flex flex-col gap-1 border-b border-sidebar-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded bg-primary-foreground flex items-center justify-center text-primary font-bold shadow-sm">
              KCG
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-sidebar-primary-foreground leading-tight">ICT Helpdesk &</h1>
              <h2 className="text-xs text-sidebar-primary-foreground/80 font-medium">Asset Management</h2>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-3">
          {/* Current user */}
          {user && (
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
              </div>
              {roleBadge && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${roleBadge.cls}`}>
                  {roleBadge.label}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-sidebar-foreground/60">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              System Status:
            </span>
            <span className={`font-semibold ${health?.status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
              {health?.status === 'ok' ? 'Online' : 'Degraded'}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
