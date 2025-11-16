import { Order } from '@/types/order';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';

interface TimelineVisualizationProps {
  orders: Order[];
}

export function TimelineVisualization({ orders }: TimelineVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredOrder, setHoveredOrder] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Update every second for real-time progress
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || orders.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Timeline parameters
    const padding = { top: 40, right: 20, bottom: 30, left: 150 };
    const rowHeight = 40;
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = Math.max(orders.length * rowHeight, 200);

    // Find time range
    const now = Date.now();
    const earliestTime = Math.min(...orders.map(o => o.arrivalTime));
    const latestTime = Math.max(
      now,
      ...orders.map(o => o.completionTime || o.startTime || o.arrivalTime)
    );
    const timeRange = latestTime - earliestTime || 1;

    // Helper function to convert time to x position
    const timeToX = (time: number) => {
      return padding.left + ((time - earliestTime) / timeRange) * chartWidth;
    };

    // Draw time axis
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left + chartWidth, padding.top);
    ctx.stroke();

    // Draw time labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    
    const numLabels = 5;
    for (let i = 0; i <= numLabels; i++) {
      const time = earliestTime + (timeRange / numLabels) * i;
      const x = timeToX(time);
      const label = format(time, 'HH:mm:ss');
      ctx.fillText(label, x, padding.top - 10);
      
      // Draw vertical grid line
      ctx.strokeStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.stroke();
    }

    // Draw current time indicator
    const currentX = timeToX(now);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(currentX, padding.top);
    ctx.lineTo(currentX, padding.top + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw orders
    orders.forEach((order, index) => {
      const y = padding.top + index * rowHeight + rowHeight / 2;

      // Draw order label
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      const labelText = order.customerName.length > 18 
        ? order.customerName.substring(0, 18) + '...' 
        : order.customerName;
      ctx.fillText(labelText, padding.left - 10, y + 4);

      // Draw timeline bars
      const barHeight = 24;
      const barY = y - barHeight / 2;

      // Waiting period (arrival to start)
      if (order.status !== 'waiting') {
        const waitStart = timeToX(order.arrivalTime);
        const waitEnd = timeToX(order.startTime || now);
        const waitWidth = waitEnd - waitStart;

        ctx.fillStyle = hoveredOrder === order.id ? '#fbbf24' : '#fcd34d';
        ctx.fillRect(waitStart, barY, waitWidth, barHeight);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.strokeRect(waitStart, barY, waitWidth, barHeight);
      }

      // Cooking period
      if (order.status === 'cooking' || order.status === 'completed') {
        const cookStart = timeToX(order.startTime || now);
        let cookEnd: number;
        
        if (order.status === 'completed' && order.completionTime) {
          cookEnd = timeToX(order.completionTime);
        } else if (order.status === 'cooking' && order.startTime) {
          // Calculate current progress
          const elapsed = (now - order.startTime) / (1000 * 60);
          const remaining = Math.max(0, order.burstTime - elapsed);
          const estimatedEnd = now + (remaining * 60 * 1000);
          cookEnd = timeToX(estimatedEnd);
        } else {
          cookEnd = cookStart;
        }

        const cookWidth = cookEnd - cookStart;

        if (order.status === 'completed') {
          ctx.fillStyle = hoveredOrder === order.id ? '#10b981' : '#34d399';
          ctx.strokeStyle = '#059669';
        } else {
          ctx.fillStyle = hoveredOrder === order.id ? '#f97316' : '#fb923c';
          ctx.strokeStyle = '#ea580c';
        }
        
        ctx.fillRect(cookStart, barY, cookWidth, barHeight);
        ctx.lineWidth = 1;
        ctx.strokeRect(cookStart, barY, cookWidth, barHeight);

        // Add progress pattern for cooking orders
        if (order.status === 'cooking' && order.startTime) {
          const elapsed = (now - order.startTime) / (1000 * 60);
          const progress = Math.min(1, elapsed / order.burstTime);
          const progressWidth = cookWidth * progress;

          ctx.fillStyle = 'rgba(234, 88, 12, 0.3)';
          ctx.fillRect(cookStart, barY, progressWidth, barHeight);
        }
      }

      // Waiting period for orders still waiting
      if (order.status === 'waiting') {
        const waitStart = timeToX(order.arrivalTime);
        const waitEnd = timeToX(now);
        const waitWidth = waitEnd - waitStart;

        ctx.fillStyle = hoveredOrder === order.id ? '#93c5fd' : '#bfdbfe';
        ctx.fillRect(waitStart, barY, waitWidth, barHeight);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.strokeRect(waitStart, barY, waitWidth, barHeight);

        // Pulsing effect for waiting
        const pulseAlpha = 0.3 + 0.3 * Math.sin(Date.now() / 500);
        ctx.fillStyle = `rgba(59, 130, 246, ${pulseAlpha})`;
        ctx.fillRect(waitStart, barY, waitWidth, barHeight);
      }

      // Draw priority badge
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(padding.left - 45, y - 10, 35, 20);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.strokeRect(padding.left - 45, y - 10, 35, 20);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(order.priority.toFixed(1), padding.left - 27.5, y + 3);
    });

    // Legend
    const legendY = padding.top + chartHeight + 10;
    const legendItems = [
      { color: '#bfdbfe', border: '#3b82f6', label: 'Waiting' },
      { color: '#fcd34d', border: '#f59e0b', label: 'Waited' },
      { color: '#fb923c', border: '#ea580c', label: 'Cooking' },
      { color: '#34d399', border: '#059669', label: 'Completed' },
    ];

    let legendX = padding.left;
    ctx.textAlign = 'left';
    ctx.font = '11px Inter, system-ui, sans-serif';
    
    legendItems.forEach(item => {
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, legendY, 15, 15);
      ctx.strokeStyle = item.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(legendX, legendY, 15, 15);
      
      ctx.fillStyle = '#1f2937';
      ctx.fillText(item.label, legendX + 20, legendY + 11);
      legendX += 100;
    });

  }, [orders, hoveredOrder]);

  // Handle hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rowHeight = 40;
    const padding = { top: 40, left: 150 };

    const index = Math.floor((y - padding.top) / rowHeight);
    if (index >= 0 && index < orders.length) {
      setHoveredOrder(orders[index].id);
    } else {
      setHoveredOrder(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredOrder(null);
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Timeline Visualization
          </CardTitle>
          <CardDescription>Gantt chart showing order lifecycle</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          No orders to display
        </CardContent>
      </Card>
    );
  }

  const canvasHeight = Math.max(orders.length * 40 + 100, 300);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Timeline Visualization
              <Badge variant="secondary">{orders.length} orders</Badge>
            </CardTitle>
            <CardDescription>
              Gantt chart showing order lifecycle from arrival to completion
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-warning" />
            <span>Current time indicator</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ 
              width: '100%', 
              height: canvasHeight,
              cursor: hoveredOrder ? 'pointer' : 'default'
            }}
            className="border rounded-lg"
          />
        </div>
        
        {hoveredOrder && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
            {orders.find(o => o.id === hoveredOrder) && (() => {
              const order = orders.find(o => o.id === hoveredOrder)!;
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <div className="font-medium">{order.customerName}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="font-medium capitalize">{order.status}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Priority:</span>
                    <div className="font-medium text-primary">{order.priority.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prep Time:</span>
                    <div className="font-medium">{order.burstTime} min</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
