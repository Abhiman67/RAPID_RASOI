import { useState, useEffect, useCallback } from 'react';
import { Order, Statistics as StatsType } from '@/types/order';
import { OrderEntry } from '@/components/OrderEntry';
import { OrderQueue } from '@/components/OrderQueue';
import { ActiveOrders } from '@/components/ActiveOrders';
import { CompletedOrders } from '@/components/CompletedOrders';
import { Statistics } from '@/components/Statistics';
import { TimelineVisualization } from '@/components/TimelineVisualization';
import { AlgorithmExplanation } from '@/components/AlgorithmExplanation';
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
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary rounded-xl glow-primary">
                <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Rapid <span className="gradient-text">Rasoi</span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Non-Preemptive Priority Scheduling
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={toggleScheduler}
                size="lg"
                variant={isSchedulerRunning ? 'destructive' : 'default'}
                className={`gap-2 font-semibold ${!isSchedulerRunning ? 'glow-primary' : ''}`}
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
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <span>Operating System Scheduling Simulation</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Smart Restaurant <span className="gradient-text">Order Management</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Experience how operating system scheduling algorithms optimize kitchen workflows. 
            Watch priorities adapt in real-time based on waiting time, order type, and prep duration.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Statistics */}
        <Statistics statistics={statistics} />

        {/* Algorithm Explanation */}
        <AlgorithmExplanation orders={orders} />

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

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary rounded-lg">
                  <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">Rapid Rasoi</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A simulation of Non-Preemptive Priority Scheduling algorithm applied to restaurant order management.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Key Concepts</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Non-Preemptive Scheduling
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Priority Queue Management
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Dynamic Priority Calculation
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Turnaround & Waiting Time
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Project Info</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Operating Systems Project</li>
                <li>Built with React + TypeScript</li>
                <li>Styled with Tailwind CSS</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Rapid Rasoi — OS Scheduling Simulation</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
