import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StatCard } from "../components/StatCard";
import { StatCardSkeleton, ChartSkeleton } from "@/shared/components/ui/skeleton-loader";
import { Package, ShoppingCart, DollarSign, TrendingUp, Store, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useCurrency } from "@/shared/hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { apiClient } from "@/shared/utils";
import {
  DashboardStats,
  Order,
  InventoryItem,
  SalesTrendData,
  ChannelData,
  OrderStatusData
} from "@/shared/types";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { currencySymbol, formatCurrency } = useCurrency();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeOrders: 0,
    lowStockCount: 0,
    connectedChannels: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<InventoryItem[]>([]);
  const [channelData, setChannelData] = useState<ChannelData[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData[]>([]);
  const [salesTrendData, setSalesTrendData] = useState<SalesTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (isRetry = false) => {
    try {
      if (isRetry) {
        setRetrying(true);
        setError(null);
      } else {
        setLoading(true);
      }

      // Fetch all dashboard data in parallel for better performance
      const [
        statsData,
        orders,
        inventory,
        orderStatusResult,
        channelResult,
        salesTrendResult
      ] = await Promise.allSettled([
        apiClient.getDashboardStats(),
        apiClient.getRecentOrders(),
        apiClient.getLowStockProducts(),
        apiClient.getOrderStatusData(),
        apiClient.getChannelData(),
        apiClient.getSalesTrendData(),
      ]);

      // Handle results
      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }

      if (orders.status === 'fulfilled') {
        setRecentOrders(orders.value);
      }

      if (inventory.status === 'fulfilled') {
        setLowStockProducts(inventory.value);
      }

      if (orderStatusResult.status === 'fulfilled') {
        setOrderStatusData(orderStatusResult.value);
      }

      if (channelResult.status === 'fulfilled') {
        setChannelData(channelResult.value);
      }

      if (salesTrendResult.status === 'fulfilled') {
        setSalesTrendData(salesTrendResult.value);
      }

      // Check if any requests failed
      const failedRequests = [statsData, orders, inventory, orderStatusResult, channelResult, salesTrendResult]
        .filter(result => result.status === 'rejected');

      if (failedRequests.length > 0) {
        const errorMessage = failedRequests.length === 1
          ? "Failed to load some dashboard data"
          : `Failed to load ${failedRequests.length} data sections`;
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        setError(null);
      }

    } catch (error) {
      const errorMessage = "Failed to load dashboard data";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const handleRetry = () => {
    fetchDashboardData(true);
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your inventory overview.</p>
        </div>
        {(error || retrying) && (
          <Button
            onClick={handleRetry}
            variant="outline"
            size="sm"
            disabled={retrying}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Retry'}
          </Button>
        )}
      </motion.div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}. Some data may not be displayed correctly.
          </AlertDescription>
        </Alert>
      )}

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.5 }}
            >
              <StatCard
                title="Total Products"
                value={stats.totalProducts}
                change="+12% from last month"
                icon={Package}
                trend="up"
              />
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.5 }}
            >
              <StatCard
                title="Active Orders"
                value={stats.activeOrders}
                change="+8% from last week"
                icon={ShoppingCart}
                trend="up"
              />
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.5 }}
            >
              <StatCard
                title="Low Stock Items"
                value={stats.lowStockCount}
                change="Need attention"
                icon={TrendingUp}
                trend="down"
              />
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.5 }}
            >
              <StatCard
                title="Connected Channels"
                value={stats.connectedChannels}
                change={stats.connectedChannels > 0 ? "Active" : "Add channels"}
                icon={Store}
                trend="up"
              />
            </motion.div>
          </>
        )}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card className="transition-shadow duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card className="transition-shadow duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle>Orders by Channel</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : channelData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No channel data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {orderStatusData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No order data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                All products are well stocked!
              </p>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.slice(0, 5).map((item, index) => {
                  // Support multiple possible shapes from backend: prefer explicit fields, then nested objects
                  const productName = (item as any).product_name || (item as any).products?.name || (item as any).products?.title || (item as any).name || 'Unknown Product';
                  const marketplaceName = (item as any).marketplace_name || (item as any).marketplaces?.name || (item as any).marketplace || 'Unknown Channel';

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{productName}</p>
                        <p className="text-xs text-muted-foreground">{marketplaceName}</p>
                      </div>
                      <Badge variant={item.quantity === 0 ? "destructive" : "secondary"} className="ml-2 flex-shrink-0">
                        {item.quantity === 0 ? 'Out of stock' : `${item.quantity} left`}
                      </Badge>
                    </div>
                  );
                })}
                {lowStockProducts.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    And {lowStockProducts.length - 5} more items need attention
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No orders yet. Connect a channel to start receiving orders.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell className="text-muted-foreground">{(order as any).marketplace_name ?? 'Shopify Store'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        order.status === "delivered" ? "default" :
                          order.status === "shipped" ? "secondary" :
                            "outline"
                      }>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
