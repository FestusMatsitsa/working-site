import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "./components/layout";
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

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
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
