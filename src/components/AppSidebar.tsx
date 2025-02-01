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
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { FamilyMember, BusinessEntity } from "@/types/entities"

const staticMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart2,
  },
  {
    title: "Entities",
    url: "/entities",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

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
              {staticMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url}
                      className="flex items-center gap-2"
                      data-active={location.pathname === item.url}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.title === "Entities" && entities.length > 0 && (
                    <SidebarMenuSub>
                      <div>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          Entities Added
                        </div>
                        {entities.map((entity) => (
                          <SidebarMenuSubItem key={entity.id}>
                            <div className="px-2 py-1.5 text-sm">
                              {entity.name}
                            </div>
                            <SidebarMenuSub>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={location.pathname === '/assets-liabilities'}
                                >
                                  <Link to="/assets-liabilities" className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    <span>Asset</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={location.pathname === '/assets-liabilities'}
                                >
                                  <Link to="/assets-liabilities" className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    <span>Liability</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={location.pathname === '/budgets'}
                                >
                                  <Link to="/budgets" className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    <span>Budget</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            </SidebarMenuSub>
                          </SidebarMenuSubItem>
                        ))}
                      </div>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}