import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Search, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/shared/utils/api";

export default function LowStock() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const fetchLowStockItems = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getInventory();
      // Filter for low stock items (quantity <= 10)
      const lowStockItems = data.filter((item: any) => item.quantity <= 10);
      setInventory(lowStockItems);
    } catch (error: unknown) {
      toast.error("Failed to load low stock items");
      console.error(error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Low Stock Alerts</h1>
        <p className="text-muted-foreground mt-1">Products that need restocking</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search low stock items</Label>
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
            <Button onClick={() => navigate("/inventory/adjustments")}>
              Adjust Stock
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading low stock items...</div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No low stock items found matching your search." : "No low stock items found."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Threshold</TableHead>
                    <TableHead>Last Updated</TableHead>
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
                      <TableCell className="text-right font-medium text-destructive">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">{item.low_stock_threshold}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.updated_at).toLocaleDateString()}
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
