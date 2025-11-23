import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Edit, Package, TrendingUp, RefreshCw, AlertCircle, Filter, CheckSquare, Square, Trash2, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "@/hooks/useCurrency";
import { apiClient } from "@/lib/api";
import { Product } from "@/types/api";
import { TableSkeleton } from "@/components/ui/skeleton-loader";

export default function ProductList() {
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkEditStatus, setBulkEditStatus] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProducts = async (isRetry = false) => {
    try {
      if (isRetry) {
        setRetrying(true);
        setError(null);
      } else {
        setLoading(true);
      }

      const data = await apiClient.getProducts();
      setProducts(data);
      setError(null);
    } catch (error: unknown) {
      const errorMessage = "Failed to load products";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const handleRetry = () => {
    fetchProducts(true);
  };

  const filterProducts = useCallback(() => {
    let filtered = products;

    // Search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((product) => product.status === statusFilter);
    }

    // Price range filter
    if (priceRange.min) {
      const minPrice = parseFloat(priceRange.min);
      filtered = filtered.filter((product) => product.base_price >= minPrice);
    }
    if (priceRange.max) {
      const maxPrice = parseFloat(priceRange.max);
      filtered = filtered.filter((product) => product.base_price <= maxPrice);
    }

    setFilteredProducts(filtered);
  }, [debouncedSearchTerm, statusFilter, priceRange, products]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "discontinued": return "destructive";
      default: return "default";
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkEditStatus || selectedProducts.size === 0) return;

    try {
      // In a real app, you'd call an API to update multiple products
      // For now, we'll simulate the update
      setProducts(prev => prev.map(product =>
        selectedProducts.has(product.id)
          ? { ...product, status: bulkEditStatus as "active" | "inactive" | "discontinued" }
          : product
      ));

      toast.success(`Updated ${selectedProducts.size} products`);
      setSelectedProducts(new Set());
      setShowBulkEdit(false);
      setBulkEditStatus("");
    } catch (error) {
      toast.error("Failed to update products");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} products?`)) {
      return;
    }

    try {
      // In a real app, you'd call an API to delete multiple products
      setProducts(prev => prev.filter(product => !selectedProducts.has(product.id)));
      toast.success(`Deleted ${selectedProducts.size} products`);
      setSelectedProducts(new Set());
    } catch (error) {
      toast.error("Failed to delete products");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriceRange({ min: "", max: "" });
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">
            {selectedProducts.size > 0
              ? `${selectedProducts.size} product${selectedProducts.size > 1 ? 's' : ''} selected`
              : "Manage your product inventory"
            }
          </p>
        </div>
        <div className="flex gap-2">
          {selectedProducts.size > 0 ? (
            <>
              <Dialog open={showBulkEdit} onOpenChange={setShowBulkEdit}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Bulk Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Edit Products</DialogTitle>
                    <DialogDescription>
                      Update the status for {selectedProducts.size} selected products.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bulk-status">New Status</Label>
                      <Select value={bulkEditStatus} onValueChange={setBulkEditStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="discontinued">Discontinued</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowBulkEdit(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkStatusUpdate} disabled={!bulkEditStatus}>
                      Update {selectedProducts.size} Products
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="destructive" onClick={handleBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </Button>
            </>
          ) : (
            <>
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
              <Button onClick={() => navigate("/products/add")} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </>
          )}
        </div>
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
          <CardTitle>Product List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">Search products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or SKU..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min price"
                    className="w-24"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Max price"
                    className="w-24"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  />
                </div>
                <Button variant="outline" onClick={clearFilters} className="gap-2">
                  <Filter className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {debouncedSearchTerm || statusFilter !== "all" || priceRange.min || priceRange.max
                ? "No products found matching your filters."
                : "No products found."
              }
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                        indeterminate={selectedProducts.size > 0 && selectedProducts.size < filteredProducts.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(product.base_price)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(product.status)}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/products/${product.id}/edit`)}
                          className="hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}