import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Channels() {
  const [marketplaces, setMarketplaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMarketplaces();
  }, []);

  const fetchMarketplaces = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marketplaces');
      if (!response.ok) {
        throw new Error('Failed to fetch marketplaces');
      }
      const data = await response.json();
      setMarketplaces(data.sort((a, b) => new Date(b.connected_at).getTime() - new Date(a.connected_at).getTime()));
    } catch (error: any) {
      toast.error("Failed to load channels");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const availableChannels = [
    { name: "Amazon", logo: "🛒", type: "amazon", description: "World's largest marketplace" },
    { name: "eBay", logo: "🏪", type: "ebay", description: "Global e-commerce platform" },
    { name: "Shopify", logo: "🛍️", type: "shopify", description: "Build your own store" },
    { name: "Etsy", logo: "🎨", type: "etsy", description: "Handmade and vintage items" },
    { name: "Walmart", logo: "🏬", type: "walmart", description: "Major retail marketplace" },
    { name: "Target Plus", logo: "🎯", type: "target", description: "Premium marketplace" },
  ];

  const connectedTypes = marketplaces.map(m => m.type);
  const availableToConnect = availableChannels.filter(c => !connectedTypes.includes(c.type));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Channels</h1>
        <p className="text-muted-foreground mt-1">Connect and manage your marketplace integrations</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading channels...</div>
      ) : (
        <>
          {marketplaces.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Connected Channels</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaces.map((marketplace) => (
                  <Card key={marketplace.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-4xl">
                            {availableChannels.find(c => c.type === marketplace.type)?.logo || "🏪"}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{marketplace.name}</CardTitle>
                            <div className="flex items-center gap-1 mt-1">
                              {marketplace.status === "active" ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 text-success" />
                                  <span className="text-xs text-success">Connected</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 text-destructive" />
                                  <span className="text-xs text-destructive">Error</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">Settings</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Type</span>
                          <span className="font-medium capitalize">{marketplace.type}</span>
                        </div>
                        {marketplace.store_url && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Store URL</span>
                            <span className="font-medium text-xs truncate max-w-[150px]">
                              {marketplace.store_url}
                            </span>
                          </div>
                        )}
                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground">
                            Connected: {new Date(marketplace.connected_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4">Available Channels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableToConnect.map((channel) => (
                <Card key={channel.type}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-4xl">{channel.logo}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{channel.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {channel.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      className="w-full gap-2"
                      onClick={() => navigate("/channels/add", { state: { channelType: channel.type } })}
                    >
                      <Plus className="h-4 w-4" />
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}