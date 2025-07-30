
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAllWorkOrders, updateWorkOrderFields } from '@/lib/firebase/firestore';
import type { WorkOrder } from '@/types';
import { WorkOrderStatus, WorkOrderPriority, UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Clock, Zap, Loader2, AlertTriangle, PackageOpen, Briefcase, ArrowUpDown, ArrowUp, ArrowDown, Filter, Search, Download, FileText, FileJson, Users, ListChecks, CalendarDays, ShoppingCart, Construction, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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

export type TabValue = 'triage' | 'userInput' | 'supplierTasks' | 'archivedComplete' | 'all';
const VALID_TABS: TabValue[] = ['triage', 'userInput', 'supplierTasks', 'archivedComplete', 'all'];

export const tabDisplayNames: Record<TabValue, string> = {
  triage: "Triage",
  userInput: "User Action",
  supplierTasks: "Supplier Action",
  archivedComplete: "Complete",
  all: "All",
};

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
      return <Badge variant="secondary" className="text-xs px-1.5 py-0.5 w-full justify-center"><XCircle className="mr-1 h-3 w-3" />{status}</Badge>;
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

type SortableWorkOrderKeys = keyof Pick<WorkOrder, 'status' | 'priority' | 'title' | 'createdByUserEmail' | 'createdAt' | 'supplierName'>;

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
    "ID", "Title", "Status", "Priority", "Description", "Created By Email",
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
    escapeCSVCell(order.createdByUserEmail),
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


export function AllWorkOrdersClient() {
  const { user, loading: authLoading, activeBuildingId } = useAuth();
  const [workOrders, setWorkOrders] = React.useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [lastVisible, setLastVisible] = React.useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStatusFilterFromUrl = searchParams.get('status') as WorkOrderStatus | null;
  const initialTabFromUrl = searchParams.get('tab') as TabValue | null;

  const determineInitialTab = (): TabValue => {
    if (initialTabFromUrl && VALID_TABS.includes(initialTabFromUrl)) {
        return initialTabFromUrl;
    }
    if (initialStatusFilterFromUrl) {
        if (initialStatusFilterFromUrl === WorkOrderStatus.TRIAGE) return 'triage';
        if (initialStatusFilterFromUrl === WorkOrderStatus.AWAITING_USER_FEEDBACK) return 'userInput';
        if ([WorkOrderStatus.QUOTING, WorkOrderStatus.SCHEDULED].includes(initialStatusFilterFromUrl)) return 'supplierTasks';
        if ([WorkOrderStatus.RESOLVED, WorkOrderStatus.CLOSED, WorkOrderStatus.CANCELLED].includes(initialStatusFilterFromUrl)) return 'archivedComplete';
    }
    return 'triage';
  };

  const [activeTab, setActiveTab] = React.useState<TabValue>(determineInitialTab());


  const [filters, setFilters] = React.useState<Filters>({
    title: '',
    status: initialStatusFilterFromUrl || '',
    priority: '',
  });

  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'createdAt', direction: 'descending' });

  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
  const activeResizer = React.useRef<string | null>(null);
  const startX = React.useRef<number>(0);
  const startWidth = React.useRef<number>(0);


  const getStatusFilterForTab = React.useCallback((tab: TabValue, urlStatusFilter: WorkOrderStatus | null): WorkOrderStatus | WorkOrderStatus[] | null => {
    switch (tab) {
      case 'triage':
        return WorkOrderStatus.TRIAGE;
      case 'userInput':
        if (urlStatusFilter && [WorkOrderStatus.AWAITING_USER_FEEDBACK].includes(urlStatusFilter)) return urlStatusFilter;
        return [WorkOrderStatus.AWAITING_USER_FEEDBACK];
      case 'supplierTasks':
        if (urlStatusFilter && [WorkOrderStatus.QUOTING, WorkOrderStatus.SCHEDULED].includes(urlStatusFilter)) return urlStatusFilter;
        return [WorkOrderStatus.QUOTING, WorkOrderStatus.SCHEDULED];
      case 'archivedComplete':
        if (urlStatusFilter && [WorkOrderStatus.RESOLVED, WorkOrderStatus.CLOSED, WorkOrderStatus.CANCELLED].includes(urlStatusFilter)) return urlStatusFilter;
        return [WorkOrderStatus.RESOLVED, WorkOrderStatus.CLOSED, WorkOrderStatus.CANCELLED];
      case 'all':
        return null; 
      default:
        return WorkOrderStatus.TRIAGE;
    }
  }, []);

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
    { id: 'createdByUserEmail', label: 'Created By', minWidth: 120, defaultWidth: 180, isResizable: true, sortable: true,
      accessor: (order) => <div className="flex items-center justify-center text-center w-full"><Tooltip><TooltipTrigger asChild><span className="truncate cursor-default block">{order.createdByUserEmail}</span></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Created by: {order.createdByUserEmail}</p></TooltipContent></Tooltip></div>
    },
    { id: 'createdAt', label: 'Created At', minWidth: 120, defaultWidth: 180, isResizable: true, sortable: true,
      accessor: (order) => <Tooltip><TooltipTrigger asChild><span className="cursor-default whitespace-nowrap block">{order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM d, HH:mm') : 'N/A'}</span></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'N/A'}</p></TooltipContent></Tooltip>
    },
    { id: 'supplierName', label: 'Supplier', minWidth: 100, defaultWidth: 150, isResizable: true, sortable: true,
      accessor: (order) => <div className="flex items-center justify-center text-center w-full">{order.supplierName ? <Tooltip><TooltipTrigger asChild><div className="flex items-center truncate cursor-default"><Briefcase className="mr-1 h-3 w-3 flex-shrink-0" />{order.supplierName}</div></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Supplier: {order.supplierName}</p></TooltipContent></Tooltip> : <div className="h-[1em]">&nbsp;</div>}</div>
    },
  ], []);

  React.useEffect(() => {
    // Attempt to load saved widths from local storage
    const savedWidths = localStorage.getItem('workOrderColumnWidths');
    if (savedWidths) {
        try {
            const parsedWidths = JSON.parse(savedWidths);
            if (typeof parsedWidths === 'object' && parsedWidths !== null) {
                setColumnWidths(parsedWidths);
            }
        } catch (e) {
            console.error("Failed to parse saved column widths:", e);
            setColumnWidths(initialColumnConfigInternal.reduce((acc, col) => ({ ...acc, [col.id]: col.defaultWidth }), {}));
            localStorage.removeItem('workOrderColumnWidths');
        }
    } else {
        setColumnWidths(initialColumnConfigInternal.reduce((acc, col) => ({ ...acc, [col.id]: col.defaultWidth }), {}));
    }
  }, [initialColumnConfigInternal]);


  const fetchAllOrdersInternal = React.useCallback(async (buildingId: string, cursor: QueryDocumentSnapshot<DocumentData> | null, currentTab: TabValue, urlStatus: WorkOrderStatus | null) => {
    if (cursor === null) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);

    const statusQueryParam = getStatusFilterForTab(currentTab, urlStatus);

    try {
      const { workOrders: fetchedOrders, lastVisible: newLastVisible } = await getAllWorkOrders(buildingId, PAGE_SIZE, cursor, statusQueryParam);
      setWorkOrders(prevOrders => cursor ? [...prevOrders, ...fetchedOrders] : fetchedOrders);
      setLastVisible(newLastVisible);
      setHasMore(fetchedOrders.length === PAGE_SIZE);
    } catch (err: any) {
      setError(err.message || "Failed to fetch tickets.");
      toast({
        title: 'Error Fetching Tickets',
        description: err.message || "Could not load tickets.",
        variant: 'destructive',
      });
    } finally {
       if (cursor === null) setIsLoading(false); else setIsLoadingMore(false);
    }
  }, [toast, getStatusFilterForTab]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== UserRole.MANAGER) {
      setIsLoading(false);
      setError("This view is for managers only. Please see 'My Tickets' if you are a resident.");
      return;
    }

    if (!activeBuildingId) {
        setIsLoading(false);
        // Don't set an error, just wait for a building to be selected.
        // The parent component should show a "select building" message.
        setWorkOrders([]);
        return;
    }

    setIsLoading(true);
    setWorkOrders([]);
    setLastVisible(null);
    setHasMore(true);
    fetchAllOrdersInternal(activeBuildingId, null, activeTab, initialStatusFilterFromUrl);

    const newFilters = { ...filters, status: initialStatusFilterFromUrl || '' };
    setFilters(newFilters);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, activeTab, fetchAllOrdersInternal, initialStatusFilterFromUrl, activeBuildingId]);


  const handleTabChange = (newTab: string) => {
    const newTabValue = newTab as TabValue;
    setActiveTab(newTabValue);
    router.push(`/work-orders?tab=${newTabValue}`);
  };

  const handleRowClick = (workOrderId: string) => {
    router.push(`/work-orders/${workOrderId}`);
  };

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
    if (filters.status && filters.status !== ALL_STATUSES_FILTER_VALUE) {
      filtered = filtered.filter(order => order.status === filters.status);
    }
    if (filters.priority && filters.priority !== ALL_PRIORITIES_FILTER_VALUE) {
      filtered = filtered.filter(order => order.priority === filters.priority);
    }

    if (sortConfig.key) {
        filtered.sort((a, b) => {
            const valA = a[sortConfig.key!];
            const valB = b[sortConfig.key!];
            let comparison = 0;

            if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
                const dateA = (valA as Timestamp | Date | undefined)?.toDate?.().getTime() ?? (valA instanceof Date ? valA.getTime() : 0);
                const dateB = (valB as Timestamp | Date | undefined)?.toDate?.().getTime() ?? (valB instanceof Date ? valB.getTime() : 0);
                comparison = dateA - dateB;
            } else if (typeof valA === 'string' && typeof valB === 'string') {
                comparison = valA.localeCompare(valB);
            } else if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = valA - valB;
            } else if (sortConfig.key === 'priority') {
                 const priorityOrder: Record<WorkOrderPriority, number> = {
                    [WorkOrderPriority.URGENT]: 1,
                    [WorkOrderPriority.HIGH]: 2,
                    [WorkOrderPriority.MEDIUM]: 3,
                    [WorkOrderPriority.LOW]: 4,
                };
                comparison = priorityOrder[valA as WorkOrderPriority] - priorityOrder[valB as WorkOrderPriority];
            } else if (sortConfig.key === 'status') {
                const statusOrder: Record<WorkOrderStatus, number> = {
                    [WorkOrderStatus.TRIAGE]: 1,
                    [WorkOrderStatus.AWAITING_USER_FEEDBACK]: 2,
                    [WorkOrderStatus.QUOTING]: 3,
                    [WorkOrderStatus.SCHEDULED]: 4,
                    [WorkOrderStatus.RESOLVED]: 5,
                    [WorkOrderStatus.CLOSED]: 6,
                    [WorkOrderStatus.CANCELLED]: 7,
                };
                comparison = statusOrder[valA as WorkOrderStatus] - statusOrder[valB as WorkOrderStatus];
            }
            else {
                 const strA = String(valA ?? '').toLocaleLowerCase();
                 const strB = String(valB ?? '').toLocaleLowerCase();
                 comparison = strA.localeCompare(strB);
            }
            return sortConfig.direction === 'ascending' ? comparison : comparison * -1;
        });
    }
    return filtered;
}, [workOrders, filters, sortConfig]);


  const clearFilters = () => {
    setFilters({ title: '', status: '', priority: '' });
    if (initialStatusFilterFromUrl || searchParams.get('status')) {
        router.push(`/work-orders?tab=${activeTab}`);
    }
  };

  const handleExportCSV = () => {
    if (displayedWorkOrders.length === 0) {
      toast({ title: "No Data", description: `No tickets to export for the "${tabDisplayNames[activeTab]}" tab with current filters.` });
      return;
    }
    const csvString = convertWorkOrdersToCSV(displayedWorkOrders);
    triggerDownload(csvString, `${activeTab}_tickets_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`, 'text/csv;charset=utf-8;');
    toast({ title: "Export Successful", description: `${displayedWorkOrders.length} ticket(s) exported as CSV.` });
  };

  const handleExportJSON = () => {
    if (displayedWorkOrders.length === 0) {
      toast({ title: "No Data", description: `No tickets to export for the "${tabDisplayNames[activeTab]}" tab with current filters.` });
      return;
    }
    const jsonString = JSON.stringify(displayedWorkOrders, null, 2);
    triggerDownload(jsonString, `${activeTab}_tickets_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.json`, 'application/json;charset=utf-8;');
    toast({ title: "Export Successful", description: `${displayedWorkOrders.length} ticket(s) exported as JSON.` });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialColumnConfigInternal]);

  React.useEffect(() => {
    // Save column widths to local storage whenever they change
    if(Object.keys(columnWidths).length > 0) {
        localStorage.setItem('workOrderColumnWidths', JSON.stringify(columnWidths));
    }
  }, [columnWidths]);


  const renderContentForTab = () => {
      if (isLoading) {
        return (
          <div className="space-y-0">
            <div className="p-4 space-y-3 bg-muted/30">
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
        return (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-destructive text-lg font-semibold">Error Loading Tickets</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        );
      }

      const hasActiveFilters = filters.title || (filters.status && filters.status !== ALL_STATUSES_FILTER_VALUE) || (filters.priority && filters.priority !== ALL_PRIORITIES_FILTER_VALUE);
      const renderNoResultsForTabMessage = () => {
        const currentTabDisplayName = tabDisplayNames[activeTab] || activeTab;
        if (hasActiveFilters) {
            return (
                <>
                    <p className="mt-5 text-xl font-medium text-foreground">No Tickets Match Your Filters</p>
                    <p className="text-sm text-muted-foreground/80 mt-2">
                        Try adjusting or clearing your search terms for the &quot;{currentTabDisplayName}&quot; tab.
                    </p>
                    <Button variant="link" onClick={clearFilters} className="mt-3">
                        Clear Filters
                    </Button>
                </>
            );
        }
        return (
            <>
                <p className="mt-5 text-xl font-medium text-foreground">No {currentTabDisplayName} Tickets</p>
                <p className="text-sm text-muted-foreground/80 mt-2">
                   There are currently no tickets in this category.
                </p>
            </>
        );
    };

    if (displayedWorkOrders.length === 0 && !isLoadingMore) {
        return (
             <div className="text-center py-10 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/50 p-8">
              <PackageOpen className="mx-auto h-16 w-16 text-muted-foreground/70" />
              {renderNoResultsForTabMessage()}
            </div>
        );
      }
      const showStatusFilter = ['userInput', 'supplierTasks', 'archivedComplete', 'all'].includes(activeTab);

      return (
        <>
          <div className="mb-4 p-4 border rounded-md shadow-sm bg-muted/30">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-grow w-full sm:w-auto">
                <Label htmlFor="titleFilter" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
                  <Search className="h-3.5 w-3.5 mr-1.5" /> Filter by Title/Description
                </Label>
                <Input
                  id="titleFilter" type="text" placeholder="Search..." value={filters.title}
                  onChange={(e) => handleFilterChange('title', e.target.value)} className="h-9 bg-card"
                />
              </div>
              { showStatusFilter && (
                  <div className="w-full sm:w-48">
                    <Label htmlFor="statusFilter" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
                        <Filter className="h-3.5 w-3.5 mr-1.5" /> Filter by Status
                    </Label>
                    <Select
                      value={filters.status || undefined}
                      onValueChange={(value) => handleFilterChange('status', value === ALL_STATUSES_FILTER_VALUE ? '' : value as WorkOrderStatus | '')}
                    >
                      <SelectTrigger className="h-9 bg-card"><SelectValue placeholder="All Statuses in Tab" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_STATUSES_FILTER_VALUE}>All in Tab</SelectItem>
                        {Object.values(WorkOrderStatus).map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
              )}
              <div className="w-full sm:w-48">
                 <Label htmlFor="priorityFilter" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
                    <Filter className="h-3.5 w-3.5 mr-1.5" /> Filter by Priority
                </Label>
                <Select
                  value={filters.priority || undefined}
                  onValueChange={(value) => handleFilterChange('priority', value === ALL_PRIORITIES_FILTER_VALUE ? '' : value as WorkOrderPriority | '')}
                >
                  <SelectTrigger className="h-9 bg-card"><SelectValue placeholder="All Priorities" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_PRIORITIES_FILTER_VALUE}>All Priorities</SelectItem>
                    {Object.values(WorkOrderPriority).map(p => ( <SelectItem key={p} value={p}>{p}</SelectItem> ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (<Button variant="ghost" onClick={clearFilters} className="h-9 px-3 text-xs">Clear Filters</Button>)}
            </div>
          </div>
          <Separator className="my-4" />
          <div className="overflow-x-auto rounded-md border shadow-sm">
            <Table style={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHeader>
                <TableRow>
                  {initialColumnConfigInternal.map(col => (
                    <TableHead
                      key={col.id} style={{ width: `${columnWidths[col.id]}px`, position: 'relative' }}
                      className={cn("p-0 group/header bg-muted/30", col.cellClassName === "text-left" ? "text-left" : "text-center")}
                    >
                      <Button
                        variant="ghost" size="xs"
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
                        "cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/30",
                        (order.status === WorkOrderStatus.CLOSED || order.status === WorkOrderStatus.CANCELLED) && "opacity-60"
                    )}
                    onClick={() => handleRowClick(order.id)}
                  >
                    {initialColumnConfigInternal.map(colConfig => (
                      <TableCell
                          key={`${order.id}-${colConfig.id}`} style={{ width: `${columnWidths[colConfig.id]}px` }}
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
                onClick={() => user && activeBuildingId && fetchAllOrdersInternal(activeBuildingId, lastVisible, activeTab, null)}
                disabled={isLoadingMore} variant="outline" size="sm"
              >
                {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export List</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel><DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportCSV}><FileText className="mr-2 h-4 w-4" />Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJSON}><FileJson className="mr-2 h-4 w-4" />Export as JSON</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      );
  };


  if (!user || (user.role !== UserRole.MANAGER && !authLoading)) {
     return (
        <div className="flex flex-col items-center justify-center text-center py-10">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive text-lg font-semibold">Access Denied</p>
          <p className="text-muted-foreground">You do not have permissions to view this section.</p>
        </div>
     );
  }


  return (
    <TooltipProvider>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6">
          <TabsTrigger value="triage">{tabDisplayNames.triage}</TabsTrigger>
          <TabsTrigger value="userInput">{tabDisplayNames.userInput}</TabsTrigger>
          <TabsTrigger value="supplierTasks">{tabDisplayNames.supplierTasks}</TabsTrigger>
          <TabsTrigger value="archivedComplete">{tabDisplayNames.archivedComplete}</TabsTrigger>
          <TabsTrigger value="all">{tabDisplayNames.all}</TabsTrigger>
        </TabsList>
        <TabsContent value="triage" className="mt-0">{renderContentForTab()}</TabsContent>
        <TabsContent value="userInput" className="mt-0">{renderContentForTab()}</TabsContent>
        <TabsContent value="supplierTasks" className="mt-0">{renderContentForTab()}</TabsContent>
        <TabsContent value="archivedComplete" className="mt-0">{renderContentForTab()}</TabsContent>
        <TabsContent value="all" className="mt-0">{renderContentForTab()}</TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}
