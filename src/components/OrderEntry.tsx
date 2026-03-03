import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Order, OrderType } from '@/types/order';
import { calculatePriority } from '@/utils/scheduler';
import { Clock, User, UtensilsCrossed, Hash, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

// Common menu presets for a mini cafe / rasoi
const MENU_PRESETS: { label: string; prepTime: number }[] = [
  { label: 'Masala Chai', prepTime: 5 },
  { label: 'Filter Coffee', prepTime: 4 },
  { label: 'Cold Lassi', prepTime: 5 },
  { label: 'Vada Pav', prepTime: 8 },
  { label: 'Samosa (2 pcs)', prepTime: 6 },
  { label: 'Paneer Sandwich', prepTime: 10 },
  { label: 'Veg Thali', prepTime: 20 },
  { label: 'Paneer Tikka', prepTime: 18 },
  { label: 'Dal Makhani + Naan', prepTime: 22 },
  { label: 'Biryani (Veg)', prepTime: 25 },
  { label: 'Butter Chicken', prepTime: 20 },
  { label: 'Biryani (Chicken)', prepTime: 28 },
];

interface OrderEntryProps {
  onAddOrder: (order: Order) => void;
  nextOrderNumber: number;
}

interface FormData {
  customerName: string;
  tableNumber: number | undefined;
  items: string;
  burstTime: number;
  reservationTime?: string;
}

function OrderForm({
  orderType,
  onSubmit,
  nextOrderNumber,
}: {
  orderType: OrderType;
  onSubmit: (type: OrderType, data: FormData) => void;
  nextOrderNumber: number;
}) {
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customItem, setCustomItem] = useState('');
  const [burstTime, setBurstTime] = useState('');
  const [reservationTime, setReservationTime] = useState('');

  const togglePreset = (preset: { label: string; prepTime: number }) => {
    setSelectedItems(prev => {
      const next = prev.includes(preset.label)
        ? prev.filter(i => i !== preset.label)
        : [...prev, preset.label];
      const maxPrep = MENU_PRESETS
        .filter(p => next.includes(p.label))
        .reduce((m, p) => Math.max(m, p.prepTime), 0);
      if (maxPrep > 0) setBurstTime(String(maxPrep));
      return next;
    });
  };

  const addCustomItem = () => {
    if (!customItem.trim()) return;
    setSelectedItems(prev => [...prev, customItem.trim()]);
    setCustomItem('');
  };

  const removeItem = (item: string) => {
    setSelectedItems(prev => prev.filter(i => i !== item));
  };

  const handleSubmit = () => {
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item');
      return;
    }
    if (!burstTime || parseInt(burstTime) < 1) {
      toast.error('Please enter a valid prep time');
      return;
    }

    onSubmit(orderType, {
      customerName,
      tableNumber: tableNumber ? parseInt(tableNumber) : undefined,
      items: selectedItems.join(', '),
      burstTime: parseInt(burstTime),
      reservationTime: reservationTime || undefined,
    });

    setCustomerName('');
    setTableNumber('');
    setSelectedItems([]);
    setCustomItem('');
    setBurstTime('');
    setReservationTime('');
  };

  return (
    <div className="space-y-4">
      {/* Order number preview */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
        <Hash className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">Order #{nextOrderNumber}</span>
      </div>

      {/* Customer Name + Table Number */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Customer Name
          </Label>
          <Input
            placeholder="Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <Hash className="h-4 w-4" />
            Table No. <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            type="number"
            min="1"
            max="50"
            placeholder="e.g. 5"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
          />
        </div>
      </div>

      {/* Menu Presets */}
      <div className="space-y-2">
        <Label>Menu Items — tap to select</Label>
        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1 pb-1">
          {MENU_PRESETS.map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => togglePreset(preset)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                selectedItems.includes(preset.label)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom item input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add custom item..."
          value={customItem}
          onChange={(e) => setCustomItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
        />
        <Button type="button" variant="outline" size="icon" onClick={addCustomItem}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected items chips */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
          {selectedItems.map(item => (
            <Badge
              key={item}
              variant="secondary"
              className="flex items-center gap-1 text-xs"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="ml-1 hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Prep Time */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Prep Time (minutes)
        </Label>
        <Input
          type="number"
          min="1"
          max="120"
          placeholder="Estimated preparation time"
          value={burstTime}
          onChange={(e) => setBurstTime(e.target.value)}
        />
      </div>

      {/* Reservation Time (only for reservation tab) */}
      {orderType === 'reservation' && (
        <div className="space-y-2">
          <Label>Reservation Time</Label>
          <Input
            type="datetime-local"
            value={reservationTime}
            onChange={(e) => setReservationTime(e.target.value)}
          />
        </div>
      )}

      <Button
        onClick={handleSubmit}
        className="w-full glow-primary font-semibold"
        size="lg"
      >
        {orderType === 'walk-in' ? 'Add Walk-in Order' : 'Add Reservation Order'}
      </Button>
    </div>
  );
}

export function OrderEntry({ onAddOrder, nextOrderNumber }: OrderEntryProps) {
  const handleSubmit = (orderType: OrderType, data: FormData) => {
    const currentTime = Date.now();
    let reservationTimestamp: number | undefined;

    if (orderType === 'reservation' && data.reservationTime) {
      reservationTimestamp = new Date(data.reservationTime).getTime();
      if (reservationTimestamp < currentTime) {
        toast.error('Reservation time cannot be in the past');
        return;
      }
    }

    const newOrder: Order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderNumber: nextOrderNumber,
      customerName: data.customerName.trim(),
      tableNumber: data.tableNumber,
      orderType,
      items: data.items,
      arrivalTime: currentTime,
      reservationTime: reservationTimestamp,
      burstTime: data.burstTime,
      priority: 0,
      status: 'waiting',
    };

    newOrder.priority = calculatePriority(newOrder, currentTime);
    onAddOrder(newOrder);
    toast.success(`Order #${nextOrderNumber} added for ${data.customerName}`);
  };

  return (
    <Card className="border-border/50 card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
          </div>
          <span>New Order Entry</span>
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

          <TabsContent value="walk-in" className="mt-4">
            <OrderForm orderType="walk-in" onSubmit={handleSubmit} nextOrderNumber={nextOrderNumber} />
          </TabsContent>

          <TabsContent value="reservation" className="mt-4">
            <OrderForm orderType="reservation" onSubmit={handleSubmit} nextOrderNumber={nextOrderNumber} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
