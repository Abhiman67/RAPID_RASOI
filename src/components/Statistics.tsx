import { Statistics as StatsType } from '@/types/order';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Clock, TrendingUp, CheckCircle2, Zap } from 'lucide-react';

interface StatisticsProps {
  statistics: StatsType;
}

export function Statistics({ statistics }: StatisticsProps) {
  const stats = [
    {
      title: 'Total Orders',
      value: statistics.totalOrders,
      icon: BarChart3,
      description: `${statistics.cancelledOrders > 0 ? `${statistics.cancelledOrders} cancelled` : 'All orders received'}`,
      gradient: 'from-primary/20 to-primary/5',
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary',
      valueColor: 'text-primary',
      glowClass: 'hover:glow-primary',
    },
    {
      title: 'Completed',
      value: statistics.completedOrders,
      icon: CheckCircle2,
      description: 'Successfully served',
      gradient: 'from-green-500/20 to-green-500/5',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-500',
      valueColor: 'text-green-500',
      glowClass: 'hover:glow-success',
    },
    {
      title: 'Avg Wait Time',
      value: `${statistics.averageWaitingTime.toFixed(1)}m`,
      icon: Clock,
      description: 'Time in queue before cooking',
      gradient: 'from-yellow-500/20 to-yellow-500/5',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-500',
      valueColor: 'text-yellow-500',
      glowClass: 'hover:glow-warning',
    },
    {
      title: 'Throughput',
      value: statistics.throughput > 0 ? `${statistics.throughput.toFixed(1)}/hr` : '—',
      icon: Zap,
      description: 'Completed orders per hour',
      gradient: 'from-blue-500/20 to-blue-500/5',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-500',
      valueColor: 'text-blue-500',
      glowClass: '',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className={`relative overflow-hidden border-border/50 transition-all duration-300 ${stat.glowClass} hover:border-primary/30`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
          <CardContent className="relative pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${stat.valueColor} mb-1`}>
              {stat.value}
            </div>
            <div className="text-sm font-medium text-foreground mb-0.5">
              {stat.title}
            </div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
