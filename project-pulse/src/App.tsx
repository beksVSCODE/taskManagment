import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import ProjectDashboard from "./pages/ProjectDashboard";
import UsersManagement from "./pages/UsersManagement";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";
import Team from "./pages/Team";
import Departments from "./pages/Departments";
import Settings from "./pages/Settings";
import EmployeesPage from "./pages/EmployeesPage";
import EmployeeDetailsPage from "./pages/EmployeeDetailsPage";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Защищённый маршрут — редирект на /login если не авторизован
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/"              element={<Dashboard />} />
              <Route path="/projects"      element={<Index />} />
              <Route path="/project/:id"   element={<ProjectDashboard />} />
              <Route path="/analytics"     element={<Analytics />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/team"          element={<Team />} />
              <Route path="/employees"     element={<EmployeesPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailsPage />} />
              <Route path="/departments"   element={<Departments />} />
              <Route path="/settings"      element={<Settings />} />
              <Route path="/users"         element={<UsersManagement />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

