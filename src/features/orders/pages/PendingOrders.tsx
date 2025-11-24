import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import { useCurrency } from "@/shared/hooks/useCurrency";

export default function PendingOrders() {
  const { currencySymbol } = useCurrency();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders/pending');
      if (!response.ok) {
        throw new Error('Failed to fetch pending orders');
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

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      toast.success("Order status updated");
      fetchOrders();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Orders</h1>
        <p className="text-muted-foreground mt-1">Orders awaiting processing</p>
      </div>

      <div className="bg-card rounded-lg border">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No pending orders
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{order.marketplaces?.name}</TableCell>
                  <TableCell className="font-medium">{currencySymbol}{order.total}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => updateStatus(order.id, "processing")}
                    >
                      Process
                    </Button>
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
