import { Order } from '@/types/order';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChefHat, Clock, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ActiveOrdersProps {
  orders: Order[];
}

export function ActiveOrders({ orders }: ActiveOrdersProps) {
  const [, setTick] = useState(0);

  // Update progress every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const calculateProgress = (order: Order): number => {
    if (!order.startTime) return 0;
    const elapsed = (Date.now() - order.startTime) / (1000 * 60); // minutes
    const progress = (elapsed / order.burstTime) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getRemainingTime = (order: Order): string => {
    if (!order.startTime) return `${order.burstTime}min`;
    const elapsed = (Date.now() - order.startTime) / (1000 * 60);
    const remaining = Math.max(0, order.burstTime - elapsed);
    return `${Math.ceil(remaining)}min`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-warning" />
          Active Orders
          <Badge variant="secondary" className="ml-auto bg-warning/10 text-warning border-warning/20">
            {orders.length} cooking
          </Badge>
        </CardTitle>
        <CardDescription>
          Currently being prepared (non-preemptive)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No orders being prepared
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="p-4 rounded-lg border bg-warning/5 border-warning/20 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{order.customerName}</span>
                    <Badge variant={order.orderType === 'reservation' ? 'default' : 'secondary'}>
                      {order.orderType}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.items}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-warning font-medium">
                    <Clock className="h-4 w-4" />
                    {getRemainingTime(order)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    remaining
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Cooking Progress</span>
                  <span>{Math.round(calculateProgress(order))}%</span>
                </div>
                <Progress value={calculateProgress(order)} className="h-2" />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
