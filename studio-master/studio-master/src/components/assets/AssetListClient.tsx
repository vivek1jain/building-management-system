

"use client";

import * as React from 'react';
import { getAssets, createAsset, type CreateAssetData, getFlats, getSuppliers, type Flat as FlatType, type Supplier as SupplierType, updateAsset, type UpdateAssetData } from '@/lib/firebase/firestore';
import type { Asset } from '@/types';
import { AssetStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Archive, Package, Pencil, AlertTriangle, PackageOpen, MapPin, Building, Briefcase, CalendarDays, Info, ShieldAlert, Settings, Wrench, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Filter, Search, Download, FileText, FileJson, Upload, Loader2, PlayCircle, StopCircle } from 'lucide-react';
import { format, parse, isValid, toDate } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/useAuth';
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
import type { Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const ALL_STATUSES_FILTER_VALUE = "__ALL_STATUSES__";

function StatusBadge({ status }: { status: AssetStatus }) {
  switch (status) {
    case AssetStatus.OPERATIONAL:
      return <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10 text-xs px-1.5 py-0.5 w-full justify-center"><Info className="mr-1 h-3 w-3" />{status}</Badge>;
    case AssetStatus.NEEDS_REPAIR:
      return <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 text-xs px-1.5 py-0.5 w-full justify-center"><ShieldAlert className="mr-1 h-3 w-3" />{status}</Badge>;
    case AssetStatus.IN_REPAIR:
      return <Badge variant="outline" className="border-orange-500 text-orange-500 bg-orange-500/10 text-xs px-1.5 py-0.5 w-full justify-center"><Settings className="mr-1 h-3 w-3 animate-spin" />{status}</Badge>;
    case AssetStatus.DECOMMISSIONED:
      return <Badge variant="secondary" className="text-xs px-1.5 py-0.5 w-full justify-center">{status}</Badge>;
    case AssetStatus.UNKNOWN:
    default:
      return <Badge variant="outline" className="text-xs px-1.5 py-0.5 w-full justify-center">{status}</Badge>;
  }
}

type SortableAssetKeys = keyof Pick<Asset, 'status' | 'name' | 'type' | 'locationDescription' | 'flatNumber' | 'nextServiceDate' | 'supplierName' | 'commissionedDate' | 'decommissionedDate'>;


interface SortConfig {
  key: SortableAssetKeys | null;
  direction: 'ascending' | 'descending';
}

interface Filters {
  name: string;
  status: AssetStatus | '';
  type: string;
}

interface ColumnConfig {
  id: SortableAssetKeys | 'actions';
  label: string;
  minWidth: number;
  defaultWidth: number;
  isResizable: boolean;
  sortable: boolean;
  accessor?: (asset: Asset) => React.ReactNode;
}

function convertAssetsToCSV(data: Asset[]): string {
  if (!data || data.length === 0) {
    return "";
  }
  const headers = [
    "ID", "Name", "Type", "Status", "LocationDescription", "FlatNumber",
    "Manufacturer", "ModelNumber", "SerialNumber", "PurchaseDate", "InstallationDate", "CommissionedDate", "DecommissionedDate",
    "WarrantyExpiryDate", "NextServiceDate", "SupplierName", "Notes"
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
    let date: Date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && typeof (timestamp as any).toDate === 'function') {
      date = (timestamp as Timestamp).toDate();
    } else {
      try {
        const parsedDate = toDate(timestamp as any);
        if (!isValid(parsedDate)) return "";
        date = parsedDate;
      } catch (e) {
        return "";
      }
    }
    return format(date, "yyyy-MM-dd");
  };


  const rows = data.map(asset => [
    escapeCSVCell(asset.id),
    escapeCSVCell(asset.name),
    escapeCSVCell(asset.type || ""),
    escapeCSVCell(asset.status),
    escapeCSVCell(asset.locationDescription || ""),
    escapeCSVCell(asset.flatNumber || ""),
    escapeCSVCell(asset.manufacturer || ""),
    escapeCSVCell(asset.modelNumber || ""),
    escapeCSVCell(asset.serialNumber || ""),
    formatDateForCSV(asset.purchaseDate),
    formatDateForCSV(asset.installationDate),
    formatDateForCSV(asset.commissionedDate),
    formatDateForCSV(asset.decommissionedDate),
    formatDateForCSV(asset.warrantyExpiryDate),
    formatDateForCSV(asset.nextServiceDate),
    escapeCSVCell(asset.supplierName || ""),
    escapeCSVCell(asset.notes || "")
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


export function AssetListClient() {
  const { user } = useAuth();
  const router = useRouter(); 
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<Filters>({ name: '', status: '', type: '' });
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'name', direction: 'ascending' });

  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [allFlats, setAllFlats] = React.useState<FlatType[]>([]);
  const [allSuppliers, setAllSuppliers] = React.useState<SupplierType[]>([]);

  const initialColumnConfig = React.useMemo<ColumnConfig[]>(() => {
    const renderDateCell = (dateValue: any, tooltipPrefix: string) => {
        let date: Date | null = null;
        if (dateValue instanceof Date) {
            date = dateValue;
        } else if (dateValue && typeof dateValue.toDate === 'function') {
            date = dateValue.toDate();
        } else if (dateValue) {
            try {
                const parsed = toDate(dateValue);
                if (isValid(parsed)) date = parsed;
            } catch (e) { /* ignore */ }
        }

        if (date && isValid(date)) {
            return (
                <Tooltip>
                    <TooltipTrigger asChild><div className={cn("flex items-center truncate cursor-default", tooltipPrefix === "Next Service" && "text-accent font-medium")}><Wrench className="mr-1 h-3 w-3 flex-shrink-0" />{format(date, 'PP')}</div></TooltipTrigger>
                    <TooltipContent side="bottom"><p className="text-xs">{tooltipPrefix}: {format(date, 'PP')}</p></TooltipContent>
                </Tooltip>
            );
        }
        return <span className="italic">N/A</span>;
    };


    return [
    { id: 'name', label: 'Name', minWidth: 120, defaultWidth: 200, isResizable: true, sortable: true, 
      accessor: (asset) => <Tooltip><TooltipTrigger asChild><span className="font-medium text-sm truncate cursor-default text-primary" title={asset.name}>{asset.name}</span></TooltipTrigger><TooltipContent side="bottom" align="center"><p className="text-xs">{asset.name}</p></TooltipContent></Tooltip>
    },
    { id: 'type', label: 'Type', minWidth: 80, defaultWidth: 120, isResizable: true, sortable: true,
      accessor: (asset) => <Tooltip><TooltipTrigger asChild><div className="flex items-center truncate cursor-default"><Package className="mr-1 h-3 w-3 flex-shrink-0" />{asset.type || <span className="italic">N/A</span>}</div></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Type: {asset.type || 'N/A'}</p></TooltipContent></Tooltip>
    },
    { id: 'locationDescription', label: 'Location', minWidth: 100, defaultWidth: 150, isResizable: true, sortable: true,
      accessor: (asset) => <Tooltip><TooltipTrigger asChild><div className="flex items-center truncate cursor-default"><MapPin className="mr-1 h-3 w-3 flex-shrink-0" />{asset.locationDescription || <span className="italic">N/A</span>}</div></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Location: {asset.locationDescription || 'N/A'}</p></TooltipContent></Tooltip>
    },
    { id: 'flatNumber', label: 'Flat #', minWidth: 80, defaultWidth: 100, isResizable: true, sortable: true,
      accessor: (asset) => <Tooltip><TooltipTrigger asChild><div className="flex items-center truncate cursor-default"><Building className="mr-1 h-3 w-3 flex-shrink-0" />{asset.flatNumber || <span className="italic">N/A</span>}</div></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Flat: {asset.flatNumber || 'N/A'}</p></TooltipContent></Tooltip>
    },
    { id: 'commissionedDate', label: 'Comm.', minWidth: 90, defaultWidth: 110, isResizable: true, sortable: true,
      accessor: (asset) => <Tooltip><TooltipTrigger asChild><div className={cn("flex items-center truncate cursor-default")}><PlayCircle className="mr-1 h-3 w-3 flex-shrink-0" />{asset.commissionedDate && isValid(toDate(asset.commissionedDate)) ? format(toDate(asset.commissionedDate), 'PP') : <span className="italic">N/A</span>}</div></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Commissioned: {asset.commissionedDate && isValid(toDate(asset.commissionedDate)) ? format(toDate(asset.commissionedDate), 'PP') : 'N/A'}</p></TooltipContent></Tooltip>
    },
    { id: 'status', label: 'Status', minWidth: 80, defaultWidth: 100, isResizable: true, sortable: true,
      accessor: (asset) => <div className="flex justify-center w-20"><StatusBadge status={asset.status} /></div>
    },
    { id: 'decommissionedDate', label: 'Decomm.', minWidth: 90, defaultWidth: 110, isResizable: true, sortable: true,
      accessor: (asset) => <Tooltip><TooltipTrigger asChild><div className={cn("flex items-center truncate cursor-default")}><StopCircle className="mr-1 h-3 w-3 flex-shrink-0" />{asset.decommissionedDate && isValid(toDate(asset.decommissionedDate)) ? format(toDate(asset.decommissionedDate), 'PP') : <span className="italic">N/A</span>}</div></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Decommissioned: {asset.decommissionedDate && isValid(toDate(asset.decommissionedDate)) ? format(toDate(asset.decommissionedDate), 'PP') : 'N/A'}</p></TooltipContent></Tooltip>
    },
    { id: 'nextServiceDate', label: 'Next Serv.', minWidth: 90, defaultWidth: 110, isResizable: true, sortable: true,
        accessor: (asset) => renderDateCell(asset.nextServiceDate, "Next Service")
    },
    { id: 'supplierName', label: 'Supplier', minWidth: 100, defaultWidth: 150, isResizable: true, sortable: true,
      accessor: (asset) => <Tooltip><TooltipTrigger asChild><div className="flex items-center truncate cursor-default"><Briefcase className="mr-1 h-3 w-3 flex-shrink-0" />{asset.supplierName || <span className="italic">N/A</span>}</div></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Supplier: {asset.supplierName || 'N/A'}</p></TooltipContent></Tooltip>
    },
    { id: 'actions', label: 'Actions', minWidth: 70, defaultWidth: 70, isResizable: false, sortable: false,
      accessor: (asset) => (
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" asChild><Link href={`/assets/${asset.id}/edit`} onClick={(e) => e.stopPropagation()}><Pencil className="h-4 w-4" /><span className="sr-only">Edit Asset</span></Link></Button></TooltipTrigger><TooltipContent side="left"><p className="text-xs">Edit Asset</p></TooltipContent></Tooltip>
      )
    },
  ]}, []);

  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
  const activeResizer = React.useRef<string | null>(null);
  const startX = React.useRef<number>(0);
  const startWidth = React.useRef<number>(0);

  React.useEffect(() => {
    setColumnWidths(initialColumnConfig.reduce((acc, col) => ({ ...acc, [col.id]: col.defaultWidth }), {}));
  }, [initialColumnConfig]);

  const fetchInitialData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedAssets, fetchedFlats, fetchedSuppliers] = await Promise.all([
        getAssets(),
        getFlats(),
        getSuppliers()
      ]);
      setAssets(fetchedAssets);
      setAllFlats(fetchedFlats);
      setAllSuppliers(fetchedSuppliers);
    } catch (err: any) {
      setError(err.message || "Failed to fetch assets or related data.");
      toast({
        title: 'Error Fetching Data',
        description: err.message || "Could not load assets or related data.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleFilterChange = (filterName: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value as AssetStatus | '' }));
  };

  const requestSort = (key: SortableAssetKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortableAssetKeys) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50 group-hover:opacity-100" />;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-1 h-3 w-3 text-primary" />;
    return <ArrowDown className="ml-1 h-3 w-3 text-primary" />;
  };

  const displayedAssets = React.useMemo(() => {
    let filtered = [...assets];
    if (filters.name) {
      filtered = filtered.filter(a => a.name.toLowerCase().includes(filters.name.toLowerCase()));
    }
    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    if (filters.type) {
      filtered = filtered.filter(a => a.type?.toLowerCase().includes(filters.type.toLowerCase()));
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key!];
        let bValue = b[sortConfig.key!];

        if (['nextServiceDate', 'commissionedDate', 'decommissionedDate', 'purchaseDate', 'installationDate', 'warrantyExpiryDate'].includes(sortConfig.key!)) {
            const toMs = (val: Timestamp | Date | null | undefined) => {
                if (!val) return 0;
                let dateObj: Date | null = null;
                if (val instanceof Date) {
                    dateObj = val;
                } else if (typeof val === 'object' && 'toDate' in val && typeof (val as any).toDate === 'function') {
                    dateObj = (val as Timestamp).toDate();
                } else {
                    try {
                       dateObj = toDate(val as any);
                    } catch (e) { /* ignore */ }
                }
                return dateObj && isValid(dateObj) ? dateObj.getTime() : 0;
            }
            aValue = toMs(aValue as Timestamp | Date | null);
            bValue = toMs(bValue as Timestamp | Date | null);
            return sortConfig.direction === 'ascending' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
        }

        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
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
  }, [assets, filters, sortConfig]);

  const clearFilters = () => {
    setFilters({ name: '', status: '', type: '' });
  };

  const handleExportCSV = () => {
    if (displayedAssets.length === 0) {
      toast({ title: "No Data", description: "No assets to export with current filters." });
      return;
    }
    const csvString = convertAssetsToCSV(displayedAssets);
    triggerDownload(csvString, `assets_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`, 'text/csv;charset=utf-8;');
    toast({ title: "Export Successful", description: `${displayedAssets.length} asset(s) exported as CSV.` });
  };

  const handleExportJSON = () => {
    if (displayedAssets.length === 0) {
      toast({ title: "No Data", description: "No assets to export with current filters." });
      return;
    }
    const jsonString = JSON.stringify(displayedAssets, null, 2);
    triggerDownload(jsonString, `assets_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.json`, 'application/json;charset=utf-8;');
    toast({ title: "Export Successful", description: `${displayedAssets.length} asset(s) exported as JSON.` });
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to import assets.", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    if (fileInputRef.current) fileInputRef.current.value = "";

    let rows: any[][] = [];
    const fileName = file.name.toLowerCase();

    try {
      if (fileName.endsWith('.csv')) {
        const csvText = await file.text();
        const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length > 0) {
            rows = lines.map(line => line.split(',').map(cell => cell.trim()));
        }
      } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' }) as any[][];
      } else {
        throw new Error("Unsupported file type. Please upload a CSV, XLS, or XLSX file.");
      }

      if (rows.length < 2) {
        throw new Error("File must contain a header row and at least one data row.");
      }

      const headers = rows[0].map(h => String(h).toLowerCase());
      const getIndex = (headerName: string) => headers.indexOf(headerName.toLowerCase());

      const idIdx = getIndex("id");
      const nameIdx = getIndex("name");
      const typeIdx = getIndex("type");
      const statusIdx = getIndex("status");
      const locationIdx = getIndex("locationdescription");
      const flatNumIdx = getIndex("flatnumber");
      const manuIdx = getIndex("manufacturer");
      const modelIdx = getIndex("modelnumber");
      const serialIdx = getIndex("serialnumber");
      const purchaseDateIdx = getIndex("purchasedate");
      const installDateIdx = getIndex("installationdate");
      const commissionedDateIdx = getIndex("commissioneddate");
      const decommissionedDateIdx = getIndex("decommissioneddate");
      const warrantyDateIdx = getIndex("warrantyexpirydate");
      const nextServiceDateIdx = getIndex("nextservicedate");
      const supplierNameIdx = getIndex("suppliername");
      const notesIdx = getIndex("notes");

      if (nameIdx === -1 && idIdx === -1) {
          throw new Error("File must contain at least an 'ID' column (for updates) or a 'Name' column (for new assets).");
      }
      
      const flatMap = new Map(allFlats.map(f => [f.flatNumber.toLowerCase(), f.id]));
      const supplierMap = new Map(allSuppliers.map(s => [s.name.toLowerCase(), s.id]));
      let createdCount = 0;
      let updatedCount = 0;
      const importErrors: string[] = [];

      const parseDateString = (dateStr: string | undefined): Date | null => {
        if (!dateStr || String(dateStr).trim() === '') return null;
        let parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
        if (!isValid(parsedDate)) parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date());
        if (!isValid(parsedDate)) parsedDate = parse(dateStr, 'MM/dd/yyyy', new Date());
        return isValid(parsedDate) ? parsedDate : null;
      };

      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i];
        const rowNum = i + 1;

        const id = idIdx > -1 ? cells[idIdx] : null;
        const name = nameIdx > -1 ? cells[nameIdx] : undefined;

        if (!name && !id) {
          importErrors.push(`Row ${rowNum}: Row is empty or missing required ID/Name.`);
          continue;
        }

        const statusStr = statusIdx > -1 ? cells[statusIdx] : undefined;
        let validStatus: AssetStatus | undefined;
        if (statusStr) {
          validStatus = Object.values(AssetStatus).find(s => s.toLowerCase() === statusStr.toLowerCase());
          if (!validStatus) {
            importErrors.push(`Row ${rowNum}: Invalid Status "${statusStr}". Must be one of: ${Object.values(AssetStatus).join(', ')}.`);
            continue;
          }
        }

        const flatNumber = flatNumIdx > -1 ? cells[flatNumIdx] : undefined;
        let flatId: string | null | undefined = undefined; // undefined means no change
        if (flatNumber !== undefined) {
          if (flatNumber === '') {
            flatId = null; // Explicitly set to null
          } else if (flatMap.has(flatNumber.toLowerCase())) {
            flatId = flatMap.get(flatNumber.toLowerCase());
          } else {
            importErrors.push(`Row ${rowNum}: FlatNumber "${flatNumber}" not found.`);
            continue;
          }
        }

        const supplierName = supplierNameIdx > -1 ? cells[supplierNameIdx] : undefined;
        let supplierId: string | null | undefined = undefined; // undefined means no change
        if (supplierName !== undefined) {
          if (supplierName === '') {
            supplierId = null;
          } else if (supplierMap.has(supplierName.toLowerCase())) {
            supplierId = supplierMap.get(supplierName.toLowerCase());
          } else {
            importErrors.push(`Row ${rowNum}: SupplierName "${supplierName}" not found.`);
            continue;
          }
        }
        
        const assetData = {
          name, type: typeIdx > -1 ? cells[typeIdx] : undefined, status: validStatus,
          locationDescription: locationIdx > -1 ? cells[locationIdx] : undefined,
          flatId, flatNumber,
          manufacturer: manuIdx > -1 ? cells[manuIdx] : undefined,
          modelNumber: modelIdx > -1 ? cells[modelIdx] : undefined,
          serialNumber: serialIdx > -1 ? cells[serialIdx] : undefined,
          purchaseDate: purchaseDateIdx > -1 ? parseDateString(cells[purchaseDateIdx]) : undefined,
          installationDate: installDateIdx > -1 ? parseDateString(cells[installDateIdx]) : undefined,
          commissionedDate: commissionedDateIdx > -1 ? parseDateString(cells[commissionedDateIdx]) : undefined,
          decommissionedDate: decommissionedDateIdx > -1 ? parseDateString(cells[decommissionedDateIdx]) : undefined,
          warrantyExpiryDate: warrantyDateIdx > -1 ? parseDateString(cells[warrantyDateIdx]) : undefined,
          nextServiceDate: nextServiceDateIdx > -1 ? parseDateString(cells[nextServiceDateIdx]) : undefined,
          supplierId, supplierName,
          notes: notesIdx > -1 ? cells[notesIdx] : undefined,
        };

        try {
          if (id) {
            await updateAsset(id, user.uid, assetData as UpdateAssetData);
            updatedCount++;
          } else {
            if (!name || !validStatus) {
              importErrors.push(`Row ${rowNum}: Name and Status are required to create a new record.`);
              continue;
            }
            await createAsset(assetData as CreateAssetData, user.uid);
            createdCount++;
          }
        } catch (dbError: any) {
          importErrors.push(`Row ${rowNum} (${id || name}): Error - ${dbError.message}`);
        }
      }

      if (createdCount > 0 || updatedCount > 0) {
        toast({ title: "Import Successful", description: `${createdCount} asset(s) created, ${updatedCount} asset(s) updated.` });
        fetchInitialData();
      }
      if (importErrors.length > 0) {
        const errorMsg = `${importErrors.length} record(s) had errors. First error: ${importErrors[0]}`;
        toast({ title: "Import Issues", description: errorMsg, variant: "destructive", duration: 10000 });
        console.error("File Import Errors:", importErrors);
      }
       if (createdCount === 0 && updatedCount === 0 && importErrors.length === 0 && rows.length > 1) {
          toast({title: "No Data Imported", description: "No valid new or updatable records found in the file.", variant: "default"});
      }

    } catch (err: any) {
      console.error("Error processing asset import file:", err);
      toast({ title: "Import Error", description: err.message || "Could not process file.", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
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
      const columnConf = initialColumnConfig.find(col => col.id === activeResizer.current);
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
  }, [columnWidths, initialColumnConfig]);


  if (isLoading && assets.length === 0) {
    return (
      <div className="space-y-0">
         <div className="p-4 space-y-3 border-b bg-muted/30">
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-grow bg-card" />
            <Skeleton className="h-10 w-32 bg-card" />
            <Skeleton className="h-10 flex-grow bg-card" />
            <Skeleton className="h-10 w-24 bg-card" />
          </div>
        </div>
        <Separator className="my-4"/>
        <div className="rounded-lg border shadow-md">
          <Table style={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHeader>
              <TableRow>
                {initialColumnConfig.map(col => (
                  <TableHead key={col.id} style={{ width: `${columnWidths[col.id] || col.defaultWidth}px` }} className="text-center bg-muted/30">
                    <Skeleton className="h-5 w-full" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(4)].map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {initialColumnConfig.map(col => (
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
        <p className="text-destructive text-lg font-semibold">Error Loading Assets</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const renderNoResultsMessage = () => {
    if (filters.name || filters.status || filters.type) {
        return (
            <>
                <p className="mt-5 text-xl font-medium text-foreground">No Assets Match Your Filters</p>
                <p className="text-sm text-muted-foreground/80 mt-2">Try adjusting or clearing your search terms.</p>
                <Button variant="link" onClick={clearFilters} className="mt-3">Clear Filters</Button>
            </>
        );
    }
    return (
        <>
            <p className="mt-5 text-xl font-medium text-foreground">No Assets Yet</p>
            <p className="text-sm text-muted-foreground/80 mt-2">Click the &quot;New Asset&quot; button to add your first asset.</p>
        </>
    );
  };

  if (displayedAssets.length === 0 && !isLoading && (assets.length === 0 || filters.name || filters.status || filters.type)) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/50 p-8">
        <PackageOpen className="mx-auto h-16 w-16 text-muted-foreground/70" />
        {renderNoResultsMessage()}
        <div className="mt-6 flex justify-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import File
          </Button>
          <input type="file" ref={fileInputRef} accept=".csv,.xls,.xlsx" style={{ display: 'none' }} onChange={handleFileImport} />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="mb-4 p-4 border rounded-md shadow-sm bg-muted/30">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-grow w-full sm:w-auto">
            <Label htmlFor="nameFilterAsset" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
              <Search className="h-3.5 w-3.5 mr-1.5" /> Filter by Name
            </Label>
            <Input id="nameFilterAsset" type="text" placeholder="Search name..."
                   value={filters.name} onChange={(e) => handleFilterChange('name', e.target.value)} className="h-9 bg-card" />
          </div>
          <div className="w-full sm:w-48">
            <Label htmlFor="statusFilterAsset" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
                <Filter className="h-3.5 w-3.5 mr-1.5" /> Filter by Status
            </Label>
            <Select value={filters.status || undefined} onValueChange={(value) => handleFilterChange('status', value === ALL_STATUSES_FILTER_VALUE ? '' : value as AssetStatus | '')}>
              <SelectTrigger className="h-9 bg-card"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES_FILTER_VALUE}>All Statuses</SelectItem>
                {Object.values(AssetStatus).map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-grow w-full sm:w-auto">
            <Label htmlFor="typeFilterAsset" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
              <Filter className="h-3.5 w-3.5 mr-1.5" /> Filter by Type
            </Label>
            <Input id="typeFilterAsset" type="text" placeholder="Search type..."
                   value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)} className="h-9 bg-card" />
          </div>
          {(filters.name || filters.status || filters.type) && (
             <Button variant="ghost" onClick={clearFilters} className="h-9 px-3 text-xs">Clear Filters</Button>
          )}
        </div>
      </div>
      <Separator className="my-4" />

      <div className="overflow-x-auto rounded-md border shadow-sm">
        <Table style={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHeader>
            <TableRow>
              {initialColumnConfig.map(col => (
                <TableHead
                  key={col.id}
                  style={{ width: `${columnWidths[col.id]}px`, position: 'relative' }}
                  className="p-0 group/header text-center bg-muted/30" 
                >
                  <Button
                    variant="ghost"
                    size="xs"
                    className="w-full h-full justify-center p-2 text-xs text-center font-medium text-muted-foreground hover:bg-muted/80"
                    onClick={() => col.sortable ? requestSort(col.id as SortableAssetKeys) : undefined}
                  >
                    {col.label}
                    {col.sortable && getSortIndicator(col.id as SortableAssetKeys)}
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
            {displayedAssets.map((asset) => (
              <TableRow 
                key={asset.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/assets/${asset.id}/edit`)}
              >
                {initialColumnConfig.map(colConfig => (
                  <TableCell
                      key={`${asset.id}-${colConfig.id}`} 
                      style={{ width: `${columnWidths[colConfig.id] || colConfig.defaultWidth}px` }} 
                      className="py-2.5 px-2 text-xs text-center truncate"
                  >
                    {colConfig.accessor ? colConfig.accessor(asset) : String((asset as any)[colConfig.id] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-6 flex justify-end items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isImporting || isLoading}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import File
        </Button>
        <input type="file" ref={fileInputRef} accept=".csv,.xls,.xlsx" style={{ display: 'none' }} onChange={handleFileImport} />
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
