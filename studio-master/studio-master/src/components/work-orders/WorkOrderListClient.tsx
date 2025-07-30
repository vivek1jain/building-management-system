

"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getWorkOrdersByUserId } from '@/lib/firebase/firestore';
import type { WorkOrder } from '@/types';
import { WorkOrderStatus, WorkOrderPriority } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Clock, Zap, Loader2, PackageOpen, Briefcase, ArrowUpDown, ArrowUp, ArrowDown, Filter, Search, Download, FileText, FileJson, Users, ListChecks, CalendarDays, ShoppingCart, Construction, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { QueryDocumentSnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const PAGE_SIZE = 15;
const ALL_STATUSES_FILTER_VALUE = "__ALL_STATUSES__";
const ALL_PRIORITIES_FILTER_VALUE = "__ALL_PRIORITIES__";

function StatusBadge({ status }: { status: WorkOrderStatus }) {
  switch (status) {
    case WorkOrderStatus.TRIAGE:
      return <Badge variant="outline" className="border-orange-400 text-orange-400 bg-orange-400/10 text-xs px-1.5 py-0.5 w-full justify-center"><Construction className="mr-1 h-3 w-3" />{status}</Badge>;
    case WorkOrderStatus.QUOTING:
      return <Badge variant="outline" className="border-purple-500 text-purple-500 bg-purple-500/10 text-xs px-1.5 py-0.5 w-full justify-center"><ListChecks className="mr-1 h-3 w-3" />{status}</Badge>;
    case WorkOrderStatus.AWAITING_USER_FEEDBACK:
        return <Badge variant="outline" className="border-pink-500 text-pink-500 bg-pink-500/10 text-xs px-1.5 py-0.5 w-full justify-center"><Users className="mr-1 h-3 w-3" />{status}</Badge>;
    case WorkOrderStatus.SCHEDULED:
        return <Badge variant="outline" className="border-teal-500 text-teal-500 bg-teal-500/10 text-xs px-1.5 py-0.5 w-full justify-center"><CalendarDays className="mr-1 h-3 w-3" />{status}</Badge>;
    case WorkOrderStatus.RESOLVED:
      return <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10 text-xs px-1.5 py-0.5 w-full justify-center"><CheckCircle2 className="mr-1 h-3 w-3" />{status}</Badge>;
    case WorkOrderStatus.CLOSED:
      return <Badge variant="secondary" className="text-xs px-1.5 py-0.5 w-full justify-center"><Zap className="mr-1 h-3 w-3" />{status}</Badge>;
    case WorkOrderStatus.CANCELLED:
      return <Badge variant="destructive" className="bg-gray-500 hover:bg-gray-600 text-xs px-1.5 py-0.5 w-full justify-center"><XCircle className="mr-1 h-3 w-3" />{status}</Badge>;
    default:
      return <Badge className="text-xs px-1.5 py-0.5 w-full justify-center">{status}</Badge>;
  }
}

function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
    const baseClasses = "text-xs px-1.5 py-0.5 w-full justify-center";
    switch (priority) {
        case WorkOrderPriority.URGENT:
            return <Badge variant="destructive" className={cn(baseClasses, "bg-red-600 hover:bg-red-700")}>{priority}</Badge>;
        case WorkOrderPriority.HIGH:
            return <Badge variant="destructive" className={cn(baseClasses, "bg-orange-500 hover:bg-orange-600")}>{priority}</Badge>;
        case WorkOrderPriority.MEDIUM:
            return <Badge variant="default" className={cn(baseClasses, "bg-yellow-500 text-yellow-900 hover:bg-yellow-600")}>{priority}</Badge>;
        case WorkOrderPriority.LOW:
            return <Badge variant="secondary" className={cn(baseClasses)}>{priority}</Badge>;
        default:
            return <Badge className={cn(baseClasses)}>{priority}</Badge>;
    }
}

type SortableWorkOrderKeys = keyof Pick<WorkOrder, 'status' | 'priority' | 'title' | 'createdAt' | 'supplierName'>;

interface ColumnConfig {
  id: SortableWorkOrderKeys;
  label: string;
  minWidth: number;
  defaultWidth: number;
  isResizable: boolean;
  sortable: boolean;
  accessor?: (order: WorkOrder) => React.ReactNode;
  cellClassName?: string;
}

interface SortConfig {
  key: SortableWorkOrderKeys | null;
  direction: 'ascending' | 'descending';
}

interface Filters {
  title: string;
  status: WorkOrderStatus | '';
  priority: WorkOrderPriority | '';
}

function convertWorkOrdersToCSV(data: WorkOrder[]): string {
  if (!data || data.length === 0) {
    return "";
  }
  const headers = [
    "ID", "Title", "Status", "Priority", "Description",
    "Created At", "Updated At", "Supplier Name", "Cost", "Resolution Notes", "Scheduled Date", "Resolved At"
  ];

  const escapeCSVCell = (cellData: any): string => {
    if (cellData === null || cellData === undefined) return "";
    let cell = String(cellData);
    if (cell.search(/("|,|\n)/g) >= 0) {
      cell = '"' + cell.replace(/"/g, '""') + '"';
    }
    return cell;
  };

  const formatDateForCSV = (timestamp: Timestamp | Date | null | undefined): string => {
    if (!timestamp) return "";
    const date = timestamp instanceof Date ? timestamp : (timestamp as Timestamp).toDate();
    return format(date, "yyyy-MM-dd HH:mm:ss");
  };

  const rows = data.map(order => [
    escapeCSVCell(order.id),
    escapeCSVCell(order.title),
    escapeCSVCell(order.status),
    escapeCSVCell(order.priority),
    escapeCSVCell(order.description),
    formatDateForCSV(order.createdAt),
    formatDateForCSV(order.updatedAt),
    escapeCSVCell(order.supplierName || ""),
    escapeCSVCell(order.cost ?? ""),
    escapeCSVCell(order.resolutionNotes || ""),
    formatDateForCSV(order.scheduledDate),
    formatDateForCSV(order.resolvedAt)
  ].join(","));

  return [headers.join(","), ...rows].join("\n");
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}


export function WorkOrderListClient() {
  const { user, loading: authLoading, activeBuildingId } = useAuth();
  const [workOrders, setWorkOrders] = React.useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [lastVisible, setLastVisible] = React.useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [filters, setFilters] = React.useState<Filters>({
    title: '',
    status: '',
    priority: '',
  });
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'createdAt', direction: 'descending' });

  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
  const activeResizer = React.useRef<string | null>(null);
  const startX = React.useRef<number>(0);
  const startWidth = React.useRef<number>(0);

  const initialColumnConfigInternal: ColumnConfig[] = React.useMemo(() => [
     { id: 'title', label: 'Title', minWidth: 150, defaultWidth: 250, isResizable: true, sortable: true, cellClassName: "text-left",
      accessor: (order) => <Tooltip><TooltipTrigger asChild><span className="font-medium text-sm truncate cursor-default" title={order.title}>{order.title}</span></TooltipTrigger><TooltipContent side="bottom" align="start"><p className="max-w-xs text-xs">{order.title} (ID: {order.id.substring(0,6)}...)</p></TooltipContent></Tooltip>
    },
    { id: 'priority', label: 'Priority', minWidth: 80, defaultWidth: 100, isResizable: true, sortable: true,
      accessor: (order) => (
        <div className="flex justify-center w-20">
          <PriorityBadge priority={order.priority} />
        </div>
      )
    },
    { id: 'status', label: 'Status', minWidth: 80, defaultWidth: 100, isResizable: true, sortable: true,
      accessor: (order) => (
        <div className="flex justify-center w-20">
          <StatusBadge status={order.status} />
        </div>
      )
    },
    { id: 'createdAt', label: 'Created At', minWidth: 120, defaultWidth: 180, isResizable: true, sortable: true,
      accessor: (order) => <Tooltip><TooltipTrigger asChild><span className="cursor-default whitespace-nowrap block">{order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM d, HH:mm') : 'N/A'}</span></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'N/A'}</p></TooltipContent></Tooltip>
    },
    { id: 'supplierName', label: 'Supplier', minWidth: 100, defaultWidth: 150, isResizable: true, sortable: true,
      accessor: (order) => order.supplierName ? <Tooltip><TooltipTrigger asChild><div className="flex items-center truncate cursor-default"><Briefcase className="mr-1 h-3 w-3 flex-shrink-0" />{order.supplierName}</div></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Supplier: {order.supplierName}</p></TooltipContent></Tooltip> : <div className="h-[1em]">&nbsp;</div>
    },
  ], []);

  React.useEffect(() => {
    setColumnWidths(initialColumnConfigInternal.reduce((acc, col) => ({ ...acc, [col.id]: col.defaultWidth }), {}));
  }, [initialColumnConfigInternal]);

  const fetchOrders = React.useCallback(async (bId: string, uId: string, cursor: QueryDocumentSnapshot<DocumentData> | null) => {
    if (cursor === null && workOrders.length > 0 && !isLoading) {
        setIsLoading(false);
        return;
    }
    if (cursor !== null) setIsLoadingMore(true); else setIsLoading(true);
    setError(null);

    try {
      const { workOrders: fetchedOrders, lastVisible: newLastVisible } = await getWorkOrdersByUserId(bId, uId, PAGE_SIZE, cursor);
      setWorkOrders(prevOrders => cursor ? [...prevOrders, ...fetchedOrders] : fetchedOrders);
      setLastVisible(newLastVisible);
      setHasMore(fetchedOrders.length === PAGE_SIZE);
    } catch (err: any) {
      setError(err.message || "Failed to fetch work orders.");
      toast({
        title: 'Error Fetching Orders',
        description: err.message || "Could not load your work orders.",
        variant: 'destructive',
      });
    } finally {
      if (cursor !== null) setIsLoadingMore(false); else setIsLoading(false);
    }
  }, [toast, workOrders.length, isLoading]);

  React.useEffect(() => {
    if (authLoading || !user || !activeBuildingId) {
      if (!authLoading && !user) {
        setError("You need to be logged in to view work orders.");
        setIsLoading(false);
      }
      return;
    }

    if (user && activeBuildingId && (workOrders.length === 0 || workOrders[0]?.buildingId !== activeBuildingId) && hasMore && isLoading) {
       setWorkOrders([]);
       setLastVisible(null);
       fetchOrders(activeBuildingId, user.uid, null);
    } else if (workOrders.length > 0 && isLoading) {
        setIsLoading(false);
    }
  }, [user, authLoading, activeBuildingId, fetchOrders, hasMore, workOrders, isLoading]);

  const handleFilterChange = (filterName: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value as WorkOrderStatus | WorkOrderPriority | '' }));
  };

  const requestSort = (key: SortableWorkOrderKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortableWorkOrderKeys) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50 group-hover:opacity-100" />;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-1 h-3 w-3 text-primary" />;
    return <ArrowDown className="ml-1 h-3 w-3 text-primary" />;
  };

  const displayedWorkOrders = React.useMemo(() => {
    let filtered = [...workOrders];

    if (filters.title) {
      filtered = filtered.filter(order =>
        order.title.toLowerCase().includes(filters.title.toLowerCase()) ||
        order.description.toLowerCase().includes(filters.title.toLowerCase())
      );
    }
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter(order => order.priority === filters.priority);
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        let comparison = 0;

        if (sortConfig.key === 'createdAt') {
          const aDate = (aValue as Timestamp)?.toMillis() || 0;
          const bDate = (bValue as Timestamp)?.toMillis() || 0;
          comparison = aDate > bDate ? 1 : (aDate < bDate ? -1 : 0);
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.toLocaleLowerCase().localeCompare(bValue.toLocaleLowerCase());
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
        } else {
            const strA = String(aValue ?? '').toLocaleLowerCase();
            const strB = String(bValue ?? '').toLocaleLowerCase();
            comparison = strA.localeCompare(strB);
        }
        return sortConfig.direction === 'ascending' ? comparison : comparison * -1;
      });
    }
    return filtered;
  }, [workOrders, filters, sortConfig]);

  const clearFilters = () => {
    setFilters({ title: '', status: '', priority: '' });
  };

  const handleExportCSV = () => {
    if (displayedWorkOrders.length === 0) {
      toast({ title: "No Data", description: "No work orders to export with current filters." });
      return;
    }
    const csvString = convertWorkOrdersToCSV(displayedWorkOrders);
    triggerDownload(csvString, `my_work_orders_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`, 'text/csv;charset=utf-8;');
    toast({ title: "Export Successful", description: `${displayedWorkOrders.length} work order(s) exported as CSV.` });
  };

  const handleExportJSON = () => {
    if (displayedWorkOrders.length === 0) {
      toast({ title: "No Data", description: "No work orders to export with current filters." });
      return;
    }
    const jsonString = JSON.stringify(displayedWorkOrders, null, 2);
    triggerDownload(jsonString, `my_work_orders_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.json`, 'application/json;charset=utf-8;');
    toast({ title: "Export Successful", description: `${displayedWorkOrders.length} work order(s) exported as JSON.` });
  };

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

  if (isLoading && workOrders.length === 0) {
    return (
       <div className="space-y-0">
        <div className="p-4 space-y-3 border-b bg-muted/30">
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-grow bg-card" />
            <Skeleton className="h-10 w-32 bg-card" />
            <Skeleton className="h-10 w-32 bg-card" />
            <Skeleton className="h-10 w-24 bg-card" />
          </div>
        </div>
        <Separator className="my-4" />
        <div className="rounded-lg border shadow-md">
            <Table style={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHeader>
                <TableRow>
                  {initialColumnConfigInternal.map(col => (
                    <TableHead key={col.id} style={{ width: `${columnWidths[col.id] || col.defaultWidth}px` }} className="text-center bg-muted/30">
                      <Skeleton className="h-5 w-full" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(PAGE_SIZE -1)].map((_, i) => (
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
    return <p className="text-destructive text-center py-4">{error}</p>;
  }

  const renderNoResultsMessage = () => {
    if (filters.title || filters.status || filters.priority) {
      return (
        <>
          <p className="mt-5 text-xl font-medium text-foreground">No Work Orders Match Your Filters</p>
          <p className="text-sm text-muted-foreground/80 mt-2">Try adjusting or clearing your search terms.</p>
          <Button variant="link" onClick={clearFilters} className="mt-3">Clear Filters</Button>
        </>
      );
    }
    return (
      <>
        <p className="mt-5 text-xl font-medium text-foreground">No Work Orders Yet</p>
        <p className="text-sm text-muted-foreground/80 mt-2">You have not submitted any work orders.</p>
      </>
    );
  };

  if (displayedWorkOrders.length === 0 && !isLoading && (workOrders.length === 0 || filters.title || filters.status || filters.priority) ) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/50 p-8">
        <PackageOpen className="mx-auto h-16 w-16 text-muted-foreground/70" />
        {renderNoResultsMessage()}
      </div>
    );
  }

  if (!user && !authLoading) {
     return <p className="text-center py-4 text-muted-foreground">Please log in to manage your work orders.</p>;
  }

  return (
    <TooltipProvider>
      <div className="mb-4 p-4 border rounded-md shadow-sm bg-muted/30">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-grow w-full sm:w-auto">
            <Label htmlFor="titleFilterUser" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
              <Search className="h-3.5 w-3.5 mr-1.5" /> Filter by Title/Description
            </Label>
            <Input
              id="titleFilterUser"
              type="text"
              placeholder="Search..."
              value={filters.title}
              onChange={(e) => handleFilterChange('title', e.target.value)}
              className="h-9 bg-card"
            />
          </div>
          <div className="w-full sm:w-48">
            <Label htmlFor="statusFilterUser" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
                <Filter className="h-3.5 w-3.5 mr-1.5" /> Filter by Status
            </Label>
            <Select
              value={filters.status || undefined}
              onValueChange={(value) => handleFilterChange('status', value === ALL_STATUSES_FILTER_VALUE ? '' : value as WorkOrderStatus | '')}
            >
              <SelectTrigger className="h-9 bg-card">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES_FILTER_VALUE}>All Statuses</SelectItem>
                {Object.values(WorkOrderStatus).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
             <Label htmlFor="priorityFilterUser" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
                <Filter className="h-3.5 w-3.5 mr-1.5" /> Filter by Priority
            </Label>
            <Select
              value={filters.priority || undefined}
              onValueChange={(value) => handleFilterChange('priority', value === ALL_PRIORITIES_FILTER_VALUE ? '' : value as WorkOrderPriority | '')}
            >
              <SelectTrigger className="h-9 bg-card">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_PRIORITIES_FILTER_VALUE}>All Priorities</SelectItem>
                {Object.values(WorkOrderPriority).map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(filters.title || filters.status || filters.priority) && (
             <Button variant="ghost" onClick={clearFilters} className="h-9 px-3 text-xs">Clear Filters</Button>
          )}
        </div>
      </div>
      <Separator className="my-4" />

      <div className="overflow-x-auto rounded-md border shadow-sm">
        <Table style={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHeader>
            <TableRow>
              {initialColumnConfigInternal.map(col => (
                <TableHead
                  key={col.id}
                  style={{ width: `${columnWidths[col.id]}px`, position: 'relative' }}
                  className={cn("p-0 group/header bg-muted/30", col.cellClassName === "text-left" ? "text-left" : "text-center")}
                >
                  <Button
                    variant="ghost"
                    size="xs"
                    className={cn("w-full h-full p-2 text-xs font-medium text-muted-foreground hover:bg-muted/80", col.cellClassName === "text-left" ? "justify-start" : "justify-center")}
                    onClick={() => col.sortable ? requestSort(col.id as SortableWorkOrderKeys) : undefined}
                  >
                    {col.label}
                    {col.sortable && getSortIndicator(col.id as SortableWorkOrderKeys)}
                  </Button>
                  {col.isResizable && (
                    <div
                      onMouseDown={(e) => handleMouseDown(col.id, e)}
                      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none touch-none bg-border/50 hover:bg-primary/40 opacity-40 group-hover/header:opacity-100 transition-opacity"
                      style={{ zIndex: 10 }}
                    />
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedWorkOrders.map((order) => (
              <TableRow
                key={order.id}
                className={cn(
                    "cursor-pointer hover:bg-muted/60 dark:hover:bg-muted/30",
                    (order.status === WorkOrderStatus.CLOSED || order.status === WorkOrderStatus.CANCELLED) && "opacity-60"
                )}
                onClick={() => router.push(`/work-orders/${order.id}`)}
              >
                {initialColumnConfigInternal.map(colConfig => (
                  <TableCell
                      key={`${order.id}-${colConfig.id}`}
                      style={{ width: `${columnWidths[colConfig.id]}px` }}
                      className={cn("py-2.5 px-2 text-xs truncate", colConfig.cellClassName === "text-left" ? "text-left" : "text-center")}
                  >
                    {colConfig.accessor ? colConfig.accessor(order) : String((order as any)[colConfig.id] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <Button
            onClick={() => user && activeBuildingId && fetchOrders(activeBuildingId, user.uid, lastVisible)}
            disabled={isLoadingMore || !user}
            variant="outline"
            size="sm"
          >
            {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
      <div className="mt-6 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export List
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileText className="mr-2 h-4 w-4" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportJSON}>
              <FileJson className="mr-2 h-4 w-4" />
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
