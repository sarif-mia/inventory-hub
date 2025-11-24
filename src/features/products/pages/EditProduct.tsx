import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { useCurrency } from "@/shared/hooks/useCurrency";
import { apiClient } from "@/shared/utils/api";

export default function EditProduct() {
  const { currencySymbol } = useCurrency();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch all required data in parallel using apiClient
      const [productData, categoriesData, suppliersData] = await Promise.all([
        apiClient.getProduct(id!),
        apiClient.getCategories(),
        apiClient.getSuppliers()
      ]);

      // For now, set empty arrays for inventory and sales as these endpoints may not be implemented
      const inventoryData: any[] = [];
      const salesData: any[] = [];

      if (!productData) {
        throw new Error("Product not found");
      }

      setProduct(productData);
      setCategories(categoriesData);
      setSuppliers(suppliersData);
      setInventory(inventoryData);
      setSalesHistory(salesData);
    } catch (error: any) {
      toast.error("Failed to load product data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Image upload functionality would need to be reimplemented with a different storage solution
    // For now, we'll show a toast indicating this feature needs to be implemented
    toast.info("Image upload functionality needs to be implemented with a new storage solution");
  };

  const handleRemoveImage = async () => {
    try {
      await apiClient.updateProduct(id!, { image_url: null });
      setProduct({ ...product, image_url: null });
      toast.success("Image removed");
    } catch (error: any) {
      toast.error("Failed to remove image");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await apiClient.updateProduct(id!, {
        name: formData.get("name") as string,
        sku: formData.get("sku") as string,
        description: formData.get("description") as string,
        base_price: parseFloat(formData.get("base_price") as string),
        status: formData.get("status") as string,
      });

      toast.success("Product updated successfully");
      navigate("/products");
    } catch (error: any) {
      toast.error("Failed to update product");
      console.error(error);
    }
  };

  const updateInventory = async (inventoryId: string, quantity: number, price: number) => {
    try {
      await apiClient.updateInventory(inventoryId, quantity, price);
      toast.success("Inventory updated");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update inventory");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!product) return <div className="p-8">Product not found</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground">Update product information and manage inventory</p>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Product Details</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="sales">Sales History</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Update basic product details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" name="name" defaultValue={product.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" name="sku" defaultValue={product.sku} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={product.description} rows={4} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category_id">Category</Label>
                    <Select name="category_id" defaultValue={product.category_id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier_id">Supplier</Label>
                    <Select name="supplier_id" defaultValue={product.supplier_id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((sup) => (
                          <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base_price">Base Price</Label>
                    <Input id="base_price" name="base_price" type="number" step="0.01" defaultValue={product.base_price} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost_price">Cost Price</Label>
                    <Input id="cost_price" name="cost_price" type="number" step="0.01" defaultValue={product.cost_price} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" name="weight" type="number" step="0.01" defaultValue={product.weight} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dimensions">Dimensions</Label>
                    <Input id="dimensions" name="dimensions" placeholder="L x W x H" defaultValue={product.dimensions} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={product.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="discontinued">Discontinued</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Save Changes</Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/products")}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Channel Inventory</CardTitle>
              <CardDescription>Manage stock levels across different marketplaces</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marketplace</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.marketplaces?.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={inv.quantity}
                          className="w-24"
                          id={`qty-${inv.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          defaultValue={inv.price}
                          className="w-32"
                          id={`price-${inv.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'in_stock' ? 'default' : inv.status === 'low_stock' ? 'secondary' : 'destructive'}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => {
                            const qty = parseInt((document.getElementById(`qty-${inv.id}`) as HTMLInputElement).value);
                            const price = parseFloat((document.getElementById(`price-${inv.id}`) as HTMLInputElement).value);
                            updateInventory(inv.id, qty, price);
                          }}
                        >
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales History</CardTitle>
              <CardDescription>View all sales for this product</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Marketplace</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesHistory.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.orders?.order_number}</TableCell>
                      <TableCell>{sale.orders?.marketplaces?.name}</TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>{currencySymbol}{typeof sale.unit_price === 'string' ? (sale.unit_price as string).replace(/^\$/, '') : parseFloat(sale.unit_price).toFixed(2)}</TableCell>
                      <TableCell>{currencySymbol}{typeof sale.total_price === 'string' ? (sale.total_price as string).replace(/^\$/, '') : parseFloat(sale.total_price).toFixed(2)}</TableCell>
                      <TableCell>{new Date(sale.orders?.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge>{sale.orders?.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>Upload and manage product images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.image_url ? (
                <div className="relative inline-block">
                  <img src={product.image_url} alt={product.name} className="w-64 h-64 object-cover rounded-lg" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No image uploaded</p>
                </div>
              )}

              <div>
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload New Image"}
                  </div>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
