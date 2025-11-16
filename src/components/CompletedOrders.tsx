import { Order } from '@/types/order';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, User, Timer } from 'lucide-react';
import { calculateTurnaroundTime, calculateWaitingTime } from '@/utils/scheduler';
import { formatDistanceToNow } from 'date-fns';

interface CompletedOrdersProps {
  orders: Order[];
}

export function CompletedOrders({ orders }: CompletedOrdersProps) {
  const recentOrders = [...orders]
    .sort((a, b) => (b.completionTime || 0) - (a.completionTime || 0))
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          Completed Orders
          <Badge variant="secondary" className="ml-auto bg-success/10 text-success border-success/20">
            {orders.length} completed
          </Badge>
        </CardTitle>
        <CardDescription>
          Recently completed orders (showing last 10)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No completed orders yet
          </div>
        ) : (
          recentOrders.map((order) => (
            <div
              key={order.id}
              className="p-3 rounded-lg border bg-success/5 border-success/20"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{order.customerName}</span>
                    <Badge variant={order.orderType === 'reservation' ? 'default' : 'secondary'}>
                      {order.orderType}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.items}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {order.completionTime && formatDistanceToNow(order.completionTime, { addSuffix: true })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Wait: {calculateWaitingTime(order).toFixed(1)}min</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  <span>Total: {calculateTurnaroundTime(order).toFixed(1)}min</span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
