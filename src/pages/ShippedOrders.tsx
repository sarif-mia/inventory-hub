import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";

export default function ShippedOrders() {
  const { currencySymbol } = useCurrency();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders/shipped');
      if (!response.ok) {
        throw new Error('Failed to fetch shipped orders');
      }
      const data = await response.json();
      setOrders(data);
    } catch (error: any) {
      toast.error("Failed to load orders");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shipped Orders</h1>
        <p className="text-muted-foreground mt-1">Orders currently in transit</p>
      </div>

      <div className="bg-card rounded-lg border">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No shipped orders
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date Shipped</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{order.marketplaces?.name}</TableCell>
                  <TableCell className="font-medium">{currencySymbol}{order.total}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">In Transit</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
