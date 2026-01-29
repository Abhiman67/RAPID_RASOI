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
    <Card className="border-border/50 card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-500/20">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <span>Completed Orders</span>
          <Badge variant="secondary" className="ml-auto bg-green-500/10 text-green-500 border-green-500/20">
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p>No completed orders yet</p>
          </div>
        ) : (
          recentOrders.map((order) => (
            <div
              key={order.id}
              className="p-4 rounded-xl border border-green-500/30 bg-green-500/5"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{order.customerName}</span>
                    <Badge 
                      variant={order.orderType === 'reservation' ? 'default' : 'secondary'}
                      className={order.orderType === 'reservation' ? 'bg-primary/20 text-primary border-primary/30' : ''}
                    >
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
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Wait: <span className="text-foreground font-medium">{calculateWaitingTime(order).toFixed(1)}min</span></span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  <span>Total: <span className="text-foreground font-medium">{calculateTurnaroundTime(order).toFixed(1)}min</span></span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
