import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./components/AppSidebar"
import Index from "./pages/Index"
import ImportTransactions from "./pages/ImportTransactions"
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
              <ProtectedRoute>
                <AppSidebar />
              </ProtectedRoute>
              <main className="flex-1">
                <SidebarTrigger className="m-4" />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/import"
                    element={
                      <ProtectedRoute>
                        <ImportTransactions />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <div className="p-8">Analytics Page (Coming Soon)</div>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/accounts"
                    element={
                      <ProtectedRoute>
                        <div className="p-8">Accounts Page (Coming Soon)</div>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/budgets"
                    element={
                      <ProtectedRoute>
                        <div className="p-8">Budgets Page (Coming Soon)</div>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <div className="p-8">Settings Page (Coming Soon)</div>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
)

export default App