import { useState, useEffect, useCallback, useRef } from 'react';
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
import { UtensilsCrossed, Play, Pause, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'rapid-rasoi-orders';
const SESSION_KEY = 'rapid-rasoi-session-start';

const Index = () => {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);
  const sessionStartRef = useRef<number>(
    (() => {
      const saved = localStorage.getItem(SESSION_KEY);
      const t = saved ? parseInt(saved) : Date.now();
      if (!saved) localStorage.setItem(SESSION_KEY, String(t));
      return t;
    })()
  );

  // Persist orders to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch { /* quota exceeded */ }
  }, [orders]);

  const waitingOrders = orders.filter(o => o.status === 'waiting');
  const cookingOrders = orders.filter(o => o.status === 'cooking');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  // Next order number = highest orderNumber so far + 1
  const nextOrderNumber = orders.length > 0
    ? Math.max(...orders.map(o => o.orderNumber ?? 0)) + 1
    : 1;

  // Throughput: completed orders per hour since session start
  const sessionElapsedHours = (Date.now() - sessionStartRef.current) / (1000 * 60 * 60);
  const throughput = sessionElapsedHours > 0 && completedOrders.length > 0
    ? completedOrders.length / sessionElapsedHours
    : 0;

  // Calculate statistics
  const statistics: StatsType = {
    totalOrders: orders.filter(o => o.status !== 'cancelled').length,
    completedOrders: completedOrders.length,
    cancelledOrders: cancelledOrders.length,
    averageWaitingTime: completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => sum + (o.waitingTime || 0), 0) / completedOrders.length
      : 0,
    averageTurnaroundTime: completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => sum + (o.turnaroundTime || 0), 0) / completedOrders.length
      : 0,
    throughput,
  };

  // Add new order
  const handleAddOrder = useCallback((order: Order) => {
    setOrders(prev => [...prev, order]);
  }, []);

  // Cancel a waiting order
  const handleCancelOrder = useCallback((id: string) => {
    setOrders(prev => prev.map(o =>
      o.id === id && o.status === 'waiting'
        ? { ...o, status: 'cancelled' as const }
        : o
    ));
    toast.warning('Order cancelled');
  }, []);

  // Reset / end-of-day
  const handleReset = () => {
    if (!window.confirm('Clear all orders and start a new session? This cannot be undone.')) return;
    setOrders([]);
    setIsSchedulerRunning(false);
    const now = Date.now();
    sessionStartRef.current = now;
    localStorage.setItem(SESSION_KEY, String(now));
    toast.info('Session reset — ready for a new shift!');
  };

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
              toast.success(`✅ Order #${order.orderNumber} ready — ${order.customerName}`);
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
                toast.info(`🍳 Cooking #${order.orderNumber} — ${order.customerName}`);
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
                onClick={handleReset}
                size="lg"
                variant="outline"
                className="gap-2 font-semibold text-muted-foreground"
                title="Clear all orders — end of shift"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">New Shift</span>
              </Button>
              <Button
                onClick={toggleScheduler}
                size="lg"
                variant={isSchedulerRunning ? 'destructive' : 'default'}
                className={`gap-2 font-semibold ${!isSchedulerRunning ? 'glow-primary' : ''}`}
              >
                {isSchedulerRunning ? (
                  <>
                    <Pause className="h-5 w-5" />
                    <span className="hidden sm:inline">Pause Scheduler</span>
                    <span className="sm:hidden">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    <span className="hidden sm:inline">Start Scheduler</span>
                    <span className="sm:hidden">Start</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 py-6 md:py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs md:text-sm font-medium mb-4 md:mb-6">
            <span>OS Scheduling Simulation</span>
          </div>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 md:mb-4">
            Smart Restaurant <span className="gradient-text">Order Management</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
            Priority scheduling for your kitchen — reservations and waiting time handled automatically.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Statistics */}
        <Statistics statistics={statistics} />

        {/* Order Entry and Queue */}
        <div className="grid gap-6 lg:grid-cols-2">
          <OrderEntry onAddOrder={handleAddOrder} nextOrderNumber={nextOrderNumber} />
          <OrderQueue orders={waitingOrders} onCancelOrder={handleCancelOrder} />
        </div>

        {/* Active and Completed Orders */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ActiveOrders orders={cookingOrders} />
          <CompletedOrders orders={completedOrders} />
        </div>

        {/* Timeline Visualization */}
        <TimelineVisualization orders={orders} />

        {/* Algorithm Explanation */}
        <AlgorithmExplanation orders={orders} />
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
                <li className="pt-1">
                  <a
                    href="https://github.com/Abhiman67"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    github.com/Abhiman67
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Rapid Rasoi — OS Scheduling Simulation &nbsp;·&nbsp;
              <a
                href="https://github.com/Abhiman67"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @Abhiman67
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
