import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function AddProduct() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    category_id: "",
    base_price: "",
    cost_price: "",
    weight: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data: { id: string; name: string }[] = await response.json();
      // Sort by name
      const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(sortedData);
    } catch (error: unknown) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.sku.trim()) {
      newErrors.sku = "SKU is required";
    } else if (formData.sku.length < 3) {
      newErrors.sku = "SKU must be at least 3 characters";
    }

    if (!formData.base_price) {
      newErrors.base_price = "Base price is required";
    } else if (parseFloat(formData.base_price) <= 0) {
      newErrors.base_price = "Base price must be greater than 0";
    }

    if (formData.cost_price && parseFloat(formData.cost_price) <= 0) {
      newErrors.cost_price = "Cost price must be greater than 0";
    }

    if (formData.weight && parseFloat(formData.weight) <= 0) {
      newErrors.weight = "Weight must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          description: formData.description || null,
          base_price: parseFloat(formData.base_price),
          status: "active",
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      toast.success("Product created successfully!");
      navigate("/products");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create product";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Product</h1>
        <p className="text-muted-foreground mt-1">Create a new product in your inventory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder="e.g. Wireless Headphones"
                className={errors.name ? "border-destructive" : ""}
                required
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => {
                  setFormData({ ...formData, sku: e.target.value });
                  if (errors.sku) setErrors({ ...errors, sku: "" });
                }}
                placeholder="e.g. WH-001"
                className={errors.sku ? "border-destructive" : ""}
                required
              />
              {errors.sku && <p className="text-sm text-destructive">{errors.sku}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_price">Base Price * ($)</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => {
                    setFormData({ ...formData, base_price: e.target.value });
                    if (errors.base_price) setErrors({ ...errors, base_price: "" });
                  }}
                  placeholder="0.00"
                  className={errors.base_price ? "border-destructive" : ""}
                  required
                />
                {errors.base_price && <p className="text-sm text-destructive">{errors.base_price}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_price">Cost Price ($)</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => {
                    setFormData({ ...formData, cost_price: e.target.value });
                    if (errors.cost_price) setErrors({ ...errors, cost_price: "" });
                  }}
                  placeholder="0.00"
                  className={errors.cost_price ? "border-destructive" : ""}
                />
                {errors.cost_price && <p className="text-sm text-destructive">{errors.cost_price}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) => {
                  setFormData({ ...formData, weight: e.target.value });
                  if (errors.weight) setErrors({ ...errors, weight: "" });
                }}
                placeholder="0.00"
                className={errors.weight ? "border-destructive" : ""}
              />
              {errors.weight && <p className="text-sm text-destructive">{errors.weight}</p>}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Product"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/products")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
