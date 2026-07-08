import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/auth";
import { Layout } from "./components/layout";
import Login from "./pages/login";
import ResetPassword from "./pages/reset-password";
import Dashboard from "./pages/dashboard";
import Tickets from "./pages/tickets";
import TicketDetail from "./pages/ticket-detail";
import Assets from "./pages/assets";
import AssetDetail from "./pages/asset-detail";
import Inventory from "./pages/inventory";
import Maintenance from "./pages/maintenance";
import Knowledge from "./pages/knowledge";
import KnowledgeArticle from "./pages/knowledge-article";
import Users from "./pages/users";
import Reports from "./pages/reports";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Don't retry on 401
        if (error && typeof error === "object" && "status" in error && (error as { status: number }).status === 401) return false;
        return failureCount < 2;
      },
    },
  },
});

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center">
      <div className="text-sidebar-foreground/50 text-sm">Loading…</div>
    </div>
  );
}

function Router() {
  const { state } = useAuth();

  // Public routes — accessible without a session
  if (window.location.pathname.startsWith(
    (import.meta.env.BASE_URL ?? "").replace(/\/$/, "") + "/reset-password"
  )) {
    return <ResetPassword />;
  }

  if (state.status === "loading") return <LoadingScreen />;
  if (state.status === "unauthenticated") return <Login />;

  return (
    <Layout>
      <Switch>
        <Route path="/tickets" component={Tickets} />
        <Route path="/tickets/:id" component={TicketDetail} />
        <Route path="/assets" component={Assets} />
        <Route path="/assets/:id" component={AssetDetail} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/maintenance" component={Maintenance} />
        <Route path="/knowledge" component={Knowledge} />
        <Route path="/knowledge/:id" component={KnowledgeArticle} />
        <Route path="/users" component={Users} />
        <Route path="/reports" component={Reports} />
        <Route path="/" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
