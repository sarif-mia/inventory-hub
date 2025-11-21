import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  BarChart3,
  Settings,
  Users,
  Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainMenuItems = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/dashboard",
  },
  {
    id: "products",
    title: "Products",
    icon: Package,
    url: "/products",
  },
  {
    id: "inventory",
    title: "Inventory",
    icon: Package,
    url: "/inventory",
  },
  {
    id: "orders",
    title: "Orders",
    icon: ShoppingCart,
    url: "/orders",
  },
  {
    id: "channels",
    title: "Channels",
    icon: Store,
    url: "/channels",
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: BarChart3,
    url: "/analytics",
  },
  {
    id: "users",
    title: "Users",
    icon: Users,
    url: "/users",
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    url: "/settings",
  },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <h1 className={`font-bold transition-all ${open ? 'text-lg' : 'text-xs'}`}>
            {open ? 'InventoryHub' : 'IH'}
          </h1>
          {open && <p className="text-xs text-sidebar-foreground/60 mt-1">Multi-Channel Manager</p>}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
