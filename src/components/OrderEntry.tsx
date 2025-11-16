import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Order, OrderType } from '@/types/order';
import { calculatePriority } from '@/utils/scheduler';
import { Clock, User, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

interface OrderEntryProps {
  onAddOrder: (order: Order) => void;
}

export function OrderEntry({ onAddOrder }: OrderEntryProps) {
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState('');
  const [burstTime, setBurstTime] = useState('');
  const [reservationTime, setReservationTime] = useState('');

  const handleSubmit = (orderType: OrderType) => {
    if (!customerName.trim() || !items.trim() || !burstTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    const currentTime = Date.now();
    let reservationTimestamp: number | undefined;

    if (orderType === 'reservation' && reservationTime) {
      reservationTimestamp = new Date(reservationTime).getTime();
      if (reservationTimestamp < currentTime) {
        toast.error('Reservation time cannot be in the past');
        return;
      }
    }

    const newOrder: Order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerName: customerName.trim(),
      orderType,
      items: items.trim(),
      arrivalTime: currentTime,
      reservationTime: reservationTimestamp,
      burstTime: parseInt(burstTime),
      priority: 0,
      status: 'waiting',
    };

    // Calculate initial priority
    newOrder.priority = calculatePriority(newOrder, currentTime);

    onAddOrder(newOrder);

    // Reset form
    setCustomerName('');
    setItems('');
    setBurstTime('');
    setReservationTime('');

    toast.success(`Order added for ${customerName}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          New Order Entry
        </CardTitle>
        <CardDescription>
          Add walk-in or reservation orders to the queue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="walk-in" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="walk-in">Walk-in</TabsTrigger>
            <TabsTrigger value="reservation">Reservation</TabsTrigger>
          </TabsList>

          <TabsContent value="walk-in" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="walk-in-name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Name
              </Label>
              <Input
                id="walk-in-name"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="walk-in-items">Order Items</Label>
              <Input
                id="walk-in-items"
                placeholder="e.g., 2x Burger, 1x Pasta, 1x Salad"
                value={items}
                onChange={(e) => setItems(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="walk-in-burst" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Prep Time (minutes)
              </Label>
              <Input
                id="walk-in-burst"
                type="number"
                min="1"
                max="120"
                placeholder="Estimated preparation time"
                value={burstTime}
                onChange={(e) => setBurstTime(e.target.value)}
              />
            </div>

            <Button
              onClick={() => handleSubmit('walk-in')}
              className="w-full"
              size="lg"
            >
              Add Walk-in Order
            </Button>
          </TabsContent>

          <TabsContent value="reservation" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reservation-name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Name
              </Label>
              <Input
                id="reservation-name"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-items">Order Items</Label>
              <Input
                id="reservation-items"
                placeholder="e.g., 2x Burger, 1x Pasta, 1x Salad"
                value={items}
                onChange={(e) => setItems(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-burst" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Prep Time (minutes)
              </Label>
              <Input
                id="reservation-burst"
                type="number"
                min="1"
                max="120"
                placeholder="Estimated preparation time"
                value={burstTime}
                onChange={(e) => setBurstTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-time">Reservation Time</Label>
              <Input
                id="reservation-time"
                type="datetime-local"
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
              />
            </div>

            <Button
              onClick={() => handleSubmit('reservation')}
              className="w-full"
              size="lg"
            >
              Add Reservation Order
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
