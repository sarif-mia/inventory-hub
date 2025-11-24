import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { apiClient } from "@/shared/utils/api";

export default function AddChannel() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    store_url: "",
    api_key: "",
  });
  const navigate = useNavigate();
  const location = useLocation();
  const channelType = location.state?.channelType || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const channelTypeToUse = formData.type || channelType;
    if (!formData.name || !channelTypeToUse) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      // For Shopify, create marketplace and trigger sync
      if (channelTypeToUse === 'shopify') {
        if (!formData.store_url || !formData.api_key) {
          toast.error("Please enter your Shopify store URL and Admin API token");
          return;
        }

        toast.info("Connecting to Shopify...");

        try {
          // Create the marketplace entry first with user credentials
          const marketplace = await apiClient.createMarketplace({
            name: formData.name,
            type: 'shopify',
            store_url: formData.store_url,
            settings: {
              adminApiToken: formData.api_key
            }
          });

          toast.info("Shopify marketplace created! Syncing data...");

          // Trigger server-side sync
          const syncResult = await apiClient.syncMarketplace(marketplace.id);
          toast.success(`Shopify connected! ${syncResult.message}`);

        } catch (error) {
          console.error('Shopify connection/sync error:', error);
          toast.error(`Shopify connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      } else if (channelTypeToUse === 'myntra') {
        // Check if Myntra channel already exists
        const existingMarketplaces = await apiClient.getMarketplaces();
        const existingMyntra = existingMarketplaces.find(m => m.type === 'myntra');

        if (existingMyntra) {
          toast.error("A Myntra channel already exists. You can only have one Myntra integration.");
          return;
        }

        // For Myntra, store credentials in settings
        const settings = {
          merchantId: formData.store_url,
          secretKey: formData.api_key,
          warehouseId: 'A-129',
          returnWarehouseToFacilityCode: {}
        };

        await apiClient.createMarketplace({
          name: formData.name,
          type: 'myntra',
          store_url: undefined,
          settings: settings
        });

        toast.success("Myntra channel connected successfully!");
      } else {
        // For other channels, just create the marketplace entry
        await apiClient.createMarketplace({
          name: formData.name,
          type: channelTypeToUse,
          store_url: formData.store_url || undefined,
        });

        toast.success("Channel connected successfully!");
      }

      navigate("/channels");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect channel";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Sales Channel</h1>
        <p className="text-muted-foreground mt-1">Connect a new marketplace to your inventory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Channel Details</CardTitle>
          <CardDescription>Enter your marketplace credentials to connect</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Channel Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. My Amazon Store"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Channel Type *</Label>
              <Input
                id="type"
                value={formData.type || channelType}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="e.g. amazon, shopify, ebay"
                required
              />
            </div>

            {(formData.type || channelType) === 'myntra' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="store_url">Merchant ID *</Label>
                  <Input
                    id="store_url"
                    value={formData.store_url}
                    onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
                    placeholder="EELALSSS"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_key">Secret Key *</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="Your secret key"
                    required
                  />
                </div>
              </>
            )}

            {(formData.type || channelType) !== 'shopify' && (formData.type || channelType) !== 'myntra' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="store_url">Store URL</Label>
                  <Input
                    id="store_url"
                    value={formData.store_url}
                    onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
                    placeholder="https://yourstore.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key (Optional)</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="Your API key"
                  />
                  <p className="text-xs text-muted-foreground">
                    API keys are encrypted and stored securely
                  </p>
                </div>
              </>
            )}

            {(formData.type || channelType) === 'shopify' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="store_url">Shopify Store URL *</Label>
                  <Input
                    id="store_url"
                    value={formData.store_url}
                    onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
                    placeholder="your-store.myshopify.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your Shopify store URL (e.g., your-store.myshopify.com)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_key">Admin API Access Token *</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Shopify Admin API access token (starts with shpat_)
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Connecting..." : "Connect Channel"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/channels")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
