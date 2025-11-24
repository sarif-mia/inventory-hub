import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface StockAdjustment {
    id: number;
    product_id: number;
    marketplace_id: number;
    adjustment_type: 'increase' | 'decrease';
    quantity: number;
    reason: string;
    created_at: string;
    products?: { name: string; sku: string };
    marketplaces?: { name: string };
}

export default function StockAdjustments() {
    const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [marketplaces, setMarketplaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [formData, setFormData] = useState({
        product_id: '',
        marketplace_id: '',
        adjustment_type: 'increase' as 'increase' | 'decrease',
        quantity: '',
        reason: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [adjustmentsRes, productsRes, marketplacesRes] = await Promise.all([
                fetch('/api/stock-adjustments'),
                fetch('/api/products'),
                fetch('/api/marketplaces')
            ]);

            if (adjustmentsRes.ok) {
                const adjustmentsData = await adjustmentsRes.json();
                setAdjustments(adjustmentsData);
            }

            if (productsRes.ok) {
                const productsData = await productsRes.json();
                setProducts(productsData);
            }

            if (marketplacesRes.ok) {
                const marketplacesData = await marketplacesRes.json();
                setMarketplaces(marketplacesData);
            }
        } catch (error) {
            toast.error("Failed to load data");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/inventory/adjust', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: parseInt(formData.product_id),
                    marketplace_id: parseInt(formData.marketplace_id),
                    adjustment_type: formData.adjustment_type,
                    quantity: parseInt(formData.quantity),
                    reason: formData.reason
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to adjust stock');
            }

            const result = await response.json();
            toast.success(`Stock adjusted successfully. New quantity: ${result.newQuantity}`);

            setShowDialog(false);
            setFormData({
                product_id: '',
                marketplace_id: '',
                adjustment_type: 'increase',
                quantity: '',
                reason: ''
            });

            fetchData(); // Refresh the data
        } catch (error) {
            toast.error("Failed to adjust stock");
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Stock Adjustments</h1>
                    <p className="text-muted-foreground mt-1">Manage inventory adjustments and track changes</p>
                </div>
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Adjustment
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adjust Stock Level</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="product">Product</Label>
                                <Select value={formData.product_id} onValueChange={(value) => setFormData({ ...formData, product_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map((product) => (
                                            <SelectItem key={product.id} value={product.id.toString()}>
                                                {product.name} ({product.sku})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="marketplace">Marketplace</Label>
                                <Select value={formData.marketplace_id} onValueChange={(value) => setFormData({ ...formData, marketplace_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a marketplace" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {marketplaces.map((marketplace) => (
                                            <SelectItem key={marketplace.id} value={marketplace.id.toString()}>
                                                {marketplace.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="adjustment_type">Adjustment Type</Label>
                                <Select value={formData.adjustment_type} onValueChange={(value: 'increase' | 'decrease') => setFormData({ ...formData, adjustment_type: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="increase">Increase Stock</SelectItem>
                                        <SelectItem value="decrease">Decrease Stock</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="reason">Reason</Label>
                                <Textarea
                                    id="reason"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Enter reason for adjustment"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Adjust Stock
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Adjustment History</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading adjustments...</div>
                    ) : adjustments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No stock adjustments found.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Marketplace</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {adjustments.map((adjustment) => (
                                        <TableRow key={adjustment.id}>
                                            <TableCell>
                                                <div className="font-medium">{adjustment.products?.name || 'Unknown Product'}</div>
                                                <div className="text-sm text-muted-foreground">{adjustment.products?.sku}</div>
                                            </TableCell>
                                            <TableCell>{adjustment.marketplaces?.name || 'Unknown'}</TableCell>
                                            <TableCell>
                                                <Badge variant={adjustment.adjustment_type === 'increase' ? 'default' : 'destructive'}>
                                                    {adjustment.adjustment_type === 'increase' ? (
                                                        <TrendingUp className="h-3 w-3 mr-1" />
                                                    ) : (
                                                        <TrendingDown className="h-3 w-3 mr-1" />
                                                    )}
                                                    {adjustment.adjustment_type === 'increase' ? 'Increased' : 'Decreased'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{adjustment.quantity}</TableCell>
                                            <TableCell className="max-w-xs truncate" title={adjustment.reason}>
                                                {adjustment.reason}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(adjustment.created_at).toLocaleDateString()}
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
