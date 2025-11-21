import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Download, Play, Clock, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ReportField {
  id: string;
  name: string;
  type: 'metric' | 'dimension';
  category: string;
}

interface ReportConfig {
  name: string;
  fields: ReportField[];
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    categories: string[];
    channels: string[];
  };
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    email: string;
  };
}

const ScheduleReportForm = ({ onSchedule, reportConfig }: { onSchedule: (config: any) => void; reportConfig: ReportConfig }) => {
  const [frequency, setFrequency] = useState('');
  const [time, setTime] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    if (!frequency || !time || !email) {
      toast.error('Please fill in all fields');
      return;
    }

    onSchedule({
      frequency,
      time,
      email,
    });

    // Reset form
    setFrequency('');
    setTime('');
    setEmail('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Frequency</Label>
        <Select value={frequency} onValueChange={setFrequency}>
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Time</Label>
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" placeholder="Enter email address" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Button onClick={handleSubmit} className="w-full">
        Schedule Report
      </Button>
    </div>
  );
};

const AVAILABLE_FIELDS: ReportField[] = [
  // Metrics
  { id: 'total_sales', name: 'Total Sales', type: 'metric', category: 'Sales' },
  { id: 'total_orders', name: 'Total Orders', type: 'metric', category: 'Sales' },
  { id: 'avg_order_value', name: 'Average Order Value', type: 'metric', category: 'Sales' },
  { id: 'total_products', name: 'Total Products', type: 'metric', category: 'Inventory' },
  { id: 'low_stock_items', name: 'Low Stock Items', type: 'metric', category: 'Inventory' },
  { id: 'total_inventory_value', name: 'Total Inventory Value', type: 'metric', category: 'Inventory' },

  // Dimensions
  { id: 'product_name', name: 'Product Name', type: 'dimension', category: 'Products' },
  { id: 'category', name: 'Category', type: 'dimension', category: 'Products' },
  { id: 'channel', name: 'Sales Channel', type: 'dimension', category: 'Sales' },
  { id: 'order_status', name: 'Order Status', type: 'dimension', category: 'Sales' },
  { id: 'date', name: 'Date', type: 'dimension', category: 'Time' },
  { id: 'month', name: 'Month', type: 'dimension', category: 'Time' },
  { id: 'year', name: 'Year', type: 'dimension', category: 'Time' },
];

export default function Reports() {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    fields: [],
    filters: {
      dateRange: { from: null, to: null },
      categories: [],
      channels: [],
    },
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [savedReports, setSavedReports] = useState<ReportConfig[]>([]);
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchChannels();
    loadSavedReports();
    fetchScheduledReports();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/marketplaces');
      const data = await response.json();
      setChannels(data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const loadSavedReports = () => {
    const saved = localStorage.getItem('savedReports');
    if (saved) {
      setSavedReports(JSON.parse(saved));
    }
  };

  const fetchScheduledReports = async () => {
    try {
      const response = await fetch('/api/reports/scheduled');
      const data = await response.json();
      setScheduledReports(data);
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    }
  };

  const saveReport = () => {
    if (!reportConfig.name) {
      toast.error('Please enter a report name');
      return;
    }

    const updatedReports = [...savedReports, reportConfig];
    setSavedReports(updatedReports);
    localStorage.setItem('savedReports', JSON.stringify(updatedReports));
    toast.success('Report saved successfully');
  };

  const loadReport = (report: ReportConfig) => {
    setReportConfig(report);
  };

  const deleteReport = (index: number) => {
    const updatedReports = savedReports.filter((_, i) => i !== index);
    setSavedReports(updatedReports);
    localStorage.setItem('savedReports', JSON.stringify(updatedReports));
    toast.success('Report deleted');
  };

  const onDragStart = (e: React.DragEvent, field: ReportField) => {
    e.dataTransfer.setData('application/json', JSON.stringify(field));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const field = JSON.parse(e.dataTransfer.getData('application/json'));
      if (!reportConfig.fields.find(f => f.id === field.id)) {
        setReportConfig(prev => ({
          ...prev,
          fields: [...prev.fields, field]
        }));
      }
    } catch (error) {
      console.error('Error dropping field:', error);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeField = (fieldId: string) => {
    setReportConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }));
  };

  const addFilter = (type: 'category' | 'channel', value: string) => {
    setReportConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [type === 'category' ? 'categories' : 'channels']: [
          ...prev.filters[type === 'category' ? 'categories' : 'channels'],
          value
        ]
      }
    }));
  };

  const removeFilter = (type: 'category' | 'channel', value: string) => {
    setReportConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [type === 'category' ? 'categories' : 'channels']: prev.filters[type === 'category' ? 'categories' : 'channels'].filter(v => v !== value)
      }
    }));
  };

  const generateReport = async () => {
    if (reportConfig.fields.length === 0) {
      toast.error('Please add at least one field to the report');
      return;
    }

    setIsGenerating(true);
    try {
      // This would be replaced with actual API call to generate custom report
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setReportData(data);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!reportData) {
      toast.error('Please generate a report first');
      return;
    }

    try {
      if (format === 'csv') {
        exportToCSV();
      } else if (format === 'excel') {
        exportToExcel();
      } else if (format === 'pdf') {
        exportToPDF();
      }
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
      console.error(error);
    }
  };

  const exportToCSV = () => {
    // Convert report data to CSV
    const headers = reportConfig.fields.map(field => field.name).join(',');
    const rows = [
      headers,
      // This is a simplified example - in reality you'd map the actual data
      'Sample Data Row 1',
      'Sample Data Row 2'
    ];

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportConfig.name || 'report'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    // For now, export as CSV with .xlsx extension
    // In a real implementation, you'd use a library like xlsx
    exportToCSV();
    toast.info('Excel export uses CSV format. Install xlsx library for proper Excel support.');
  };

  const exportToPDF = () => {
    // For now, create a simple text-based PDF
    // In a real implementation, you'd use jsPDF or similar
    const content = `
Report: ${reportConfig.name || 'Custom Report'}

Fields: ${reportConfig.fields.map(f => f.name).join(', ')}

Filters:
- Date Range: ${reportConfig.filters.dateRange.from ? format(reportConfig.filters.dateRange.from, 'PPP') : 'N/A'} to ${reportConfig.filters.dateRange.to ? format(reportConfig.filters.dateRange.to, 'PPP') : 'N/A'}
- Categories: ${reportConfig.filters.categories.length > 0 ? reportConfig.filters.categories.join(', ') : 'None'}
- Channels: ${reportConfig.filters.channels.length > 0 ? reportConfig.filters.channels.join(', ') : 'None'}

Data:
Sample report data would be displayed here.
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportConfig.name || 'report'}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.info('PDF export creates text file. Install jsPDF library for proper PDF support.');
  };

  const scheduleReport = async (scheduleConfig: any) => {
    try {
      const response = await fetch('/api/reports/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportConfig,
          scheduleConfig,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule report');
      }

      await fetchScheduledReports();
      toast.success('Report scheduled successfully');
    } catch (error) {
      toast.error('Failed to schedule report');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Custom Reports</h1>
        <p className="text-muted-foreground mt-1">Build and schedule custom reports with drag-and-drop</p>
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          {/* Report Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    placeholder="Enter report name"
                    value={reportConfig.name}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveReport} variant="outline">
                    Save Report
                  </Button>
                  <Button onClick={generateReport} disabled={isGenerating}>
                    {isGenerating ? 'Generating...' : 'Generate Report'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Available Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Available Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Sales', 'Inventory', 'Products', 'Time'].map(category => (
                    <div key={category}>
                      <h4 className="font-medium mb-2">{category}</h4>
                      <div className="space-y-2">
                        {AVAILABLE_FIELDS.filter(field => field.category === category).map(field => (
                          <div
                            key={field.id}
                            draggable
                            onDragStart={(e) => onDragStart(e, field)}
                            className="p-2 border rounded cursor-move hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant={field.type === 'metric' ? 'default' : 'secondary'}>
                                {field.type}
                              </Badge>
                              <span className="text-sm">{field.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Report Layout */}
            <Card>
              <CardHeader>
                <CardTitle>Report Layout</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  className="min-h-[300px] border-2 border-dashed border-gray-300 rounded-lg p-4"
                >
                  {reportConfig.fields.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Drag fields here to build your report
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reportConfig.fields.map(field => (
                        <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant={field.type === 'metric' ? 'default' : 'secondary'}>
                              {field.type}
                            </Badge>
                            <span className="text-sm">{field.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeField(field.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {reportConfig.filters.dateRange.from ? format(reportConfig.filters.dateRange.from, "PPP") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={reportConfig.filters.dateRange.from || undefined}
                          onSelect={(date) => setReportConfig(prev => ({
                            ...prev,
                            filters: {
                              ...prev.filters,
                              dateRange: { ...prev.filters.dateRange, from: date || null }
                            }
                          }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {reportConfig.filters.dateRange.to ? format(reportConfig.filters.dateRange.to, "PPP") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={reportConfig.filters.dateRange.to || undefined}
                          onSelect={(date) => setReportConfig(prev => ({
                            ...prev,
                            filters: {
                              ...prev.filters,
                              dateRange: { ...prev.filters.dateRange, to: date || null }
                            }
                          }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <Label>Categories</Label>
                  <Select onValueChange={(value) => addFilter('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add category filter" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {reportConfig.filters.categories.map(categoryId => {
                      const category = categories.find(c => c.id.toString() === categoryId);
                      return category ? (
                        <Badge key={categoryId} variant="secondary" className="cursor-pointer" onClick={() => removeFilter('category', categoryId)}>
                          {category.name} <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Channels */}
                <div className="space-y-2">
                  <Label>Sales Channels</Label>
                  <Select onValueChange={(value) => addFilter('channel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add channel filter" />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.map(channel => (
                        <SelectItem key={channel.id} value={channel.id.toString()}>
                          {channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {reportConfig.filters.channels.map(channelId => {
                      const channel = channels.find(c => c.id.toString() === channelId);
                      return channel ? (
                        <Badge key={channelId} variant="secondary" className="cursor-pointer" onClick={() => removeFilter('channel', channelId)}>
                          {channel.name} <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Actions */}
          {reportData && (
            <Card>
              <CardHeader>
                <CardTitle>Report Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button onClick={() => exportReport('csv')} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button onClick={() => exportReport('excel')} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                  <Button onClick={() => exportReport('pdf')} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Clock className="mr-2 h-4 w-4" />
                        Schedule Report
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule Report</DialogTitle>
                      </DialogHeader>
                      <ScheduleReportForm onSchedule={scheduleReport} reportConfig={reportConfig} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Preview */}
          {reportData && (
            <Card>
              <CardHeader>
                <CardTitle>Report Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Report preview would be displayed here based on the selected fields and filters.
                  This is a placeholder for the actual report visualization.
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          <Tabs defaultValue="saved-reports" className="w-full">
            <TabsList>
              <TabsTrigger value="saved-reports">Saved Reports</TabsTrigger>
              <TabsTrigger value="scheduled-reports">Scheduled Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="saved-reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  {savedReports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No saved reports yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {savedReports.map((report, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded">
                          <div>
                            <h4 className="font-medium">{report.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {report.fields.length} fields • {report.filters.categories.length + report.filters.channels.length} filters
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => loadReport(report)} variant="outline" size="sm">
                              Load
                            </Button>
                            <Button onClick={() => deleteReport(index)} variant="outline" size="sm">
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scheduled-reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  {scheduledReports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No scheduled reports yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scheduledReports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-4 border rounded">
                          <div>
                            <h4 className="font-medium">{report.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {report.frequency} at {report.schedule_time} • {report.email}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}