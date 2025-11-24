import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/shared/components/ui/alert-dialog";
import { Plus, CheckCircle2, XCircle, RefreshCw, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/shared/utils/api";
import { Marketplace } from "@/shared/types/api";

export default function Channels() {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMarketplaces();
  }, []);

  const fetchMarketplaces = async (isRetry = false) => {
    try {
      if (isRetry) {
        setRetrying(true);
        setError(null);
      } else {
        setLoading(true);
      }

      const data = await apiClient.getMarketplaces();
      setMarketplaces(data.sort((a, b) => new Date(b.connected_at).getTime() - new Date(a.connected_at).getTime()));
      setError(null);
    } catch (error: unknown) {
      const errorMessage = "Failed to load channels";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const handleRetry = () => {
    fetchMarketplaces(true);
  };

  const handleDeleteMarketplace = async (marketplaceId: string, marketplaceName: string) => {
    try {
      await apiClient.deleteMarketplace(marketplaceId);
      setMarketplaces(prev => prev.filter(m => m.id !== marketplaceId));
      toast.success(`Successfully disconnected ${marketplaceName}`);

      // Force page refresh to clear any cached data in other components
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Delete marketplace error:', error);
      toast.error(`Failed to disconnect ${marketplaceName}`);
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
  const availableToConnect = availableChannels.filter(c => !connectedTypes.includes(c.type as any));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Channels</h1>
          <p className="text-muted-foreground mt-1">Connect and manage your marketplace integrations</p>
        </div>
        {error && (
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
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}. Please try again or contact support if the problem persists.
          </AlertDescription>
        </Alert>
      )}

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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Disconnect Channel</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to disconnect {marketplace.name}? This action cannot be undone and will remove all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMarketplace(marketplace.id, marketplace.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Disconnect
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
