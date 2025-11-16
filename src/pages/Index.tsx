import { useState, useEffect, useCallback } from 'react';
import { Order, Statistics as StatsType } from '@/types/order';
import { OrderEntry } from '@/components/OrderEntry';
import { OrderQueue } from '@/components/OrderQueue';
import { ActiveOrders } from '@/components/ActiveOrders';
import { CompletedOrders } from '@/components/CompletedOrders';
import { Statistics } from '@/components/Statistics';
import { TimelineVisualization } from '@/components/TimelineVisualization';
import { Button } from '@/components/ui/button';
import { 
  scheduleNextOrder, 
  calculatePriority, 
  calculateWaitingTime, 
  calculateTurnaroundTime 
} from '@/utils/scheduler';
import { UtensilsCrossed, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);

  const waitingOrders = orders.filter(o => o.status === 'waiting');
  const cookingOrders = orders.filter(o => o.status === 'cooking');
  const completedOrders = orders.filter(o => o.status === 'completed');

  // Calculate statistics
  const statistics: StatsType = {
    totalOrders: orders.length,
    completedOrders: completedOrders.length,
    averageWaitingTime: completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => sum + (o.waitingTime || 0), 0) / completedOrders.length
      : 0,
    averageTurnaroundTime: completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => sum + (o.turnaroundTime || 0), 0) / completedOrders.length
      : 0,
    throughput: completedOrders.length,
  };

  // Add new order
  const handleAddOrder = useCallback((order: Order) => {
    setOrders(prev => [...prev, order]);
  }, []);

  // Scheduler logic - runs every second
  useEffect(() => {
    if (!isSchedulerRunning) return;

    const interval = setInterval(() => {
      setOrders(currentOrders => {
        const currentTime = Date.now();
        let updatedOrders = [...currentOrders];

        // Update priorities for waiting orders
        updatedOrders = updatedOrders.map(order => {
          if (order.status === 'waiting') {
            return {
              ...order,
              priority: calculatePriority(order, currentTime),
            };
          }
          return order;
        });

        // Check for completed cooking orders
        updatedOrders = updatedOrders.map(order => {
          if (order.status === 'cooking' && order.startTime) {
            const elapsed = (currentTime - order.startTime) / (1000 * 60); // minutes
            if (elapsed >= order.burstTime) {
              const completedOrder = {
                ...order,
                status: 'completed' as const,
                completionTime: currentTime,
                waitingTime: calculateWaitingTime(order),
                turnaroundTime: calculateTurnaroundTime({ ...order, completionTime: currentTime }),
              };
              toast.success(`Order completed for ${order.customerName}`);
              return completedOrder;
            }
          }
          return order;
        });

        // Try to start next order if kitchen has capacity
        const waiting = updatedOrders.filter(o => o.status === 'waiting');
        const cooking = updatedOrders.filter(o => o.status === 'cooking');
        
        // Assume max 3 orders can be cooked simultaneously
        const MAX_CONCURRENT = 3;
        
        if (cooking.length < MAX_CONCURRENT && waiting.length > 0) {
          const nextOrder = scheduleNextOrder(waiting, currentTime);
          if (nextOrder) {
            updatedOrders = updatedOrders.map(order => {
              if (order.id === nextOrder.id) {
                toast.info(`Started cooking for ${order.customerName}`);
                return {
                  ...order,
                  status: 'cooking' as const,
                  startTime: currentTime,
                };
              }
              return order;
            });
          }
        }

        return updatedOrders;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSchedulerRunning]);

  const toggleScheduler = () => {
    setIsSchedulerRunning(prev => {
      const newState = !prev;
      toast.info(newState ? 'Scheduler started' : 'Scheduler paused');
      return newState;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Restaurant Management System</h1>
                <p className="text-sm text-muted-foreground">
                  Non-Preemptive Priority Scheduling
                </p>
              </div>
            </div>
            <Button
              onClick={toggleScheduler}
              size="lg"
              variant={isSchedulerRunning ? 'destructive' : 'default'}
              className="gap-2"
            >
              {isSchedulerRunning ? (
                <>
                  <Pause className="h-5 w-5" />
                  Pause Scheduler
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Start Scheduler
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Statistics */}
        <Statistics statistics={statistics} />

        {/* Order Entry and Queue */}
        <div className="grid gap-6 lg:grid-cols-2">
          <OrderEntry onAddOrder={handleAddOrder} />
          <OrderQueue orders={waitingOrders} />
        </div>

        {/* Active and Completed Orders */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ActiveOrders orders={cookingOrders} />
          <CompletedOrders orders={completedOrders} />
        </div>

        {/* Timeline Visualization */}
        <TimelineVisualization orders={orders} />
      </main>
    </div>
  );
};

export default Index;
