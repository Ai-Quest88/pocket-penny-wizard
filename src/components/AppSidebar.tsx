
import { BarChart2, CreditCard, DollarSign, Home, Settings, Users, Wallet, List, Upload, FileText, TrendingUp, Calendar, Activity, PieChart, ArrowLeftRight } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { FamilyMember, BusinessEntity } from "@/types/entities"

export function AppSidebar() {
  const location = useLocation()
  const [entities, setEntities] = useState<(FamilyMember | BusinessEntity)[]>([])

  useEffect(() => {
    // Load entities from localStorage
    const savedEntities = localStorage.getItem('entities')
    if (savedEntities) {
      setEntities(JSON.parse(savedEntities))
    }

    // Listen for storage events to update sidebar when entities change
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'entities') {
        setEntities(JSON.parse(e.newValue || '[]'))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/"}
                  >
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/entities"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/entities"}
                  >
                    <Users className="h-4 w-4" />
                    <span>Entities</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/assets"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/assets"}
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Assets</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/liabilities"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/liabilities"}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Liabilities</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/budgets"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/budgets"}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Budgets</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/transactions"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/transactions"}
                  >
                    <List className="h-4 w-4" />
                    <span>Transactions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/transfers"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/transfers"}
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>Transfers</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/settings"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/settings"}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/reports"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/reports"}
                  >
                    <BarChart2 className="h-4 w-4" />
                    <span>Net Worth</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/reports/income-expense"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/reports/income-expense"}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Income & Expense</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/reports/cash-flow"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/reports/cash-flow"}
                  >
                    <Activity className="h-4 w-4" />
                    <span>Cash Flow</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/reports/trends"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/reports/trends"}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Trends</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/reports/timeline"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/reports/timeline"}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Timeline</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/reports/digest"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/reports/digest"}
                  >
                    <PieChart className="h-4 w-4" />
                    <span>Digest Report</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
