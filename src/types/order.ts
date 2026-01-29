export type OrderStatus = 'waiting' | 'cooking' | 'completed';

export type OrderType = 'walk-in' | 'reservation';

export interface Order {
  id: string;
  customerName: string;
  orderType: OrderType;
  items: string;
  arrivalTime: number; // timestamp in ms
  reservationTime?: number; // timestamp in ms (only for reservations)
  burstTime: number; // estimated preparation time in minutes
  priority: number; // calculated priority score
  status: OrderStatus;
  startTime?: number; // when cooking started
  completionTime?: number; // when completed
  waitingTime?: number; // actual waiting time in minutes
  turnaroundTime?: number; // total time from arrival to completion
}

export interface Statistics {
  totalOrders: number;
  completedOrders: number;
  averageWaitingTime: number;
  averageTurnaroundTime: number;
  throughput: number; // orders per hour
}
