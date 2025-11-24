import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
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
import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/shared/utils/api";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<{
    salesData: { date: string; sales: number; orders: number }[];
    topProducts: { name: string; quantity: number; revenue: number }[];
    marketplaceData: { name: string; orders: number; revenue: number }[];
    orderStatusData: { name: string; value: number }[];
    inventoryHealth?: {
      total_inventory_items: number | string;
      in_stock_count: number | string;
      low_stock_count: number | string;
      out_of_stock_count: number | string;
      avg_stock_level: number | string;
    };
    summary: {
      totalRevenue: number;
      totalOrders: number;
      topProduct: string;
      topProductSales: number;
      avgOrderValue?: number;
      inventoryEfficiency?: number;
    };
  } | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAnalytics();
      setAnalyticsData(data);
    } catch (error) {
      toast.error("Failed to load analytics data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Insights and performance metrics</p>
        </div>
        <div className="text-center py-8 text-muted-foreground">Loading analytics data...</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Insights and performance metrics</p>
        </div>
        <div className="text-center py-8 text-muted-foreground">Failed to load analytics data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.summary.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.summary.totalOrders > 0 ? 'From completed orders' : 'No revenue yet'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.summary.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.summary.totalOrders > 0 ? 'Completed orders' : 'No orders yet'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.summary.avgOrderValue ? analyticsData.summary.avgOrderValue.toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.summary.totalOrders > 0 ? 'Per order average' : 'No orders yet'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Health</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.summary.inventoryEfficiency || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.inventoryHealth ? `${analyticsData.inventoryHealth.in_stock_count} of ${analyticsData.inventoryHealth.total_inventory_items} in stock` : 'No inventory data'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.marketplaceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.inventoryHealth ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">In Stock</span>
                  <span className="text-sm text-green-600">{analyticsData.inventoryHealth.in_stock_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Low Stock</span>
                  <span className="text-sm text-yellow-600">{analyticsData.inventoryHealth.low_stock_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Out of Stock</span>
                  <span className="text-sm text-red-600">{analyticsData.inventoryHealth.out_of_stock_count}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Stock Level</span>
                    <span className="text-sm">{typeof analyticsData.inventoryHealth.avg_stock_level === 'number' ? analyticsData.inventoryHealth.avg_stock_level.toFixed(1) : analyticsData.inventoryHealth.avg_stock_level}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No inventory data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.orderStatusData.map((entry, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No orders to display
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {analyticsData.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
