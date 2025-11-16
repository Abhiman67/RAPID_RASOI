import { Statistics as StatsType } from '@/types/order';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';

interface StatisticsProps {
  statistics: StatsType;
}

export function Statistics({ statistics }: StatisticsProps) {
  const stats = [
    {
      title: 'Total Orders',
      value: statistics.totalOrders,
      icon: BarChart3,
      description: 'All orders received',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Completed',
      value: statistics.completedOrders,
      icon: CheckCircle2,
      description: 'Successfully served',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Avg Wait Time',
      value: `${statistics.averageWaitingTime.toFixed(1)}m`,
      icon: Clock,
      description: 'Time before cooking',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Avg Turnaround',
      value: `${statistics.averageTurnaroundTime.toFixed(1)}m`,
      icon: TrendingUp,
      description: 'Total time per order',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
