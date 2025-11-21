import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ReturnOrder {
    id: number;
    order_number: string;
    customer_name: string;
    total: number;
    status: string;
    created_at: string;
    marketplace_name: string;
}

export default function Returns() {
    const [returns, setReturns] = useState<ReturnOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReturns();
    }, []);

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/orders/returns');
            if (!response.ok) {
                throw new Error('Failed to fetch returns');
            }
            const data = await response.json();
            setReturns(data);
        } catch (error) {
            toast.error("Failed to load returns");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "returned": return "destructive";
            case "refunded": return "secondary";
            default: return "default";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Returns</h1>
                    <p className="text-muted-foreground mt-1">Manage returned orders and refunds</p>
                </div>
                <Button onClick={fetchReturns} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{returns.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Return orders this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Refunds</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {returns.filter(r => r.status === 'returned').length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting refund processing
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Refunded</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {returns.filter(r => r.status === 'refunded').length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Successfully refunded
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Return Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading returns...</div>
                    ) : returns.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No return orders found.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order #</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Channel</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {returns.map((returnOrder) => (
                                        <TableRow key={returnOrder.id}>
                                            <TableCell className="font-medium">{returnOrder.order_number}</TableCell>
                                            <TableCell>{returnOrder.customer_name}</TableCell>
                                            <TableCell>{returnOrder.marketplace_name}</TableCell>
                                            <TableCell className="text-right font-medium">${returnOrder.total}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusColor(returnOrder.status)}>
                                                    {returnOrder.status.charAt(0).toUpperCase() + returnOrder.status.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(returnOrder.created_at).toLocaleDateString()}
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