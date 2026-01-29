import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Info, ArrowRight, Zap } from 'lucide-react';
import { Order } from '@/types/order';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AlgorithmExplanationProps {
  orders: Order[];
}

export function AlgorithmExplanation({ orders }: AlgorithmExplanationProps) {
  const waitingOrders = orders
    .filter(o => o.status === 'waiting')
    .sort((a, b) => b.priority - a.priority);

  const calculateFactors = (order: Order, currentTime: number) => {
    // Arrival factor: how long they've been waiting
    const minutesWaited = (currentTime - order.arrivalTime) / (1000 * 60);
    const arrivalFactor = minutesWaited / 60; // to hours

    // Reservation factor
    let reservationFactor = order.orderType === 'reservation' ? 1 : 0;
    if (order.reservationTime && currentTime >= order.reservationTime) {
      const minutesLate = (currentTime - order.reservationTime) / (1000 * 60);
      reservationFactor += minutesLate / 30;
    }

    // Burst factor: shorter prep time = higher priority
    const burstFactor = (30 - order.burstTime) / 30;

    return {
      arrivalFactor: arrivalFactor.toFixed(3),
      reservationFactor: reservationFactor.toFixed(3),
      burstFactor: burstFactor.toFixed(3),
      minutesWaited: minutesWaited.toFixed(1),
    };
  };

  return (
    <Card className="border-primary/30 glow-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <span>Priority Scheduling <span className="gradient-text">Algorithm</span></span>
        </CardTitle>
        <CardDescription>
          Non-Preemptive Priority Scheduling - How orders are selected
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Algorithm */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            The Priority Formula
          </h3>
          <Alert className="border-primary/30 bg-primary/5">
            <AlertDescription className="space-y-2">
              <div className="font-mono text-sm bg-background/80 p-4 rounded-xl border border-border/50">
                <span className="text-primary font-bold">Priority</span> = (0.5 × <span className="text-blue-400">Arrival</span>) + (0.3 × <span className="text-green-400">Reservation</span>) + (0.2 × <span className="text-yellow-400">Burst</span>)
              </div>
              <div className="grid md:grid-cols-3 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="font-semibold text-sm text-blue-400">Arrival Factor (50%)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    How long customer has waited. More waiting = Higher priority
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="font-semibold text-sm text-green-400">Reservation Factor (30%)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Reserved = 1.0, Walk-in = 0.0. Late reservations get bonus
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="font-semibold text-sm text-yellow-400">Burst Factor (20%)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Shorter prep time = Higher priority. Quick orders first
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        {/* Reservation vs Walk-in */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Reservation vs Walk-in</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-primary/20 text-primary border-primary/30">Reservation</Badge>
                <span className="text-sm font-semibold">Gets Priority Bonus</span>
              </div>
              <ul className="text-sm space-y-1.5 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Base bonus of 1.0 (30% weight)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Extra priority if past reservation time
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Best for pre-booked customers
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Helps honor time commitments
                </li>
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">Walk-in</Badge>
                <span className="text-sm font-semibold">Priority by Waiting</span>
              </div>
              <ul className="text-sm space-y-1.5 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  No reservation bonus (0.0)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  Priority increases as they wait
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  Good for unplanned customers
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  Eventually gets served fairly
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Live Example */}
        {waitingOrders.length >= 2 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Live Example - Next Order Selection</h3>
            <div className="space-y-3">
              {waitingOrders.slice(0, 3).map((order, index) => {
                const factors = calculateFactors(order, Date.now());
                return (
                  <div
                    key={order.id}
                    className={`p-4 rounded-xl border ${
                      index === 0
                        ? 'bg-green-500/10 border-green-500/30 glow-success'
                        : 'bg-muted/30 border-border/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Badge className="bg-green-500 text-white border-green-500">
                            NEXT TO COOK
                          </Badge>
                        )}
                        <span className="font-semibold">{order.customerName}</span>
                        <Badge 
                          variant={order.orderType === 'reservation' ? 'default' : 'secondary'}
                          className={order.orderType === 'reservation' ? 'bg-primary/20 text-primary border-primary/30' : ''}
                        >
                          {order.orderType}
                        </Badge>
                      </div>
                      <div className="text-xl font-bold text-primary">
                        Priority: {order.priority.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                        <div className="text-blue-400 font-medium">Arrival (50%)</div>
                        <div className="font-bold text-foreground mt-1">
                          {factors.arrivalFactor} × 0.5 = {(parseFloat(factors.arrivalFactor) * 0.5).toFixed(3)}
                        </div>
                        <div className="text-muted-foreground text-[10px] mt-1">
                          Waited {factors.minutesWaited}min
                        </div>
                      </div>
                      <div className="bg-green-500/10 p-3 rounded-xl border border-green-500/20">
                        <div className="text-green-400 font-medium">Reservation (30%)</div>
                        <div className="font-bold text-foreground mt-1">
                          {factors.reservationFactor} × 0.3 = {(parseFloat(factors.reservationFactor) * 0.3).toFixed(3)}
                        </div>
                        <div className="text-muted-foreground text-[10px] mt-1">
                          {order.orderType === 'reservation' ? 'Reserved' : 'Walk-in'}
                        </div>
                      </div>
                      <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                        <div className="text-yellow-400 font-medium">Burst (20%)</div>
                        <div className="font-bold text-foreground mt-1">
                          {factors.burstFactor} × 0.2 = {(parseFloat(factors.burstFactor) * 0.2).toFixed(3)}
                        </div>
                        <div className="text-muted-foreground text-[10px] mt-1">
                          {order.burstTime}min prep
                        </div>
                      </div>
                    </div>

                    {index === 0 && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-green-400 font-medium">
                        <ArrowRight className="h-4 w-4" />
                        This order has HIGHEST priority and will cook next!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* How to Use */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">How to Use This System</h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-4 p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <div className="font-semibold">Add Orders</div>
                <div className="text-muted-foreground">
                  Use "New Order Entry" to add walk-in or reservation orders. Set customer name, items, and prep time.
                </div>
              </div>
            </div>
            <div className="flex gap-4 p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <div className="font-semibold">Start Scheduler</div>
                <div className="text-muted-foreground">
                  Click "Start Scheduler" button. The system automatically picks the highest priority order every second.
                </div>
              </div>
            </div>
            <div className="flex gap-4 p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <div className="font-semibold">Watch Priority Changes</div>
                <div className="text-muted-foreground">
                  As orders wait, their priority increases. Reserved orders and quick-prep items get bonus priority.
                </div>
              </div>
            </div>
            <div className="flex gap-4 p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <div className="font-semibold">Non-Preemptive Execution</div>
                <div className="text-muted-foreground">
                  Once cooking starts, it can't be interrupted. Order completes after its full prep time.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Example Scenario */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Example Scenario</h3>
          <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-4 text-sm">
            <div className="font-semibold text-base">Q: Two orders arrive at the same time. Which cooks first?</div>
            <div className="space-y-1.5 text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                <strong>Order A:</strong> Walk-in, 30min prep time
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <strong>Order B:</strong> Reservation, 30min prep time
              </div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/30">
              <strong className="text-green-400">Answer:</strong> <span className="text-foreground">Order B (Reservation) cooks first because it has a 0.3 priority bonus from reservation factor, even though both just arrived.</span>
            </div>
            <div className="font-semibold text-base pt-2">Q: What if Order A waits longer?</div>
            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/30">
              <strong className="text-green-400">Answer:</strong> <span className="text-foreground">After ~36 minutes of waiting, Order A's arrival factor (0.5 weight) overtakes Order B's reservation bonus (0.3 weight), and Order A gets higher priority!</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
