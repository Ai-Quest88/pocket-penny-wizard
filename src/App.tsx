import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { CurrencyProvider } from "./contexts/CurrencyContext"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./components/AppSidebar"
import { Button } from "@/components/ui/button"
import { User, LogOut, Settings as SettingsIcon, Bell, HelpCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import Transactions from "./pages/Transactions"
import TransferTransactions from "./pages/TransferTransactions"
import UncategorizedTransactions from "./pages/UncategorizedTransactions"
import Accounts from "./pages/Accounts"
import Analytics from "./pages/Analytics"
import Budgets from "./pages/Budgets"
import Settings from "./pages/Settings"
import Assets from "./pages/Assets"
import Liabilities from "./pages/Liabilities"
import Reports from "./pages/Reports"
import Notifications from "./pages/Notifications"
import NotFound from "./pages/NotFound"
import Login from "./pages/Login"
import AuthCallback from "./pages/AuthCallback"
import Entities from "./pages/Entities"
import Households from "./pages/Households"
import Categories from "./pages/Categories"
import ImportTransactions from "./pages/ImportTransactions"

const queryClient = new QueryClient()

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

const UserMenu = () => {
  const { logout, session } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  
  const handleLogout = () => {
    logout()
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    })
  }

  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="ghost" 
        size="icon"
        className="text-muted-foreground hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">User</p>
              <p className="text-xs leading-none text-muted-foreground">
                {session?.user?.email || 'No email'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & Support</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Root redirect */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Public routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      {/* Auth callback route */}
      <Route 
        path="/auth/callback" 
        element={<AuthCallback />} 
      />
      
      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <>
              <AppSidebar />
              <main className="flex-1 relative">
                <div className="flex justify-between items-center p-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <img 
                      src="/logo.svg" 
                      alt="Finsight" 
                      className="h-8 w-auto dark:invert"
                    />
                  </div>
                  <UserMenu />
                </div>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="transactions/uncategorized" element={<UncategorizedTransactions />} />
                  <Route path="transactions/transfers" element={<TransferTransactions />} />
                  <Route path="transactions/import" element={<ImportTransactions />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="accounts" element={<Accounts />} />
                  <Route path="entities" element={<Entities />} />
                  <Route path="households" element={<Households />} />
                  <Route path="assets" element={<Assets />} />
                  <Route path="liabilities" element={<Liabilities />} />
                  <Route path="budgets" element={<Budgets />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="reports/income-expense" element={<Reports />} />
                  <Route path="reports/cash-flow" element={<Reports />} />
                  <Route path="reports/trends" element={<Reports />} />
                  <Route path="reports/timeline" element={<Reports />} />
                  <Route path="reports/digest" element={<Reports />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="settings" element={<Settings />} />
                  <Route index element={<Dashboard />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => {
  console.log("App component rendering");
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
            <TooltipProvider>
              <div className="relative min-h-screen bg-gradient-to-br from-background to-background-muted">
                <div 
                  className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c')] bg-cover bg-center opacity-5 pointer-events-none"
                  style={{ mixBlendMode: 'overlay' }}
                />
                <Toaster />
                <Sonner />
                <SidebarProvider>
                  <div className="relative min-h-screen flex w-full">
                    <AppRoutes />
                  </div>
                </SidebarProvider>
              </div>
            </TooltipProvider>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App
