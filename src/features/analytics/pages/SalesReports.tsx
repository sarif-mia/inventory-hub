import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  CalendarIcon,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Zap,
  DollarSign,
  ShoppingCart,
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
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart as RechartsComposedChart,
} from "recharts";
import { Calendar } from "@/shared/components/ui/calendar";
import { format, subDays, subMonths, startOfDay, endOfDay, isWithinInterval, addDays, addMonths, eachDayOfInterval, eachMonthOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { apiClient } from "@/shared/utils/api";
import { DateRange } from "react-day-picker";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
const FORECAST_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

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

interface SalesData {
  date: string;
  actual: number;
  forecast?: number;
  confidence?: number;
  channel: string;
  category: string;
}

export default function SalesReports() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 90),
    to: new Date(),
  });
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [forecastPeriod, setForecastPeriod] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<string>("overview");

  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [forecastData, setForecastData] = useState<SalesData[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [trendAnalysis, setTrendAnalysis] = useState<any>(null);

  useEffect(() => {
    fetchSalesData();
  }, [dateRange, selectedChannel, selectedCategory]);

  const fetchSalesData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Generate simulated sales data for demonstration
      const generatedSalesData = generateSalesData();
      const generatedForecastData = generateForecastData(generatedSalesData);
      const generatedComparisonData = generateComparisonData();
      const generatedTrendAnalysis = generateTrendAnalysis();

      setSalesData(generatedSalesData);
      setForecastData(generatedForecastData);
      setComparisonData(generatedComparisonData);
      setTrendAnalysis(generatedTrendAnalysis);
    } catch (error) {
      toast.error("Failed to load sales reports data");
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, selectedChannel, selectedCategory]);

  const generateSalesData = (): SalesData[] => {
    const data: SalesData[] = [];
    const channels = ['Shopify', 'Myntra', 'Amazon', 'Manual'];
    const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books'];
    
    if (!dateRange.from || !dateRange.to) return [];

    const days = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to
    });

    days.forEach(day => {
      channels.forEach(channel => {
        categories.forEach(category => {
          const baseValue = Math.random() * 5000 + 1000;
          const trend = Math.sin(days.indexOf(day) / 7) * 0.2 + 1; // Weekly seasonality
          const randomFactor = 0.7 + Math.random() * 0.6; // Random variation
          
          data.push({
            date: format(day, 'yyyy-MM-dd'),
            actual: Math.floor(baseValue * trend * randomFactor),
            channel,
            category,
          });
        });
      });
    });

    // Filter by selected channel and category
    let filteredData = data;
    if (selectedChannel !== "all") {
      filteredData = filteredData.filter(item => item.channel === selectedChannel);
    }
    if (selectedCategory !== "all") {
      filteredData = filteredData.filter(item => item.category === selectedCategory);
    }

    return filteredData;
  };

  const generateForecastData = (salesData: SalesData[]): SalesData[] => {
    const forecast: SalesData[] = [];
    const channels = ['Shopify', 'Myntra', 'Amazon', 'Manual'];
    const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books'];
    
    const lastDate = dateRange.to || new Date();
    
    for (let i = 1; i <= forecastPeriod; i++) {
      const forecastDate = addDays(lastDate, i);
      
      channels.forEach(channel => {
        categories.forEach(category => {
          const baseValue = Math.random() * 5000 + 1000;
          const trend = 1 + (i / forecastPeriod) * 0.1; // Slight upward trend
          const randomFactor = 0.8 + Math.random() * 0.4;
          
          forecast.push({
            date: format(forecastDate, 'yyyy-MM-dd'),
            actual: Math.floor(baseValue * trend * randomFactor),
            forecast: Math.floor(baseValue * trend * randomFactor),
            confidence: 70 + Math.random() * 25, // 70-95% confidence
            channel,
            category,
          });
        });
      });
    }

    // Filter by selected channel and category
    let filteredForecast = forecast;
    if (selectedChannel !== "all") {
      filteredForecast = filteredForecast.filter(item => item.channel === selectedChannel);
    }
    if (selectedCategory !== "all") {
      filteredForecast = filteredForecast.filter(item => item.category === selectedCategory);
    }

    return filteredForecast;
  };

  const generateComparisonData = () => {
    const periods = ['Current Period', 'Previous Period', 'Same Period Last Year'];
    return periods.map(period => ({
      period,
      revenue: Math.floor(Math.random() * 100000) + 50000,
      orders: Math.floor(Math.random() * 1000) + 500,
      conversion: Math.random() * 10 + 2,
      aov: Math.floor(Math.random() * 500) + 100,
      growth: Math.random() * 40 - 10,
    }));
  };

  const generateTrendAnalysis = () => {
    const trends = ['Strong Growth', 'Moderate Growth', 'Stable', 'Declining', 'Volatile'];
    const metrics = ['Revenue', 'Orders', 'Conversion Rate', 'AOV', 'Customer Retention'];
    
    return metrics.map(metric => ({
      metric,
      trend: trends[Math.floor(Math.random() * trends.length)],
      value: Math.random() * 100,
      change: Math.random() * 40 - 20,
      confidence: 70 + Math.random() * 25,
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

  const aggregateData = (data: SalesData[], groupBy: 'date' | 'channel' | 'category') => {
    const aggregated = data.reduce((acc, item) => {
      const key = groupBy === 'date' ? item.date : groupBy === 'channel' ? item.channel : item.category;
      if (!acc[key]) {
        acc[key] = { key, actual: 0, forecast: 0, count: 0 };
      }
      acc[key].actual += item.actual;
      acc[key].forecast += item.forecast || 0;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(aggregated).map((item: any) => ({
      ...item,
      avg: Math.floor(item.actual / item.count),
      label: groupBy === 'date' ? format(new Date(item.key), 'MMM dd') : item.key,
    }));
  };

  const exportData = () => {
    const exportData = {
      salesData,
      forecastData,
      comparisonData,
      trendAnalysis,
      dateRange: {
        from: dateRange.from?.toISOString(),
        to: dateRange.to?.toISOString(),
      },
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `sales-reports-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success("Sales reports data exported successfully");
  };

  const filteredSalesData = salesData.filter(item => {
    if (selectedChannel !== "all" && item.channel !== selectedChannel) return false;
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    return true;
  });

  const aggregatedByDate = aggregateData([...filteredSalesData, ...forecastData], 'date');
  const aggregatedByChannel = aggregateData(filteredSalesData, 'channel');
  const aggregatedByCategory = aggregateData(filteredSalesData, 'category');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales Reports</h1>
            <p className="text-muted-foreground mt-1">Comprehensive sales analysis and forecasting</p>
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

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold">Sales Reports</h1>
          <p className="text-muted-foreground mt-1">Comprehensive sales analysis and forecasting</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchSalesData(true)} variant="outline" disabled={refreshing}>
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
            <CardTitle className="text-sm font-medium">Channel Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="Shopify">Shopify</SelectItem>
                <SelectItem value="Myntra">Myntra</SelectItem>
                <SelectItem value="Amazon">Amazon</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Category Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Books">Books</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Forecast Period</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={forecastPeriod.toString()} onValueChange={(value) => setForecastPeriod(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
                <SelectItem value="180">180 Days</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sales Overview Cards */}
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
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${filteredSalesData.reduce((sum, item) => sum + item.actual, 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+12.5%</span>
              vs previous period
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecast Revenue</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${forecastData.reduce((sum, item) => sum + (item.forecast || 0), 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Zap className="h-3 w-3 text-purple-500" />
              <span className="text-purple-500">Next {forecastPeriod} days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+15.3%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">Above target</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Sales Day</CardTitle>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BarChart3 className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Fri</div>
            <div className="text-xs text-muted-foreground mt-1">
              {format(new Date(), 'MMM dd, yyyy')}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Analytics Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Trend & Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <RechartsLineChart data={aggregatedByDate}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                        formatter={(value: any, name: string) => [
                          `$${Number(value).toLocaleString()}`,
                          name === 'actual' ? 'Actual' : 'Forecast'
                        ]}
                      />
                      <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                      <Line type="monotone" dataKey="forecast" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#ef4444', r: 3 }} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Channel Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={aggregatedByChannel}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                        formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                      />
                      <Bar dataKey="actual" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {aggregatedByChannel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={aggregatedByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ label, value }) => `${label}: $${value.toLocaleString()}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="actual"
                      >
                        {aggregatedByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>

                  <div className="space-y-4">
                    {aggregatedByCategory.map((category, index) => (
                      <div key={category.label} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <div>
                            <div className="font-medium">{category.label}</div>
                            <div className="text-sm text-muted-foreground">
                              Avg: ${category.avg.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${category.actual.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">
                            {((category.actual / aggregatedByCategory.reduce((sum, cat) => sum + cat.actual, 0)) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecasting" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Sales Forecasting Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={[...aggregatedByDate, ...forecastData.slice(0, 30).map(f => ({
                    ...f,
                    label: format(new Date(f.date), 'MMM dd'),
                    actual: 0, // Hide actual values for future dates
                  }))]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: any, name: string) => [
                        value > 0 ? `$${Number(value).toLocaleString()}` : 'N/A',
                        name === 'actual' ? 'Historical' : 'Forecast'
                      ]}
                    />
                    <defs>
                      <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#historicalGradient)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="forecast" 
                      stroke="#ef4444" 
                      fillOpacity={1} 
                      fill="url(#forecastGradient)" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Forecast Confidence Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={[
                      { subject: 'High Confidence', A: 85, fullMark: 100 },
                      { subject: 'Medium Confidence', A: 70, fullMark: 100 },
                      { subject: 'Low Confidence', A: 45, fullMark: 100 },
                      { subject: 'Seasonal Trends', A: 90, fullMark: 100 },
                      { subject: 'Market Factors', A: 65, fullMark: 100 },
                      { subject: 'External Events', A: 30, fullMark: 100 },
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                      <Radar name="Confidence" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Forecast Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Revenue Forecast Accuracy</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Volume Forecast Accuracy</span>
                        <span className="font-medium">88%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Trend Prediction</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Seasonal Patterns</span>
                        <span className="font-medium">95%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Period Comparison Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? `$${Number(value).toLocaleString()}` : 
                        name === 'growth' ? `${Number(value).toFixed(1)}%` : Number(value),
                        name === 'revenue' ? 'Revenue' : 
                        name === 'orders' ? 'Orders' :
                        name === 'conversion' ? 'Conversion Rate' :
                        name === 'aov' ? 'AOV' : 'Growth %'
                      ]}
                    />
                    <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#10b981" strokeWidth={3} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {comparisonData.map((period, index) => (
                <Card key={period.period}>
                  <CardHeader>
                    <CardTitle className="text-lg">{period.period}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            ${period.revenue.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">Revenue</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {period.orders.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">Orders</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-xl font-bold text-purple-600">
                            ${period.aov}
                          </div>
                          <div className="text-sm text-muted-foreground">AOV</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-xl font-bold text-orange-600">
                            {period.conversion.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Conversion</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
                        {period.growth >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`font-medium ${period.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {Math.abs(period.growth).toFixed(1)}% Growth
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trend Analysis Matrix</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trendAnalysis.map((trend: any, index: number) => (
                      <div key={trend.metric} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{trend.metric}</div>
                          <div className="text-sm text-muted-foreground">
                            Confidence: {trend.confidence.toFixed(0)}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            trend.trend === 'Strong Growth' ? 'bg-green-100 text-green-800' :
                            trend.trend === 'Moderate Growth' ? 'bg-blue-100 text-blue-800' :
                            trend.trend === 'Stable' ? 'bg-gray-100 text-gray-800' :
                            trend.trend === 'Declining' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {trend.change >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {trend.trend}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {Math.abs(trend.change).toFixed(1)}% change
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Radar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={trendAnalysis.map((trend: any) => ({
                      metric: trend.metric,
                      value: trend.value,
                      fullMark: 100,
                    }))}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                      <Radar name="Performance" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Seasonal Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={[
                    { month: 'Jan', sales: 4000, trend: 2400 },
                    { month: 'Feb', sales: 3000, trend: 2210 },
                    { month: 'Mar', sales: 5000, trend: 2290 },
                    { month: 'Apr', sales: 4500, trend: 2500 },
                    { month: 'May', sales: 6000, trend: 2700 },
                    { month: 'Jun', sales: 5500, trend: 2800 },
                    { month: 'Jul', sales: 7000, trend: 3000 },
                    { month: 'Aug', sales: 6500, trend: 3100 },
                    { month: 'Sep', sales: 5000, trend: 2900 },
                    { month: 'Oct', sales: 4500, trend: 2700 },
                    { month: 'Nov', sales: 6000, trend: 3200 },
                    { month: 'Dec', sales: 8000, trend: 3500 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar dataKey="sales" fill="#3b82f6" opacity={0.7} />
                    <Line type="monotone" dataKey="trend" stroke="#10b981" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}