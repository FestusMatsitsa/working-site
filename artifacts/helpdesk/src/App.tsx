import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "./components/layout";
import Dashboard from "./pages/dashboard";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        {/* Placeholder routes until implemented */}
        <Route path="/tickets" component={() => <div>Tickets List</div>} />
        <Route path="/tickets/:id" component={() => <div>Ticket Detail</div>} />
        <Route path="/assets" component={() => <div>Assets List</div>} />
        <Route path="/assets/:id" component={() => <div>Asset Detail</div>} />
        <Route path="/inventory" component={() => <div>Inventory</div>} />
        <Route path="/maintenance" component={() => <div>Maintenance</div>} />
        <Route path="/knowledge" component={() => <div>Knowledge Base</div>} />
        <Route path="/knowledge/:id" component={() => <div>Article Detail</div>} />
        <Route path="/users" component={() => <div>Users</div>} />
        <Route path="/reports" component={() => <div>Reports</div>} />
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
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;