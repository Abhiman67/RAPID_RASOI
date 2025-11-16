import { Order } from '@/types/order';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OrderQueueProps {
  orders: Order[];
}

export function OrderQueue({ orders }: OrderQueueProps) {
  const sortedOrders = [...orders].sort((a, b) => b.priority - a.priority);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Priority Queue
          <Badge variant="secondary" className="ml-auto">
            {orders.length} waiting
          </Badge>
        </CardTitle>
        <CardDescription>
          Orders sorted by priority (Non-Preemptive Scheduling)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No orders in queue
          </div>
        ) : (
          sortedOrders.map((order, index) => (
            <div
              key={order.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium truncate">{order.customerName}</span>
                  <Badge variant={order.orderType === 'reservation' ? 'default' : 'secondary'}>
                    {order.orderType}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{order.items}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Prep: {order.burstTime}min</span>
                  <span>•</span>
                  <span>Waiting: {formatDistanceToNow(order.arrivalTime, { addSuffix: false })}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">Priority</div>
                <div className="text-lg font-bold text-primary">
                  {order.priority.toFixed(2)}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
