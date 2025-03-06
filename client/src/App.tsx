import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Home from "@/pages/home";
import Slots from "@/pages/slots";
import Dice from "@/pages/dice";
import Crash from "@/pages/crash";
import { Sidebar } from "@/components/sidebar";
import { useQuery } from "@tanstack/react-query";
import { NumericUser } from "@shared/schema";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading } = useQuery<NumericUser>({
    queryKey: ["/api/user/me"],
  });

  if (isLoading) return null;
  if (!user) window.location.href = "/auth";

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <Component />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/slots" component={() => <ProtectedRoute component={Slots} />} />
      <Route path="/dice" component={() => <ProtectedRoute component={Dice} />} />
      <Route path="/crash" component={() => <ProtectedRoute component={Crash} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;