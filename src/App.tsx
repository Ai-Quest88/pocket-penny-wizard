import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./components/AppSidebar"
import Dashboard from "./pages/Dashboard"
import Transactions from "./pages/Transactions"
import Accounts from "./pages/Accounts"
import Analytics from "./pages/Analytics"
import Budgets from "./pages/Budgets"
import Settings from "./pages/Settings"
import AssetsLiabilities from "./pages/AssetsLiabilities"
import Reports from "./pages/Reports"
import Notifications from "./pages/Notifications"
import NotFound from "./pages/NotFound"
import Login from "./pages/Login"

const queryClient = new QueryClient()

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              {/* Only show sidebar if authenticated */}
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <>
                        <AppSidebar />
                        <main className="flex-1">
                          <SidebarTrigger className="m-4" />
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/transactions" element={<Transactions />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/accounts" element={<Accounts />} />
                            <Route path="/assets-liabilities" element={<AssetsLiabilities />} />
                            <Route path="/budgets" element={<Budgets />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                      </>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
)

export default App