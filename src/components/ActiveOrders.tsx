import { Order } from '@/types/order';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChefHat, Clock, User, Hash, Sparkles, TimerReset } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface ActiveOrdersProps {
  orders: Order[];
  onFinishOrder: (id: string) => void;
}

export function ActiveOrders({ orders, onFinishOrder }: ActiveOrdersProps) {
  const [, setTick] = useState(0);
  const [finishTargetId, setFinishTargetId] = useState<string | null>(null);

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

  const finishTarget = useMemo(
    () => orders.find(order => order.id === finishTargetId) || null,
    [finishTargetId, orders]
  );

  const handleFinishNow = () => {
    if (!finishTarget) return;
    onFinishOrder(finishTarget.id);
    setFinishTargetId(null);
  };

  return (
    <Card className="border-border/50 card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-yellow-500/20">
            <ChefHat className="h-5 w-5 text-yellow-500" />
          </div>
          <span>Active Orders</span>
          <Badge variant="secondary" className="ml-auto bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            {orders.length} cooking
          </Badge>
        </CardTitle>
        <CardDescription>
          Currently being prepared (non-preemptive)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AlertDialog open={!!finishTarget} onOpenChange={(open) => !open && setFinishTargetId(null)}>
          <AlertDialogContent className="border-border/50 bg-card/95 backdrop-blur-xl sm:max-w-lg">
            <AlertDialogHeader>
              <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-500">
                <Sparkles className="h-3.5 w-3.5" />
                Finish early
              </div>
              <AlertDialogTitle className="text-xl">
                Mark order #{finishTarget?.orderNumber} as completed now?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-6">
                This will complete the active order immediately, update its waiting and turnaround time, and free the kitchen slot for the next order.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {finishTarget && (
              <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Customer</div>
                  <div className="mt-1 text-lg font-semibold">{finishTarget.customerName}</div>
                  <div className="text-sm text-muted-foreground">{finishTarget.items}</div>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Remaining time</div>
                  <div className="mt-1 text-lg font-semibold flex items-center gap-2">
                    <TimerReset className="h-4 w-4 text-yellow-500" />
                    {getRemainingTime(finishTarget)}
                  </div>
                  <div className="text-sm text-muted-foreground">Manual completion overrides the timer</div>
                </div>
              </div>
            )}

            <AlertDialogFooter className="mt-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-yellow-500 text-black hover:bg-yellow-500/90" onClick={handleFinishNow}>
                Finish now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <ChefHat className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p>No orders being prepared</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 space-y-3 glow-warning"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{order.customerName}</span>
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
                  <p className="text-sm text-muted-foreground">{order.items}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-500 font-bold text-lg">
                    <Clock className="h-4 w-4" />
                    {getRemainingTime(order)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    remaining
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Cooking Progress</span>
                  <span className="text-yellow-500 font-medium">{Math.round(calculateProgress(order))}%</span>
                </div>
                <Progress value={calculateProgress(order)} className="h-2" />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-500"
                  onClick={() => setFinishTargetId(order.id)}
                >
                  <Sparkles className="h-4 w-4" />
                  Finish early
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
