import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

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
        toast.info("Connecting to Shopify...");

        try {
          // Create the marketplace entry first
          const createResponse = await fetch('/api/marketplaces', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: formData.name,
              type: 'shopify',
              store_url: formData.store_url || 'sarifmia.myshopify.com', // Default Shopify store URL
            }),
          });

          if (!createResponse.ok) {
            throw new Error('Failed to create marketplace entry');
          }

          const marketplace = await createResponse.json();
          toast.info("Shopify marketplace created! Syncing data...");

          // Trigger server-side sync
          const syncResponse = await fetch(`/api/sync/${marketplace.id}`, {
            method: 'POST',
          });

          if (!syncResponse.ok) {
            const errorData = await syncResponse.json();
            throw new Error(errorData.error || 'Sync failed');
          }

          const syncResult = await syncResponse.json();
          toast.success(`Shopify connected! ${syncResult.message}`);

        } catch (error) {
          console.error('Shopify connection/sync error:', error);
          toast.error(`Shopify connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      } else {
        // For other channels, just create the marketplace entry
        const response = await fetch('/api/marketplaces', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            type: channelTypeToUse,
            store_url: formData.store_url || null,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create marketplace');
        }

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

            {(formData.type || channelType) !== 'shopify' && (
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
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Shopify Integration:</strong> Credentials are pre-configured. Clicking "Connect Channel" will automatically sync your Shopify products and orders.
                </p>
              </div>
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