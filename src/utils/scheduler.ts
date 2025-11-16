import { Order } from '@/types/order';

/**
 * Non-Preemptive Priority Scheduling Algorithm
 * 
 * Priority Calculation Formula:
 * Priority = (W_arrival * ArrivalFactor) + (W_reservation * ReservationFactor) + (W_burst * BurstFactor)
 * 
 * Where:
 * - ArrivalFactor: How long the customer has been waiting (higher = more priority)
 * - ReservationFactor: Bonus for reserved customers (binary: 1 or 0)
 * - BurstFactor: Inverse of preparation time (shorter prep = higher priority)
 * 
 * Weights (can be adjusted):
 * - W_arrival = 0.5 (50% weight on waiting time)
 * - W_reservation = 0.3 (30% weight on reservation status)
 * - W_burst = 0.2 (20% weight on preparation time)
 */

const WEIGHTS = {
  arrival: 0.5,
  reservation: 0.3,
  burst: 0.2,
};

export function calculatePriority(order: Order, currentTime: number): number {
  // Arrival factor: minutes waited (normalized by dividing by 60)
  const minutesWaited = (currentTime - order.arrivalTime) / (1000 * 60);
  const arrivalFactor = minutesWaited / 60; // Normalize to hours

  // Reservation factor: 1 if reserved, 0 if walk-in
  // Additional bonus if they arrived before reservation time
  let reservationFactor = order.orderType === 'reservation' ? 1 : 0;
  if (order.reservationTime && currentTime >= order.reservationTime) {
    // Extra priority if past reservation time
    const minutesLate = (currentTime - order.reservationTime) / (1000 * 60);
    reservationFactor += minutesLate / 30; // Add urgency for late reservations
  }

  // Burst factor: inverse of preparation time (shorter = higher priority)
  // Normalize by typical prep time (30 minutes)
  const burstFactor = (30 - order.burstTime) / 30;

  // Calculate weighted priority
  const priority = 
    (WEIGHTS.arrival * arrivalFactor) +
    (WEIGHTS.reservation * reservationFactor) +
    (WEIGHTS.burst * burstFactor);

  return Math.max(0, priority); // Ensure non-negative
}

/**
 * Non-Preemptive Priority Scheduler
 * Selects the next order to process based on highest priority
 * Once an order starts cooking, it cannot be interrupted
 */
export function scheduleNextOrder(
  waitingOrders: Order[],
  currentTime: number
): Order | null {
  if (waitingOrders.length === 0) return null;

  // Calculate current priorities for all waiting orders
  const ordersWithPriority = waitingOrders.map(order => ({
    order,
    priority: calculatePriority(order, currentTime),
  }));

  // Sort by priority (highest first), then by arrival time (FCFS for ties)
  ordersWithPriority.sort((a, b) => {
    if (Math.abs(a.priority - b.priority) < 0.001) {
      // If priorities are very close, use FCFS
      return a.order.arrivalTime - b.order.arrivalTime;
    }
    return b.priority - a.priority;
  });

  return ordersWithPriority[0].order;
}

/**
 * Calculate waiting time (arrival to cooking start)
 */
export function calculateWaitingTime(order: Order): number {
  if (!order.startTime) return 0;
  return (order.startTime - order.arrivalTime) / (1000 * 60); // in minutes
}

/**
 * Calculate turnaround time (arrival to completion)
 */
export function calculateTurnaroundTime(order: Order): number {
  if (!order.completionTime) return 0;
  return (order.completionTime - order.arrivalTime) / (1000 * 60); // in minutes
}

/**
 * Estimate waiting time for a new order based on current queue
 */
export function estimateWaitingTime(
  waitingOrders: Order[],
  cookingOrders: Order[],
  newOrder: Order,
  currentTime: number
): number {
  // Calculate total cooking time remaining for active orders
  let totalRemainingTime = 0;
  cookingOrders.forEach(order => {
    if (order.startTime) {
      const elapsed = (currentTime - order.startTime) / (1000 * 60);
      const remaining = Math.max(0, order.burstTime - elapsed);
      totalRemainingTime += remaining;
    }
  });

  // Simulate scheduling with the new order added
  const simulatedQueue = [...waitingOrders, newOrder];
  const ordersWithPriority = simulatedQueue.map(order => ({
    order,
    priority: calculatePriority(order, currentTime),
  }));

  ordersWithPriority.sort((a, b) => {
    if (Math.abs(a.priority - b.priority) < 0.001) {
      return a.order.arrivalTime - b.order.arrivalTime;
    }
    return b.priority - a.priority;
  });

  // Find position of new order in queue
  const position = ordersWithPriority.findIndex(item => item.order.id === newOrder.id);
  
  // Calculate estimated wait time based on orders ahead
  let estimatedWait = totalRemainingTime;
  for (let i = 0; i < position; i++) {
    estimatedWait += ordersWithPriority[i].order.burstTime;
  }

  return estimatedWait;
}
