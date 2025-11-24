import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/shared/components/ui/sidebar";
import { AppSidebar } from "@/shared/components";
import { User, Settings as SettingsIcon, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { AuthProvider, useAuth } from "@/providers";
import { ProtectedRoute } from "@/shared/components";
import { Dashboard } from "@/features/dashboard";
import { ProductList, AddProduct, Categories, BulkUpload, EditProduct } from "@/features/products";
import { StockLevels, LowStock, StockAdjustments } from "@/features/inventory";
import { Orders, PendingOrders, ShippedOrders, Returns } from "@/features/orders";
import { Channels, AddChannel, SyncSettings } from "@/features/channels";
import { Analytics, PerformanceAnalytics } from "@/features/analytics";
import { Settings } from "@/features/settings";
import { Login } from "@/features/auth";
import { UserManagement } from "@/features/users";
import { NotificationBell, NotFound } from "@/shared/components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Authenticated App Content
function AppContent() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1" />
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {user?.first_name} {user?.last_name}
                  <div className="text-xs text-muted-foreground font-normal">
                    {user?.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 p-6 bg-background">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<ProductsSection />} />
              <Route path="/products/add" element={<AddProduct />} />
              <Route path="/products/:id/edit" element={<EditProduct />} />
              <Route path="/inventory" element={<InventorySection />} />
              <Route path="/inventory/low-stock" element={<LowStock />} />
              <Route path="/orders" element={<OrdersSection />} />
              <Route path="/orders/pending" element={<PendingOrders />} />
              <Route path="/orders/shipped" element={<ShippedOrders />} />
              <Route path="/channels" element={<ChannelsSection />} />
              <Route path="/channels/add" element={<AddChannel />} />
              <Route path="/analytics" element={<AnalyticsSection />} />
              <Route path="/analytics/performance" element={<PerformanceAnalytics />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Tabbed components for each section
const ProductsSection = () => (
  <Tabs defaultValue="all" className="w-full">
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="all">All Products</TabsTrigger>
      <TabsTrigger value="add">Add Product</TabsTrigger>
      <TabsTrigger value="categories">Categories</TabsTrigger>
      <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
    </TabsList>
    <TabsContent value="all" className="mt-6">
      <ProductList />
    </TabsContent>
    <TabsContent value="add" className="mt-6">
      <AddProduct />
    </TabsContent>
    <TabsContent value="categories" className="mt-6">
      <Categories />
    </TabsContent>
    <TabsContent value="bulk" className="mt-6">
      <BulkUpload />
    </TabsContent>
  </Tabs>
);

const InventorySection = () => (
  <Tabs defaultValue="levels" className="w-full">
    <TabsList className="grid w-full grid-cols-3">
      <TabsTrigger value="levels">Stock Levels</TabsTrigger>
      <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
      <TabsTrigger value="adjustments">Stock Adjustments</TabsTrigger>
    </TabsList>
    <TabsContent value="levels" className="mt-6">
      <StockLevels />
    </TabsContent>
    <TabsContent value="low-stock" className="mt-6">
      <LowStock />
    </TabsContent>
    <TabsContent value="adjustments" className="mt-6">
      <StockAdjustments />
    </TabsContent>
  </Tabs>
);

const OrdersSection = () => (
  <Tabs defaultValue="all" className="w-full">
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="all">All Orders</TabsTrigger>
      <TabsTrigger value="pending">Pending</TabsTrigger>
      <TabsTrigger value="shipped">Shipped</TabsTrigger>
      <TabsTrigger value="returns">Returns</TabsTrigger>
    </TabsList>
    <TabsContent value="all" className="mt-6">
      <Orders />
    </TabsContent>
    <TabsContent value="pending" className="mt-6">
      <PendingOrders />
    </TabsContent>
    <TabsContent value="shipped" className="mt-6">
      <ShippedOrders />
    </TabsContent>
    <TabsContent value="returns" className="mt-6">
      <Returns />
    </TabsContent>
  </Tabs>
);

const ChannelsSection = () => (
  <Tabs defaultValue="connected" className="w-full">
    <TabsList className="grid w-full grid-cols-3">
      <TabsTrigger value="connected">Connected</TabsTrigger>
      <TabsTrigger value="add">Add Channel</TabsTrigger>
      <TabsTrigger value="sync">Sync Settings</TabsTrigger>
    </TabsList>
    <TabsContent value="connected" className="mt-6">
      <Channels />
    </TabsContent>
    <TabsContent value="add" className="mt-6">
      <AddChannel />
    </TabsContent>
    <TabsContent value="sync" className="mt-6">
      <SyncSettings />
    </TabsContent>
  </Tabs>
);

const AnalyticsSection = () => (
  <Tabs defaultValue="reports" className="w-full">
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="reports">Reports</TabsTrigger>
      <TabsTrigger value="performance">Performance</TabsTrigger>
    </TabsList>
    <TabsContent value="reports" className="mt-6">
      <Analytics />
    </TabsContent>
    <TabsContent value="performance" className="mt-6">
      <PerformanceAnalytics />
    </TabsContent>
  </Tabs>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
