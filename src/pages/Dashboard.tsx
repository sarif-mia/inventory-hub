import { useEffect, useState } from "react";
import { StatCard } from "@/components/Dashboard/StatCard";
import { Package, ShoppingCart, DollarSign, TrendingUp, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  marketplaces?: { name: string };
  status: string;
  total: number;
}

interface InventoryItem {
  products?: { name: string };
  marketplaces?: { name: string };
  quantity: number;
}
// API functions for fetching data
const fetchDashboardStats = async () => {
  const response = await fetch('/api/dashboard/stats');
  if (!response.ok) throw new Error('Failed to fetch dashboard stats');
  return response.json();
};

const fetchRecentOrders = async () => {
  const response = await fetch('/api/dashboard/recent-orders');
  if (!response.ok) throw new Error('Failed to fetch recent orders');
  return response.json();
};

const fetchLowStockProducts = async () => {
  const response = await fetch('/api/dashboard/low-stock');
  if (!response.ok) throw new Error('Failed to fetch low stock products');
  return response.json();
};

const fetchOrderStatusData = async () => {
  const response = await fetch('/api/dashboard/order-status');
  if (!response.ok) throw new Error('Failed to fetch order status data');
  return response.json();
};

const fetchChannelData = async () => {
  const response = await fetch('/api/dashboard/channels');
  if (!response.ok) throw new Error('Failed to fetch channel data');
  return response.json();
};

const fetchSalesTrendData = async () => {
  const response = await fetch('/api/dashboard/sales-trend');
  if (!response.ok) throw new Error('Failed to fetch sales trend data');
  return response.json();
};
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    lowStockCount: 0,
    connectedChannels: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<InventoryItem[]>([]);
  const [channelData, setChannelData] = useState<{ name: string; value: number }[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<{ name: string; value: number }[]>([]);
  const [salesTrendData, setSalesTrendData] = useState<{ day: string; sales: number }[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const statsData = await fetchDashboardStats();
      setStats({
        totalProducts: statsData.totalProducts,
        activeOrders: statsData.activeOrders,
        lowStockCount: statsData.lowStockCount,
        connectedChannels: statsData.connectedChannels,
      });

      // Fetch recent orders
      const orders = await fetchRecentOrders();
      setRecentOrders(orders);

      // Fetch low stock products
      const inventory = await fetchLowStockProducts();
      setLowStockProducts(inventory);

      // Fetch order status data
      const orderStatusResult = await fetchOrderStatusData();
      setOrderStatusData(
        orderStatusResult.map((item: { status: string; count: string }) => ({
          name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
          value: parseInt(item.count)
        }))
      );

      // Fetch channel data
      const channelResult = await fetchChannelData();
      setChannelData(
        channelResult.map((item: { name: string; order_count: string }) => ({
          name: item.name,
          value: parseInt(item.order_count)
        }))
      );

      // Fetch sales trend data
      const salesTrendResult = await fetchSalesTrendData();
      setSalesTrendData(
        salesTrendResult.map((item: { day: string; sales: string }) => ({
          day: item.day,
          sales: parseFloat(item.sales)
        }))
      );

    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your inventory overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toString()}
          change="+12% from last month"
          icon={Package}
          trend="up"
        />
        <StatCard
          title="Active Orders"
          value={stats.activeOrders.toString()}
          change="+8% from last week"
          icon={ShoppingCart}
          trend="up"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount.toString()}
          change="Need attention"
          icon={TrendingUp}
          trend="down"
        />
        <StatCard
          title="Connected Channels"
          value={stats.connectedChannels.toString()}
          change={stats.connectedChannels > 0 ? "Active" : "Add channels"}
          icon={Store}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
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

        <Card>
          <CardHeader>
            <CardTitle>Orders by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            {channelData.length === 0 ? (
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
      </div>

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
                {lowStockProducts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.products?.name ?? ''}</p>
                      <p className="text-sm text-muted-foreground">{item.marketplaces?.name ?? ''}</p>
                    </div>
                    <Badge variant="destructive">{item.quantity} left</Badge>
                  </div>
                ))}
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
                    <TableCell className="text-muted-foreground">{order.marketplaces?.name ?? ''}</TableCell>
                    <TableCell>
                      <Badge variant={
                        order.status === "delivered" ? "default" :
                          order.status === "shipped" ? "secondary" :
                            "outline"
                      }>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">${order.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}