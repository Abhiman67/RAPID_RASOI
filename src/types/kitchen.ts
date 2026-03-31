export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: number;
  lastVisitAt?: number;
  visitCount: number;
}

export interface DiningTable {
  id: string;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  notes: string;
  assignedOrderId?: string;
  assignedCustomerName?: string;
  updatedAt: number;
}