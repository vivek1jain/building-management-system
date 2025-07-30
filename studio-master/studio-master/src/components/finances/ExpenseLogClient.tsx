
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, AlertTriangle, ReceiptText, PackageOpen, Edit2, Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AddExpenseDialog } from './AddExpenseDialog';
import { getExpenses, type Expense } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, getQuarter as getCalendarQuarter, getYear, toDate as dateFnsToDate } from 'date-fns';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Timestamp } from 'firebase/firestore';


interface ExpenseLogClientProps {
    onExpensesUpdated: () => void;
    buildingId: string;
}

type SortableExpenseKeys = keyof Pick<Expense, 'date' | 'description' | 'categoryName' | 'amount' | 'supplierName'> | 'quarter';


interface SortConfig {
  key: SortableExpenseKeys | null;
  direction: 'ascending' | 'descending';
}

interface ColumnConfig {
  id: SortableExpenseKeys | 'actions' | 'notes';
  label: string;
  minWidth: number;
  defaultWidth: number;
  isResizable: boolean;
  sortable: boolean;
  accessor?: (expense: Expense, quarterString: string) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

// Simplified to always use calendar quarters as building-specific FY start is removed
const getFinancialQuarter = (date: Date | Timestamp): string => {
    const expenseDate = date instanceof Date ? date : date.toDate();
    const qNum = getCalendarQuarter(expenseDate);
    const yearNum = getYear(expenseDate);
    return `${yearNum}-Q${qNum}`;
};


export function ExpenseLogClient({ onExpensesUpdated, buildingId }: ExpenseLogClientProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = React.useState(false);
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'date', direction: 'descending' });


  const initialColumnConfigInternal: ColumnConfig[] = React.useMemo(() => [
    { id: 'date', label: 'Date', minWidth: 90, defaultWidth: 110, isResizable: true, sortable: true, accessor: (e) => format(dateFnsToDate(e.date), 'PP') },
    { id: 'quarter', label: 'Fin. Quarter', minWidth: 100, defaultWidth: 130, isResizable: true, sortable: true, accessor: (e, quarterString) => quarterString },
    { id: 'description', label: 'Description', minWidth: 150, defaultWidth: 250, isResizable: true, sortable: true,
      accessor: (e) => <Tooltip><TooltipTrigger asChild><span className="font-medium max-w-xs truncate">{e.description}</span></TooltipTrigger><TooltipContent side="bottom" className="max-w-xs bg-background text-foreground border-border shadow-lg"><p>{e.description}</p></TooltipContent></Tooltip>,
      cellClassName: "text-left"
    },
    { id: 'categoryName', label: 'Category', minWidth: 100, defaultWidth: 150, isResizable: true, sortable: true,
      accessor: (e) => <Badge variant={"outline"} className="text-xs">{e.categoryName}</Badge>
    },
    { id: 'amount', label: 'Amount', minWidth: 80, defaultWidth: 120, isResizable: true, sortable: true,
      accessor: (e) => formatCurrency(e.amount), headerClassName: "text-right", cellClassName: "text-right font-semibold text-primary"
    },
    { id: 'supplierName', label: 'Supplier', minWidth: 100, defaultWidth: 150, isResizable: true, sortable: true,
      accessor: (e) => e.supplierName || <span className="text-muted-foreground/70 italic">N/A</span>
    },
    { id: 'notes', label: 'Notes', minWidth: 100, defaultWidth: 180, isResizable: true, sortable: false,
      accessor: (e) => e.notes ? <Tooltip><TooltipTrigger asChild><span className="truncate">{e.notes}</span></TooltipTrigger><TooltipContent side="bottom" className="max-w-xs bg-background text-foreground border-border shadow-lg"><p className="whitespace-pre-wrap">{e.notes}</p></TooltipContent></Tooltip> : <span className="text-muted-foreground/70 italic">None</span>,
      cellClassName: "text-left"
    },
    { id: 'actions', label: 'Actions', minWidth: 120, defaultWidth: 120, isResizable: false, sortable: false,
      accessor: () => (
        <div className="space-x-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled><Eye className="h-4 w-4" /><span className="sr-only">View Details</span></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled><Edit2 className="h-4 w-4" /><span className="sr-only">Edit Expense</span></Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7" disabled><Trash2 className="h-4 w-4" /><span className="sr-only">Delete Expense</span></Button>
        </div>
      ), headerClassName: "text-right", cellClassName: "text-right"
    },
  ], []);


  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>(
    initialColumnConfigInternal.reduce((acc, col) => ({ ...acc, [col.id]: col.defaultWidth }), {})
  );
  const activeResizer = React.useRef<string | null>(null);
  const startX = React.useRef<number>(0);
  const startWidth = React.useRef<number>(0);

  const fetchExpenses = React.useCallback(async () => {
    if (!user) {
        setExpenses([]);
        setIsLoadingExpenses(false);
        return;
    }
    setIsLoadingExpenses(true);
    setError(null);
    try {
      const fetchedExpenses = await getExpenses(buildingId);
      setExpenses(fetchedExpenses);
    } catch (err: any) {
      setError(err.message || "Failed to load expenses.");
      toast({ title: "Error Loading Expenses", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingExpenses(false);
    }
  }, [user, toast, buildingId]);

  React.useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses, onExpensesUpdated]);

  const handleLogNewExpense = () => {
    setIsAddExpenseDialogOpen(true);
  };

  const handleExpenseAdded = () => {
    toast({ title: "Expense Log Updated", description: "The expense list and financial summary will refresh."});
    onExpensesUpdated();
  };

  const requestSort = (key: SortableExpenseKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortableExpenseKeys) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50 group-hover:opacity-100" />;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-1 h-3 w-3 text-primary" />;
    return <ArrowDown className="ml-1 h-3 w-3 text-primary" />;
  };

  const displayedExpenses = React.useMemo(() => {
    let sortedExpenses = [...expenses];
    if (sortConfig.key) {
      sortedExpenses.sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key === 'quarter') {
            aValue = getFinancialQuarter(a.date);
            bValue = getFinancialQuarter(b.date);
        } else {
            aValue = a[sortConfig.key as keyof Expense];
            bValue = b[sortConfig.key as keyof Expense];
        }

        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue > bValue ? 1 : -1;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() > bValue.getTime() ? 1 : -1;
        } else if (aValue instanceof Timestamp && bValue instanceof Timestamp) {
          comparison = aValue.toMillis() > bValue.toMillis() ? 1 : -1;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        return sortConfig.direction === 'ascending' ? comparison : comparison * -1;
      });
    }
    return sortedExpenses;
  }, [expenses, sortConfig]);

  const handleMouseDown = (columnId: string, event: React.MouseEvent<HTMLDivElement>) => {
    activeResizer.current = columnId;
    startX.current = event.clientX;
    startWidth.current = columnWidths[columnId];
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  React.useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!activeResizer.current) return;
      const newWidth = startWidth.current + (event.clientX - startX.current);
      const columnConf = initialColumnConfigInternal.find(col => col.id === activeResizer.current);
      if (columnConf && newWidth >= columnConf.minWidth) {
        setColumnWidths(prev => ({ ...prev, [activeResizer.current!]: newWidth }));
      }
    };
    const handleMouseUp = () => {
      if (!activeResizer.current) return;
      activeResizer.current = null;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (activeResizer.current) {
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };
  }, [initialColumnConfigInternal]);


  if (isLoadingExpenses) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
            <Skeleton className="h-10 w-36" />
        </div>
        <div className="rounded-lg border shadow-md">
          <Table style={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHeader>
              <TableRow>
                {initialColumnConfigInternal.map(col => (
                  <TableHead key={col.id} style={{ width: `${columnWidths[col.id] || col.defaultWidth}px` }} className="text-center">
                    <Skeleton className="h-5 w-full" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                   {initialColumnConfigInternal.map(col => (
                    <TableCell key={`${col.id}-skeleton-${i}`} style={{ width: `${columnWidths[col.id] || col.defaultWidth}px` }} className="text-center">
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
        <p className="font-semibold">Error loading expenses:</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleLogNewExpense}>
            <PlusCircle className="mr-2 h-4 w-4" /> Log New Expense
          </Button>
        </div>

        {displayedExpenses.length === 0 ? (
             <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center bg-muted/30">
                <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground/70 mb-3" />
                <h3 className="text-lg font-medium text-muted-foreground">No Expenses Logged Yet</h3>
                <p className="text-sm text-muted-foreground/80 mt-1">
                    Click the button above to log your first operational expense.
                </p>
            </div>
        ) : (
        <div className="overflow-x-auto rounded-lg border shadow-md">
          <Table style={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHeader>
              <TableRow>
                {initialColumnConfigInternal.map(col => (
                  <TableHead
                    key={col.id}
                    style={{ width: `${columnWidths[col.id] || col.defaultWidth}px`, position: 'relative' }}
                    className={cn("p-0 group/header text-center", col.headerClassName)}
                  >
                    <Button
                      variant="ghost"
                      size="xs"
                      className="w-full h-full justify-center p-2 text-xs text-center font-medium text-muted-foreground hover:bg-muted/80"
                      onClick={() => col.sortable ? requestSort(col.id as SortableExpenseKeys) : undefined}
                    >
                      {col.label}
                      {col.sortable && getSortIndicator(col.id as SortableExpenseKeys)}
                    </Button>
                    {col.isResizable && (
                      <div
                        onMouseDown={(e) => handleMouseDown(col.id, e)}
                        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none touch-none bg-border/30 hover:bg-primary/30 opacity-0 group-hover/header:opacity-100 transition-opacity"
                        style={{ zIndex: 10 }}
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedExpenses.map((expense) => {
                const quarterString = getFinancialQuarter(expense.date);
                return (
                    <TableRow key={expense.id}>
                    {initialColumnConfigInternal.map(colConfig => (
                        <TableCell
                            key={`${expense.id}-${colConfig.id}`}
                            style={{ width: `${columnWidths[colConfig.id] || col.defaultWidth}px` }}
                            className={cn("py-2.5 px-2 text-xs text-center truncate", colConfig.cellClassName)}
                        >
                        {colConfig.accessor ? colConfig.accessor(expense, quarterString) : String((expense as any)[colConfig.id] ?? '')}
                        </TableCell>
                    ))}
                    </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        )}
      </div>
      <AddExpenseDialog
        isOpen={isAddExpenseDialogOpen}
        onOpenChange={setIsAddExpenseDialogOpen}
        onExpenseAdded={handleExpenseAdded}
        buildingId={buildingId}
      />
    </TooltipProvider>
  );
}
