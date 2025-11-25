import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Plus,
  Search,
  Edit,
  Package,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  Settings,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Star,
  Heart,
  Eye,
  MoreVertical,
  Copy,
  Download,
  Upload,
  Tag,
  DollarSign,
  Calendar,
  User,
  Layers,
} from "lucide-react";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "@/shared/hooks/useCurrency";
import { apiClient } from "@/shared/utils/api";
import { Product } from "@/shared/types/api";
import { TableSkeleton } from "@/shared/components/ui/skeleton-loader";
import { startOfDay, endOfDay } from "date-fns";

type ViewMode = 'table' | 'grid';
type SortField = 'name' | 'sku' | 'base_price' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  search: string;
  status: string;
  priceRange: { min: string; max: string };
  categories: string[];
  suppliers: string[];
  dateRange: { from?: Date; to?: Date };
}

interface BulkAction {
  type: 'status' | 'delete' | 'export' | 'price_update';
  value?: string;
  percentage?: number;
}

export default function ProductList() {
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    priceRange: { min: '', max: '' },
    categories: [],
    suppliers: [],
    dateRange: {},
  });

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Mock data for enhanced filtering
  const availableCategories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books'];
  const availableSuppliers = ['Supplier A', 'Supplier B', 'Supplier C', 'Supplier D'];

  useEffect(() => {
    fetchProducts();
  }, []);

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

  // Advanced filtering logic
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((product) => product.status === filters.status);
    }

    // Price range filter
    if (filters.priceRange.min) {
      const minPrice = parseFloat(filters.priceRange.min);
      filtered = filtered.filter((product) => product.base_price >= minPrice);
    }
    if (filters.priceRange.max) {
      const maxPrice = parseFloat(filters.priceRange.max);
      filtered = filtered.filter((product) => product.base_price <= maxPrice);
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((product) => 
        filters.categories.includes(product.category_id || 'Uncategorized')
      );
    }

    // Supplier filter
    if (filters.suppliers.length > 0) {
      filtered = filtered.filter((product) => 
        filters.suppliers.includes(product.supplier_id || 'Unknown')
      );
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter((product) => {
        const createdAt = new Date(product.created_at);
        const from = filters.dateRange.from ? startOfDay(filters.dateRange.from) : null;
        const to = filters.dateRange.to ? endOfDay(filters.dateRange.to) : null;
        
        if (from && createdAt < from) return false;
        if (to && createdAt > to) return false;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle different data types
      if (sortField === 'base_price') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [products, filters, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priceRange: { min: '', max: '' },
      categories: [],
      suppliers: [],
      dateRange: {},
    });
    setCurrentPage(1);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.priceRange.min || filters.priceRange.max) count++;
    if (filters.categories.length > 0) count++;
    if (filters.suppliers.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    return count;
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(paginatedProducts.map(p => p.id)));
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

  const handleBulkAction = async (action: BulkAction) => {
    if (selectedProducts.size === 0) return;

    try {
      switch (action.type) {
        case 'status':
          // Simulate bulk status update
          setProducts(prev => prev.map(product =>
            selectedProducts.has(product.id)
              ? { ...product, status: action.value as "active" | "inactive" | "discontinued" }
              : product
          ));
          toast.success(`Updated status for ${selectedProducts.size} products`);
          break;

        case 'delete':
          // Simulate bulk delete
          setProducts(prev => prev.filter(product => !selectedProducts.has(product.id)));
          toast.success(`Deleted ${selectedProducts.size} products`);
          break;

        case 'export':
          {
            // Simulate export
            const exportData = products.filter(p => selectedProducts.has(p.id));
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `products-export-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            toast.success(`Exported ${selectedProducts.size} products`);
          }
          break;

        default:
          throw new Error('Unknown bulk action');
      }

      setSelectedProducts(new Set());
      setShowBulkEdit(false);
      setBulkAction(null);
    } catch (error) {
      toast.error("Failed to perform bulk action");
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "discontinued": return "destructive";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Star className="h-3 w-3" />;
      case "inactive": return <Eye className="h-3 w-3" />;
      case "discontinued": return <AlertCircle className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  // Filter chips component
  const FilterChips = () => {
    const chips: Array<{ label: string; onRemove: () => void }> = [];
    
    if (filters.search) {
      chips.push({ label: `Search: "${filters.search}"`, onRemove: () => handleFilterChange('search', '') });
    }
    if (filters.status !== 'all') {
      chips.push({ label: `Status: ${filters.status}`, onRemove: () => handleFilterChange('status', 'all') });
    }
    if (filters.priceRange.min) {
      chips.push({ label: `Min: ${filters.priceRange.min}`, onRemove: () => handleFilterChange('priceRange', { ...filters.priceRange, min: '' }) });
    }
    if (filters.priceRange.max) {
      chips.push({ label: `Max: ${filters.priceRange.max}`, onRemove: () => handleFilterChange('priceRange', { ...filters.priceRange, max: '' }) });
    }
    filters.categories.forEach(category => {
      chips.push({ label: category, onRemove: () => handleFilterChange('categories', filters.categories.filter(c => c !== category)) });
    });
    filters.suppliers.forEach(supplier => {
      chips.push({ label: supplier, onRemove: () => handleFilterChange('suppliers', filters.suppliers.filter(s => s !== supplier)) });
    });

    if (chips.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
        <Label className="text-sm font-medium mr-2">Active filters:</Label>
        {chips.map((chip, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs"
          >
            {chip.label}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-primary-foreground/20"
              onClick={chip.onRemove}
            >
              ×
            </Button>
          </motion.div>
        ))}
        {chips.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Clear all
          </Button>
        )}
      </div>
    );
  };

  // Grid view component
  const ProductGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence>
        {paginatedProducts.map((product) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                    />
                    <div className="p-2 bg-muted rounded-lg">
                      <Package className="h-4 w-4" />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/products/${product.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{product.sku}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {getStatusIcon(product.status)}
                    <Badge variant={getStatusColor(product.status)} className="text-xs">
                      {product.status}
                    </Badge>
                  </div>
                  <div className="text-lg font-bold">
                    {formatCurrency(product.base_price)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Created {new Date(product.created_at).toLocaleDateString()}</span>
                  <span>{product.category_id || 'Uncategorized'}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/products/${product.id}/edit`)}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  // Table view component
  const ProductTableView = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedProducts.size === paginatedProducts.length && paginatedProducts.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-1">
                Product
                {sortField === 'name' && (
                  sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('sku')}
            >
              <div className="flex items-center gap-1">
                SKU
                {sortField === 'sku' && (
                  sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('base_price')}
            >
              <div className="flex items-center gap-1">
                Price
                {sortField === 'base_price' && (
                  sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedProducts.map((product) => (
            <motion.tr
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="hover:bg-muted/50 transition-colors group"
            >
              <TableCell>
                <Checkbox
                  checked={selectedProducts.has(product.id)}
                  onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                />
              </TableCell>
              <TableCell>
                <div className="font-medium group-hover:text-primary transition-colors cursor-pointer"
                     onClick={() => navigate(`/products/${product.id}/edit`)}>
                  {product.name}
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">{product.sku}</TableCell>
              <TableCell className="font-medium">{formatCurrency(product.base_price)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {getStatusIcon(product.status)}
                  <Badge variant={getStatusColor(product.status)}>
                    {product.status}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>{product.category_id || 'Uncategorized'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(product.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/products/${product.id}/edit`)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">
            {selectedProducts.size > 0
              ? `${selectedProducts.size} product${selectedProducts.size > 1 ? 's' : ''} selected`
              : `${filteredAndSortedProducts.length} products total`
            }
          </p>
        </div>
        <div className="flex gap-2">
          {selectedProducts.size > 0 ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Selected Products</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setBulkAction({ type: 'export' })}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkAction({ type: 'status', value: 'active' })}>
                    <Star className="mr-2 h-4 w-4" />
                    Set Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkAction({ type: 'status', value: 'inactive' })}>
                    <Eye className="mr-2 h-4 w-4" />
                    Set Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkAction({ type: 'status', value: 'discontinued' })}>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Discontinue
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => setBulkAction({ type: 'delete' })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={() => setSelectedProducts(new Set())}>
                Clear Selection
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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}. Please try again or contact support if the problem persists.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Quick Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products, SKU, or description..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
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
              
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min price"
                value={filters.priceRange.min}
                onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, min: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Max price"
                value={filters.priceRange.max}
                onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, max: e.target.value })}
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <Tag className="mr-2 h-4 w-4" />
                  Categories ({filters.categories.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <Command>
                  <CommandInput placeholder="Search categories..." />
                  <CommandList>
                    <CommandEmpty>No categories found.</CommandEmpty>
                    <CommandGroup>
                      {availableCategories.map((category) => (
                        <CommandItem
                          key={category}
                          onSelect={() => {
                            const newCategories = filters.categories.includes(category)
                              ? filters.categories.filter(c => c !== category)
                              : [...filters.categories, category];
                            handleFilterChange('categories', newCategories);
                          }}
                        >
                          <CheckSquare 
                            className={`mr-2 h-4 w-4 ${
                              filters.categories.includes(category) ? 'opacity-100' : 'opacity-0'
                            }`} 
                          />
                          {category}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Suppliers ({filters.suppliers.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <Command>
                  <CommandInput placeholder="Search suppliers..." />
                  <CommandList>
                    <CommandEmpty>No suppliers found.</CommandEmpty>
                    <CommandGroup>
                      {availableSuppliers.map((supplier) => (
                        <CommandItem
                          key={supplier}
                          onSelect={() => {
                            const newSuppliers = filters.suppliers.includes(supplier)
                              ? filters.suppliers.filter(s => s !== supplier)
                              : [...filters.suppliers, supplier];
                            handleFilterChange('suppliers', newSuppliers);
                          }}
                        >
                          <CheckSquare 
                            className={`mr-2 h-4 w-4 ${
                              filters.suppliers.includes(supplier) ? 'opacity-100' : 'opacity-0'
                            }`} 
                          />
                          {supplier}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <Filter className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>

          {/* Active Filter Chips */}
          <FilterChips />
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {paginatedProducts.length} of {filteredAndSortedProducts.length} products
          {filteredAndSortedProducts.length !== products.length && ` (${products.length} total)`}
        </p>
        {filteredAndSortedProducts.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Sorted by {sortField} ({sortDirection})
          </p>
        )}
      </div>

      {/* Product List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Product List</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Page {currentPage} of {totalPages}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {getActiveFiltersCount() > 0
                  ? "No products match your current filters."
                  : "Get started by adding your first product."
                }
              </p>
              {getActiveFiltersCount() > 0 ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => navigate("/products/add")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'table' ? <ProductTableView /> : <ProductGridView />}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction?.type === 'delete' ? 'Delete Products' : 
               bulkAction?.type === 'export' ? 'Export Products' : 
               'Update Product Status'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                if (bulkAction?.type === 'delete') {
                  return `Are you sure you want to delete ${selectedProducts.size} products? This action cannot be undone.`;
                }
                if (bulkAction?.type === 'export') {
                  return `Export ${selectedProducts.size} selected products as JSON file?`;
                }
                if (bulkAction?.type === 'status' && bulkAction.value) {
                  return `Update ${selectedProducts.size} products to "${bulkAction.value}" status?`;
                }
                return 'Unknown action';
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => bulkAction && handleBulkAction(bulkAction)}
              className={bulkAction?.type === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {bulkAction?.type === 'delete' ? 'Delete' : 
               bulkAction?.type === 'export' ? 'Export' : 'Update'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
