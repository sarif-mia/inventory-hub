import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  CalendarIcon,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
  ScatterChart,
  ZAxis,
  ReferenceLine,
} from "recharts";
import { Calendar } from "@/shared/components/ui/calendar";
import { format, subDays, subMonths, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { toast } from "sonner";
import { apiClient } from "@/shared/utils/api";
import { DateRange } from "react-day-picker";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00c4ff', '#ff00ff'];

const predefinedRanges = [
  {
    label: "Last 7 days",
    range: { from: subDays(new Date(), 7), to: new Date() },
  },
  {
    label: "Last 30 days",
    range: { from: subDays(new Date(), 30), to: new Date() },
  },
  {
    label: "Last 3 months",
    range: { from: subMonths(new Date(), 3), to: new Date() },
  },
  {
    label: "Last 6 months",
    range: { from: subMonths(new Date(), 6), to: new Date() },
  },
  {
    label: "This year",
    range: { from: new Date(new Date().getFullYear(), 0, 1), to: new Date() },
  },
];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedMetric, setSelectedMetric] = useState<string>("revenue");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [chartType, setChartType] = useState<string>("line");
  const [analyticsData, setAnalyticsData] = useState<{
    salesData: { date: string; sales: number; orders: number; revenue: number; profit: number }[];
    topProducts: { name: string; quantity: number; revenue: number; profit: number; growth: number }[];
    marketplaceData: { name: string; orders: number; revenue: number; profit: number; growth: number }[];
    orderStatusData: { name: string; value: number; color: string }[];
    inventoryHealth: {
      total_inventory_items: number;
      in_stock_count: number;
      low_stock_count: number;
      out_of_stock_count: number;
      avg_stock_level: number;
    };
    summary: {
      totalRevenue: number;
      totalOrders: number;
      avgOrderValue: number;
      inventoryEfficiency: number;
      totalProfit: number;
      revenueGrowth: number;
      orderGrowth: number;
      topProduct: string;
      topProductSales: number;
    };
    productPerformance: { name: string; sales: number; revenue: number; efficiency: number; trend: 'up' | 'down' | 'stable' }[];
    channelComparison: { channel: string; revenue: number; orders: number; aov: number; conversion: number }[];
  } | null>(null);

 const fetchAnalyticsData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await apiClient.getAnalytics();

      // Simulate enhanced data with more metrics
      const enhancedData = {
        ...data,
        salesData: data.salesData?.map(item => ({
          ...item,
          revenue: item.sales * 1.5, // Simulate revenue
          profit: item.sales * 0.3, // 30% profit margin simulation
        })) || [],
        topProducts: data.topProducts?.map(item => ({
          ...item,
          growth: Math.random() * 40 - 20, // -20% to +20% growth
        })) || [],
        marketplaceData: data.marketplaceData?.map(item => ({
          ...item,
          growth: Math.random() * 30 - 15, // -15% to +15% growth
        })) || [],
        productPerformance: generateProductPerformance(),
        channelComparison: generateChannelComparison(),
        orderStatusData: data.orderStatusData?.map((item, index) => ({
          ...item,
          color: COLORS[index % COLORS.length],
        })) || [],
        summary: {
          ...data.summary,
          totalProfit: (data.summary.totalRevenue || 0) * 0.3,
          revenueGrowth: Math.random() * 40 - 10,
          orderGrowth: Math.random() * 30 - 5,
        },
        inventoryHealth: data.inventoryHealth,
      };

      setAnalyticsData(enhancedData);
    } catch (error) {
      toast.error("Failed to load analytics data");
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedMetric, selectedChannel, fetchAnalyticsData]);

  const generateProductPerformance = () => {
    const products = ['Premium Widget', 'Standard Product', 'Deluxe Item', 'Basic Component', 'Luxury Brand'];
    return products.map(name => ({
      name,
      sales: Math.floor(Math.random() * 1000) + 100,
      revenue: Math.floor(Math.random() * 50000) + 5000,
      efficiency: Math.floor(Math.random() * 100) + 50,
      trend: (['up', 'down', 'stable'] as const)[Math.floor(Math.random() * 3)],
    }));
  };

  const generateChannelComparison = () => {
    const channels = ['Shopify', 'Myntra', 'Amazon', 'Manual'];
    return channels.map(channel => ({
      channel,
      revenue: Math.floor(Math.random() * 100000) + 20000,
      orders: Math.floor(Math.random() * 1000) + 100,
      aov: Math.floor(Math.random() * 500) + 100,
      conversion: Math.random() * 10 + 2,
    }));
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
    }
  };

  const handlePredefinedRange = (range: DateRange) => {
    setDateRange(range);
  };

  const filterDataByDateRange = useCallback((data: any[]) => {
    if (!dateRange.from || !dateRange.to) return data;
    
    return data.filter(item => {
      const itemDate = new Date(item.date);
      return isWithinInterval(itemDate, {
        start: startOfDay(dateRange.from!),
        end: endOfDay(dateRange.to!),
      });
    });
  }, [dateRange]);

  const exportData = () => {
    if (!analyticsData) return;
    
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success("Analytics data exported successfully");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Advanced Analytics</h1>
            <p className="text-muted-foreground mt-1">Interactive insights and performance metrics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold mb-4">Advanced Analytics</h1>
          <p className="text-muted-foreground mb-4">Failed to load analytics data</p>
          <Button onClick={() => fetchAnalyticsData()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const filteredSalesData = filterDataByDateRange(analyticsData.salesData);

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground mt-1">Interactive insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchAnalyticsData(true)} variant="outline" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Filters and Controls */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
                <div className="p-3 border-t">
                  <div className="space-y-2">
                    {predefinedRanges.map((range) => (
                      <Button
                        key={range.label}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handlePredefinedRange(range.range)}
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Primary Metric</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="profit">Profit</SelectItem>
                <SelectItem value="conversion">Conversion Rate</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Channel Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="shopify">Shopify</SelectItem>
                <SelectItem value="myntra">Myntra</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Chart Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-4 w-4" />
                    Line Chart
                  </div>
                </SelectItem>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Bar Chart
                  </div>
                </SelectItem>
                <SelectItem value="area">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Area Chart
                  </div>
                </SelectItem>
                <SelectItem value="pie">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Pie Chart
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced KPI Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.summary.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {analyticsData.summary.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={analyticsData.summary.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(analyticsData.summary.revenueGrowth).toFixed(1)}%
              </span>
              vs last period
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.summary.totalOrders.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {analyticsData.summary.orderGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={analyticsData.summary.orderGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(analyticsData.summary.orderGrowth).toFixed(1)}%
              </span>
              vs last period
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <PieChart className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.summary.avgOrderValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per order average
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.summary.totalProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              30% margin assumed
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Chart Visualization */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sales & Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              {chartType === 'line' && (
                <RechartsLineChart data={filteredSalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: any, name: string) => [
                      `$${Number(value).toLocaleString()}`,
                      name === 'sales' ? 'Sales' : name === 'revenue' ? 'Revenue' : name === 'profit' ? 'Profit' : 'Orders'
                    ]}
                    labelFormatter={(label) => format(new Date(label), 'PPP')}
                  />
                  {selectedMetric === 'revenue' && (
                    <>
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                      <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#10b981', r: 3 }} />
                    </>
                  )}
                  {selectedMetric === 'orders' && (
                    <Line type="monotone" dataKey="orders" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} />
                  )}
                </RechartsLineChart>
              )}
              
              {chartType === 'bar' && (
                <ComposedChart data={filteredSalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
                </ComposedChart>
              )}
              
              {chartType === 'area' && (
                <AreaChart data={filteredSalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stackId="2" 
                    stroke="#10b981" 
                    fill="url(#colorProfit)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Channel Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={analyticsData.channelComparison} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="channel" type="category" tick={{ fontSize: 12 }} width={80} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any, name: string) => [
                    name === 'revenue' ? `$${Number(value).toLocaleString()}` : Number(value),
                    name === 'revenue' ? 'Revenue' : name === 'orders' ? 'Orders' : name === 'aov' ? 'Avg Order Value' : 'Conversion Rate'
                  ]}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {analyticsData.channelComparison.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Additional Analytics */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Product Performance Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  dataKey="sales" 
                  name="Sales Volume"
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="revenue" 
                  name="Revenue"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <ZAxis type="number" dataKey="efficiency" range={[60, 400]} name="Efficiency" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any, name: string) => [
                    name === 'revenue' ? `$${Number(value).toLocaleString()}` : value,
                    name === 'revenue' ? 'Revenue' : name === 'efficiency' ? 'Efficiency %' : 'Sales'
                  ]}
                />
                <Scatter data={analyticsData.productPerformance} fill="#8884d8">
                  {analyticsData.productPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.trend === 'up' ? '#10b981' : 
                      entry.trend === 'down' ? '#ef4444' : '#f59e0b'
                    } />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products by Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topProducts.slice(0, 5).map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.quantity.toLocaleString()} units sold
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${product.revenue.toLocaleString()}</div>
                    <div className="flex items-center gap-1 text-sm">
                      {product.growth >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={product.growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {Math.abs(product.growth).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Inventory Health Details */}
      {analyticsData.inventoryHealth && (
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">In Stock</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{analyticsData.inventoryHealth.in_stock_count}</div>
                    <div className="text-sm text-green-600">
                      {((analyticsData.inventoryHealth.in_stock_count / analyticsData.inventoryHealth.total_inventory_items) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium">Low Stock</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{analyticsData.inventoryHealth.low_stock_count}</div>
                    <div className="text-sm text-yellow-600">
                      {((analyticsData.inventoryHealth.low_stock_count / analyticsData.inventoryHealth.total_inventory_items) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium">Out of Stock</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{analyticsData.inventoryHealth.out_of_stock_count}</div>
                    <div className="text-sm text-red-600">
                      {((analyticsData.inventoryHealth.out_of_stock_count / analyticsData.inventoryHealth.total_inventory_items) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={analyticsData.orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
