
import { BarChart2, CreditCard, DollarSign, Home, Settings, Users, Wallet, List, Activity, ArrowLeftRight, ChevronDown, Building2, Brain, Landmark } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "react-router-dom"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"

export function AppSidebar() {
  const location = useLocation()
  const { session } = useAuth()
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(
    location.pathname.startsWith("/transactions")
  )
  const { data: transactionCount = 0 } = useQuery({
    queryKey: ["sidebar-transaction-count", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return 0
      const { count } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)
      return count ?? 0
    },
    enabled: !!session?.user?.id,
    staleTime: 60_000,
  })

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/" className="flex items-center gap-2" data-active={location.pathname === "/"} data-testid="sidebar-dashboard-link">
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <div className="w-full flex items-center">
                    <Link to="/transactions" className="flex items-center gap-2 flex-1" data-active={location.pathname.startsWith("/transactions")} data-testid="sidebar-transactions-link">
                      <List className="h-4 w-4" />
                      <span>Transactions</span>
                    </Link>
                    <button type="button" onClick={(e) => { e.preventDefault(); setIsTransactionsOpen(!isTransactionsOpen); }} className="p-1" aria-label="Toggle transactions submenu">
                      <ChevronDown className={`h-4 w-4 transition-transform ${isTransactionsOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </SidebarMenuButton>
                {isTransactionsOpen && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <Link to="/transactions" className="flex items-center gap-2" data-active={location.pathname === "/transactions"}>All</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <Link to="/transactions/uncategorized" className="flex items-center gap-2" data-active={location.pathname === "/transactions/uncategorized"}><List className="h-4 w-4" /> Uncategorized</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <Link to="/transactions/transfers" className="flex items-center gap-2" data-active={location.pathname === "/transactions/transfers"}><ArrowLeftRight className="h-4 w-4" /> Transfers</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/accounts" className="flex items-center gap-2" data-active={location.pathname === "/accounts"} data-testid="sidebar-accounts-link">
                    <Landmark className="h-4 w-4" />
                    <span>Accounts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/reports" className="flex items-center gap-2" data-active={location.pathname.startsWith("/reports")}>
                    <BarChart2 className="h-4 w-4" />
                    <span>Reports</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {transactionCount > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs text-muted-foreground">More</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/entities" className="flex items-center gap-2" data-active={location.pathname === "/entities"} data-testid="sidebar-entities-link">
                        <Users className="h-4 w-4" />
                        <span>Entities</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/households" className="flex items-center gap-2" data-active={location.pathname === "/households"}><Building2 className="h-4 w-4" /> Households</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/assets" className="flex items-center gap-2" data-active={location.pathname === "/assets"} data-testid="sidebar-assets-link"><Wallet className="h-4 w-4" /> Assets</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/liabilities" className="flex items-center gap-2" data-active={location.pathname === "/liabilities"} data-testid="sidebar-liabilities-link"><CreditCard className="h-4 w-4" /> Liabilities</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/budgets" className="flex items-center gap-2" data-active={location.pathname === "/budgets"}><DollarSign className="h-4 w-4" /> Budgets</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/cfo" className="flex items-center gap-2" data-active={location.pathname === "/cfo"}><Brain className="h-4 w-4" /> AI CFO</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/analytics" className="flex items-center gap-2" data-active={location.pathname === "/analytics"}><Activity className="h-4 w-4" /> Analytics</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/settings" className="flex items-center gap-2" data-active={location.pathname === "/settings"}><Settings className="h-4 w-4" /> Settings</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
