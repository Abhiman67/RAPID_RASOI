import { Order } from '@/types/order';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, TrendingUp, Hash, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OrderQueueProps {
  orders: Order[];
  onCancelOrder: (id: string) => void;
}

export function OrderQueue({ orders, onCancelOrder }: OrderQueueProps) {
  const sortedOrders = [...orders].sort((a, b) => b.priority - a.priority);

  return (
    <Card className="border-border/50 card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <span>Priority Queue</span>
          <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary border-primary/20">
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p>No orders in queue</p>
          </div>
        ) : (
          sortedOrders.map((order, index) => (
            <div
              key={order.id}
              className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 text-primary font-bold text-sm flex-shrink-0">
                #{index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold truncate">{order.customerName}</span>
                  {order.tableNumber && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Hash className="h-3 w-3" />{order.tableNumber}
                    </span>
                  )}
                  <Badge 
                    variant={order.orderType === 'reservation' ? 'default' : 'secondary'}
                    className={order.orderType === 'reservation' ? 'bg-primary/20 text-primary border-primary/30' : ''}
                  >
                    {order.orderType}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{order.items}</p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Prep: {order.burstTime}min</span>
                  <span className="text-border">•</span>
                  <span>Waiting: {formatDistanceToNow(order.arrivalTime, { addSuffix: false })}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-1">Priority</div>
                  <div className="text-base sm:text-xl font-bold text-primary">
                    {order.priority.toFixed(2)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                  onClick={() => onCancelOrder(order.id)}
                  title="Cancel order"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
