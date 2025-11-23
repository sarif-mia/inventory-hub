import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Package, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";
import { apiClient } from "@/lib/api";
import { InventoryItemWithDetails } from "@/types/api";

export default function StockLevels() {
  const { formatCurrency } = useCurrency();
  const [inventory, setInventory] = useState<InventoryItemWithDetails[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItemWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async (isRetry = false) => {
    try {
      if (isRetry) {
        setRetrying(true);
        setError(null);
      } else {
        setLoading(true);
      }

      const data = await apiClient.getInventory() as InventoryItemWithDetails[];
      setInventory(data);
      setError(null);
    } catch (error: unknown) {
      const errorMessage = "Failed to load inventory";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const handleRetry = () => {
    fetchInventory(true);
  };

  const filterInventory = useCallback(() => {
    if (!searchTerm) {
      setFilteredInventory(inventory);
      return;
    }

    const filtered = inventory.filter(
      (item) =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInventory(filtered);
  }, [searchTerm, inventory]);

  useEffect(() => {
    filterInventory();
  }, [filterInventory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_stock": return "default";
      case "low_stock": return "destructive";
      case "out_of_stock": return "destructive";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Levels</h1>
          <p className="text-muted-foreground mt-1">Monitor inventory across all channels</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Current Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search inventory</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by product name or SKU..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading inventory...</div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No inventory found matching your search." : "No inventory found."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={`${item.product_id}-${item.marketplace_id}`}>
                      <TableCell>
                        <div className="font-medium">{item.product_name || 'Unknown Product'}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.sku || 'N/A'}</TableCell>
                      <TableCell>{item.marketplace_name || 'Unknown Channel'}</TableCell>
                      <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(item.status)}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}