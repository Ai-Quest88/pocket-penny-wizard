import { BarChart2, CreditCard, DollarSign, Home, Settings, Users, Wallet } from "lucide-react"
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
  SidebarMenuSubItem,
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
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
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
                    to="/analytics"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/analytics"}
                  >
                    <BarChart2 className="h-4 w-4" />
                    <span>Analytics</span>
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
                    to="/assets-liabilities"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/assets-liabilities"}
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Assets</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/assets-liabilities"
                    className="flex items-center gap-2"
                    data-active={location.pathname === "/assets-liabilities"}
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
      </SidebarContent>
    </Sidebar>
  )
}