import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Info, ArrowRight } from 'lucide-react';
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
    const arrivalFactor = minutesWaited / 60; // Normalize to hours

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
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Priority Scheduling Algorithm Explained
        </CardTitle>
        <CardDescription>
          Non-Preemptive Priority Scheduling - How orders are selected
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Algorithm */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            The Priority Formula
          </h3>
          <Alert>
            <AlertDescription className="space-y-2">
              <div className="font-mono text-sm bg-muted p-3 rounded">
                Priority = (0.5 × Arrival) + (0.3 × Reservation) + (0.2 × Burst)
              </div>
              <div className="grid md:grid-cols-3 gap-3 mt-3">
                <div>
                  <div className="font-semibold text-sm">Arrival Factor (50%)</div>
                  <div className="text-xs text-muted-foreground">
                    How long customer has waited. More waiting = Higher priority
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-sm">Reservation Factor (30%)</div>
                  <div className="text-xs text-muted-foreground">
                    Reserved = 1.0, Walk-in = 0.0. Late reservations get bonus
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-sm">Burst Factor (20%)</div>
                  <div className="text-xs text-muted-foreground">
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
          <div className="grid md:grid-cols-2 gap-3">
            <div className="p-3 border rounded-lg bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">Reservation</Badge>
                <span className="text-sm font-semibold">Gets Priority Bonus</span>
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Base bonus of 1.0 (30% weight)</li>
                <li>✓ Extra priority if past reservation time</li>
                <li>✓ Best for pre-booked customers</li>
                <li>✓ Helps honor time commitments</li>
              </ul>
            </div>
            <div className="p-3 border rounded-lg bg-secondary/5">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">Walk-in</Badge>
                <span className="text-sm font-semibold">Priority by Waiting</span>
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• No reservation bonus (0.0)</li>
                <li>• Priority increases as they wait</li>
                <li>• Good for unplanned customers</li>
                <li>• Eventually gets served fairly</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Live Example */}
        {waitingOrders.length >= 2 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Live Example - Next Order Selection</h3>
            <div className="space-y-2">
              {waitingOrders.slice(0, 3).map((order, index) => {
                const factors = calculateFactors(order, Date.now());
                return (
                  <div
                    key={order.id}
                    className={`p-3 rounded-lg border ${
                      index === 0
                        ? 'bg-success/10 border-success/30'
                        : 'bg-muted/50 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Badge variant="default" className="bg-success">
                            NEXT TO COOK
                          </Badge>
                        )}
                        <span className="font-semibold">{order.customerName}</span>
                        <Badge variant={order.orderType === 'reservation' ? 'default' : 'secondary'}>
                          {order.orderType}
                        </Badge>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        Priority: {order.priority.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-background/50 p-2 rounded">
                        <div className="text-muted-foreground">Arrival (50%)</div>
                        <div className="font-semibold">
                          {factors.arrivalFactor} × 0.5 = {(parseFloat(factors.arrivalFactor) * 0.5).toFixed(3)}
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          Waited {factors.minutesWaited}min
                        </div>
                      </div>
                      <div className="bg-background/50 p-2 rounded">
                        <div className="text-muted-foreground">Reservation (30%)</div>
                        <div className="font-semibold">
                          {factors.reservationFactor} × 0.3 = {(parseFloat(factors.reservationFactor) * 0.3).toFixed(3)}
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          {order.orderType === 'reservation' ? 'Reserved' : 'Walk-in'}
                        </div>
                      </div>
                      <div className="bg-background/50 p-2 rounded">
                        <div className="text-muted-foreground">Burst (20%)</div>
                        <div className="font-semibold">
                          {factors.burstFactor} × 0.2 = {(parseFloat(factors.burstFactor) * 0.2).toFixed(3)}
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          {order.burstTime}min prep
                        </div>
                      </div>
                    </div>

                    {index === 0 && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-success font-medium">
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
          <div className="space-y-2 text-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <div className="font-semibold">Add Orders</div>
                <div className="text-muted-foreground">
                  Use "New Order Entry" to add walk-in or reservation orders. Set customer name, items, and prep time.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <div className="font-semibold">Start Scheduler</div>
                <div className="text-muted-foreground">
                  Click "Start Scheduler" button. The system automatically picks the highest priority order every second.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <div className="font-semibold">Watch Priority Changes</div>
                <div className="text-muted-foreground">
                  As orders wait, their priority increases. Reserved orders and quick-prep items get bonus priority.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
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
          <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
            <div className="font-semibold">Q: Two orders arrive at the same time. Which cooks first?</div>
            <div className="space-y-1 text-muted-foreground">
              <div>• <strong>Order A:</strong> Walk-in, 30min prep time</div>
              <div>• <strong>Order B:</strong> Reservation, 30min prep time</div>
            </div>
            <div className="mt-2 p-2 bg-success/10 rounded border border-success/20">
              <strong className="text-success">Answer:</strong> Order B (Reservation) cooks first because it has a 0.3 priority bonus from reservation factor, even though both just arrived.
            </div>
            <div className="mt-3 font-semibold">Q: What if Order A waits longer?</div>
            <div className="mt-2 p-2 bg-success/10 rounded border border-success/20">
              <strong className="text-success">Answer:</strong> After ~36 minutes of waiting, Order A's arrival factor (0.5 weight) overtakes Order B's reservation bonus (0.3 weight), and Order A gets higher priority!
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
