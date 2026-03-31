import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { type LucideIcon, Search, Users, PencilLine, Plus, Trash2, RotateCcw, CircleDot, CircleCheck, CookingPot, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Order } from '@/types/order';
import { Customer, DiningTable, TableStatus } from '@/types/kitchen';
import { toast } from 'sonner';

interface KitchenManagementProps {
  customers: Customer[];
  tables: DiningTable[];
  orders: Order[];
  onSaveCustomer: (customer: { id?: string; name: string; phone: string; notes: string }) => void;
  onDeleteCustomer: (id: string) => void;
  onSaveTable: (table: { id?: string; tableNumber: number; capacity: number; status: TableStatus; notes: string }) => void;
  onDeleteTable: (id: string) => void;
  onSetTableStatus: (id: string, status: TableStatus) => void;
  onReleaseTable: (id: string) => void;
}

type DeleteTarget =
  | { kind: 'customer'; customer: Customer }
  | { kind: 'table'; table: DiningTable }
  | null;

const tableStatusStyles: Record<TableStatus, string> = {
  available: 'bg-green-500/15 text-green-500 border-green-500/30',
  occupied: 'bg-primary/15 text-primary border-primary/30',
  reserved: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  cleaning: 'bg-muted/60 text-muted-foreground border-border',
};

const statusIcons: Record<TableStatus, LucideIcon> = {
  available: CircleCheck,
  occupied: CookingPot,
  reserved: Sparkles,
  cleaning: RotateCcw,
};

export function KitchenManagement({
  customers,
  tables,
  orders,
  onSaveCustomer,
  onDeleteCustomer,
  onSaveTable,
  onDeleteTable,
  onSetTableStatus,
  onReleaseTable,
}: KitchenManagementProps) {
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', notes: '' });
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  const [tableSearch, setTableSearch] = useState('');
  const [tableForm, setTableForm] = useState({
    tableNumber: '',
    capacity: '',
    status: 'available' as TableStatus,
    notes: '',
  });
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const customerOrderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach(order => {
      const key = order.customerName.trim().toLowerCase();
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [orders]);

  const activeOrdersByTable = useMemo(() => {
    const map = new Map<number, Order>();
    orders.forEach(order => {
      if ((order.status === 'waiting' || order.status === 'cooking') && order.tableNumber) {
        map.set(order.tableNumber, order);
      }
    });
    return map;
  }, [orders]);

  const filteredCustomers = customers.filter(customer => {
    const search = customerSearch.trim().toLowerCase();
    if (!search) return true;
    return [customer.name, customer.phone, customer.notes]
      .join(' ')
      .toLowerCase()
      .includes(search);
  });

  const filteredTables = tables.filter(table => {
    const search = tableSearch.trim().toLowerCase();
    if (!search) return true;
    return [table.tableNumber.toString(), table.capacity.toString(), table.status, table.notes, table.assignedCustomerName || '']
      .join(' ')
      .toLowerCase()
      .includes(search);
  });

  const resetCustomerForm = () => {
    setCustomerForm({ name: '', phone: '', notes: '' });
    setEditingCustomerId(null);
  };

  const resetTableForm = () => {
    setTableForm({
      tableNumber: '',
      capacity: '',
      status: 'available',
      notes: '',
    });
    setEditingTableId(null);
  };

  const handleSaveCustomer = () => {
    const name = customerForm.name.trim();
    if (!name) {
      toast.error('Customer name is required');
      return;
    }

    onSaveCustomer({
      id: editingCustomerId ?? undefined,
      name,
      phone: customerForm.phone.trim(),
      notes: customerForm.notes.trim(),
    });
    toast.success(editingCustomerId ? 'Customer updated' : 'Customer added');
    resetCustomerForm();
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone,
      notes: customer.notes,
    });
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setDeleteTarget({ kind: 'customer', customer });
  };

  const handleSaveTable = () => {
    const tableNumber = parseInt(tableForm.tableNumber, 10);
    const capacity = parseInt(tableForm.capacity, 10);

    if (Number.isNaN(tableNumber) || tableNumber < 1) {
      toast.error('Enter a valid table number');
      return;
    }

    if (Number.isNaN(capacity) || capacity < 1) {
      toast.error('Enter a valid capacity');
      return;
    }

    onSaveTable({
      id: editingTableId ?? undefined,
      tableNumber,
      capacity,
      status: tableForm.status,
      notes: tableForm.notes.trim(),
    });
    toast.success(editingTableId ? 'Table updated' : 'Table added');
    resetTableForm();
  };

  const handleEditTable = (table: DiningTable) => {
    setEditingTableId(table.id);
    setTableForm({
      tableNumber: table.tableNumber.toString(),
      capacity: table.capacity.toString(),
      status: table.status,
      notes: table.notes,
    });
  };

  const handleDeleteTable = (table: DiningTable) => {
    setDeleteTarget({ kind: 'table', table });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.kind === 'customer') {
      onDeleteCustomer(deleteTarget.customer.id);
      toast.success('Customer deleted');
      if (editingCustomerId === deleteTarget.customer.id) {
        resetCustomerForm();
      }
    } else {
      onDeleteTable(deleteTarget.table.id);
      toast.success('Table deleted');
      if (editingTableId === deleteTarget.table.id) {
        resetTableForm();
      }
    }

    setDeleteTarget(null);
  };

  return (
    <Card className="border-border/50 card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <span>Kitchen Administration</span>
        </CardTitle>
        <CardDescription>
          Customer CRUD and table management for small kitchen operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent className="border-border/50 bg-card/95 backdrop-blur-xl sm:max-w-xl">
            <AlertDialogHeader>
              <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                Delete record
              </div>
              <AlertDialogTitle className="text-xl">
                {deleteTarget?.kind === 'customer'
                  ? `Delete ${deleteTarget.customer.name}?`
                  : `Delete Table ${deleteTarget?.table.tableNumber}?`}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-6">
                {deleteTarget?.kind === 'customer' ? (
                  <span>
                    This will remove the customer profile from administration. Their past orders stay in the order log,
                    but the customer record itself will be removed.
                  </span>
                ) : (
                  <span>
                    This will remove the table from administration. If the table is tied to an active order, the delete
                    action will be blocked by the system.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {deleteTarget?.kind === 'table' && (() => {
              const activeOrder = activeOrdersByTable.get(deleteTarget.table.tableNumber);
              return (
                <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-muted/40 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Table</div>
                    <div className="mt-1 text-lg font-semibold">#{deleteTarget.table.tableNumber}</div>
                    <div className="text-sm text-muted-foreground">Capacity {deleteTarget.table.capacity}</div>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Current status</div>
                    <div className="mt-1 text-lg font-semibold capitalize">{deleteTarget.table.status}</div>
                    <div className="text-sm text-muted-foreground">
                      {activeOrder ? `Assigned to order #${activeOrder.orderNumber}` : 'No active order'}
                    </div>
                  </div>
                </div>
              );
            })()}

            {deleteTarget?.kind === 'customer' && (
              <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Customer</div>
                  <div className="mt-1 text-lg font-semibold">{deleteTarget.customer.name}</div>
                  <div className="text-sm text-muted-foreground">{deleteTarget.customer.phone || 'No phone number'}</div>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Visits</div>
                  <div className="mt-1 text-lg font-semibold">{deleteTarget.customer.visitCount}</div>
                  <div className="text-sm text-muted-foreground">Saved profile record</div>
                </div>
              </div>
            )}

            <AlertDialogFooter className="mt-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <div className="space-y-4 rounded-xl border border-border/50 bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{editingCustomerId ? 'Edit Customer' : 'Add Customer'}</h3>
                    <p className="text-xs text-muted-foreground">Create, edit, and remove customer records</p>
                  </div>
                  {editingCustomerId && (
                    <Button variant="ghost" size="sm" onClick={resetCustomerForm}>
                      Cancel
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={customerForm.name}
                    onChange={e => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Customer name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={customerForm.phone}
                    onChange={e => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={customerForm.notes}
                    onChange={e => setCustomerForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Preferences, allergies, special instructions"
                    rows={4}
                  />
                </div>

                <Button onClick={handleSaveCustomer} className="w-full gap-2">
                  {editingCustomerId ? <PencilLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingCustomerId ? 'Update Customer' : 'Add Customer'}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      placeholder="Search customers"
                      className="pl-9"
                    />
                  </div>
                  <Badge variant="secondary" className="w-fit bg-primary/10 text-primary border-primary/20">
                    {filteredCustomers.length} customers
                  </Badge>
                </div>

                <div className="rounded-xl border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Visits</TableHead>
                        <TableHead>Last Visit</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                            No customers yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCustomers.map(customer => {
                          const orderCount = customerOrderCounts.get(customer.name.trim().toLowerCase()) || 0;
                          return (
                            <TableRow key={customer.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{customer.name}</div>
                                  <div className="text-xs text-muted-foreground">{customer.notes || 'No notes'}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-muted-foreground">
                                  {customer.phone || 'No phone'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{orderCount} orders</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {customer.lastVisitAt
                                  ? formatDistanceToNow(customer.lastVisitAt, { addSuffix: true })
                                  : 'No visits yet'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditCustomer(customer)}>
                                    <PencilLine className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCustomer(customer)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tables" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <div className="space-y-4 rounded-xl border border-border/50 bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{editingTableId ? 'Edit Table' : 'Add Table'}</h3>
                    <p className="text-xs text-muted-foreground">Manage seating capacity and current state</p>
                  </div>
                  {editingTableId && (
                    <Button variant="ghost" size="sm" onClick={resetTableForm}>
                      Cancel
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Table No.</Label>
                    <Input
                      type="number"
                      min="1"
                      value={tableForm.tableNumber}
                      onChange={e => setTableForm(prev => ({ ...prev, tableNumber: e.target.value }))}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={tableForm.capacity}
                      onChange={e => setTableForm(prev => ({ ...prev, capacity: e.target.value }))}
                      placeholder="4"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={tableForm.status}
                    onValueChange={(value: TableStatus) => setTableForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={tableForm.notes}
                    onChange={e => setTableForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Window seat, family table, etc."
                    rows={4}
                  />
                </div>

                <Button onClick={handleSaveTable} className="w-full gap-2">
                  {editingTableId ? <PencilLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingTableId ? 'Update Table' : 'Add Table'}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={tableSearch}
                      onChange={e => setTableSearch(e.target.value)}
                      placeholder="Search tables"
                      className="pl-9"
                    />
                  </div>
                  <Badge variant="secondary" className="w-fit bg-primary/10 text-primary border-primary/20">
                    {filteredTables.length} tables
                  </Badge>
                </div>

                <div className="rounded-xl border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTables.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                            No tables yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTables.map(table => {
                          const activeOrder = activeOrdersByTable.get(table.tableNumber);
                          const StatusIcon = statusIcons[table.status];
                          return (
                            <TableRow key={table.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">Table {table.tableNumber}</div>
                                  <div className="text-xs text-muted-foreground">{table.notes || 'No notes'}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{table.capacity} seats</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={tableStatusStyles[table.status]} variant="outline">
                                  <StatusIcon className="mr-1 h-3.5 w-3.5" />
                                  {table.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {activeOrder ? (
                                  <div className="text-sm">
                                    <div className="font-medium">{activeOrder.customerName}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Order #{activeOrder.orderNumber} is active
                                    </div>
                                  </div>
                                ) : table.assignedCustomerName ? (
                                  <div className="text-sm">
                                    <div className="font-medium">{table.assignedCustomerName}</div>
                                    <div className="text-xs text-muted-foreground">Manual assignment</div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">No order assigned</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => onSetTableStatus(table.id, 'available')} title="Mark available">
                                    <CircleCheck className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => onSetTableStatus(table.id, 'occupied')} title="Mark occupied">
                                    <CookingPot className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => onSetTableStatus(table.id, 'reserved')} title="Mark reserved">
                                    <Sparkles className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => onSetTableStatus(table.id, 'cleaning')} title="Mark cleaning">
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => onReleaseTable(table.id)} title="Release table">
                                    <CircleDot className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleEditTable(table)} title="Edit table">
                                    <PencilLine className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTable(table)} title="Delete table">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}