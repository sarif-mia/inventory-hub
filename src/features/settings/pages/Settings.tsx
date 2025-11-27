import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useToast } from "@/shared/hooks/use-toast";
import { apiClient } from "@/shared/utils/api";

export default function Settings() {
  const { toast } = useToast();
  const [currency, setCurrency] = useState<string>("USD");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const value = await apiClient.getSetting('currency');
      if (value) {
        setCurrency(value);
      }
    } catch (error) {
      console.error('Failed to load currency setting:', error);
      // Keep default USD
    }
  };

  const updateCurrency = async (newCurrency: string) => {
    setLoading(true);
    try {
      await apiClient.updateSetting('currency', newCurrency);
      setCurrency(newCurrency);
      toast({
        title: "Success",
        description: "Currency updated successfully",
      });
    } catch (error) {
      console.error('Failed to update currency:', error);
      toast({
        title: "Error",
        description: "Failed to update currency",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currencies = [
    { value: "USD", label: "US Dollar ($)", symbol: "$" },
    { value: "EUR", label: "Euro (€)", symbol: "€" },
    { value: "GBP", label: "British Pound (£)", symbol: "£" },
    { value: "JPY", label: "Japanese Yen (¥)", symbol: "¥" },
    { value: "BDT", label: "Bangladeshi Taka (৳)", symbol: "৳" },
    { value: "INR", label: "Indian Rupee (₹)", symbol: "₹" },
    { value: "CAD", label: "Canadian Dollar (C$)", symbol: "C$" },
    { value: "AUD", label: "Australian Dollar (A$)", symbol: "A$" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and application preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input placeholder="John" />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input placeholder="Doe" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="john@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input placeholder="Your Company Inc." />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency Settings</CardTitle>
          <CardDescription>Choose your preferred currency for the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency-select">Currency</Label>
            <Select value={currency} onValueChange={updateCurrency} disabled={loading}>
              <SelectTrigger id="currency-select">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Current currency: {currencies.find(c => c.value === currency)?.symbol || '$'} ({currency})
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Low Stock Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Order Updates</p>
              <p className="text-sm text-muted-foreground">Receive notifications for new orders</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Marketplace Sync</p>
              <p className="text-sm text-muted-foreground">Get alerts when sync completes</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Manage API keys and connections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Amazon API Key</Label>
            <Input type="password" placeholder="••••••••••••" />
          </div>
          <div className="space-y-2">
            <Label>eBay API Token</Label>
            <Input type="password" placeholder="••••••••••••" />
          </div>
          <div className="space-y-2">
            <Label>Shopify Store URL</Label>
            <Input placeholder="yourstore.myshopify.com" />
          </div>
          <Button variant="outline">Update Integrations</Button>
        </CardContent>
      </Card>
    </div>
  );
}
