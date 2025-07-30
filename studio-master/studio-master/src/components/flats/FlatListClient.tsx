

"use client";

import * as React from 'react';
import Link from 'next/link';
import { getFlats, createFlat, type CreateFlatData, updateFlat, type UpdateFlatData } from '@/lib/firebase/firestore';
import type { Flat } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Building, Pencil, AlertTriangle, PackageOpen, Square, BedDouble, Bath, FileText, ArrowUpDown, ArrowUp, ArrowDown, Filter, Search, Download, Upload, Loader2, Paperclip, FileJson, LandPlot } from 'lucide-react'; 
import { format, parse } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/useAuth';
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
import { useRouter } from 'next/navigation';
import { capitalizeFirstLetter } from '@/lib/utils';

type SortableFlatKeys = keyof Pick<Flat, 'flatNumber' | 'buildingBlock' | 'floor' | 'areaSqFt' | 'bedrooms' | 'bathrooms' | 'groundRent'>;

interface SortConfig {
  key: SortableFlatKeys | null;
  direction: 'ascending' | 'descending';
}

interface Filters {
  flatNumber: string;
  buildingBlock: string;
}

interface ColumnConfig {
  id: SortableFlatKeys | 'actions' | 'floorplans' | 'lease';
  label: string;
  minWidth: number;
  defaultWidth: number;
  isResizable: boolean;
  sortable: boolean;
  accessor?: (flat: Flat) => React.ReactNode;
}

function convertFlatsToCSV(data: Flat[]): string {
  if (!data || data.length === 0) {
    return "";
  }
  const headers = [
    "ID", "FlatNumber", "BuildingBlock", "Floor", "AreaSqFt",
    "Bedrooms", "Bathrooms", "GroundRent", "Notes"
  ];

  const escapeCSVCell = (cellData: any): string => {
    if (cellData === null || cellData === undefined) return "";
    let cell = String(cellData);
    if (cell.search(/("|,|\n)/g) >= 0) {
      cell = '"' + cell.replace(/"/g, '""') + '"';
    }
    return cell;
  };

  const rows = data.map(flat => [
    escapeCSVCell(flat.id),
    escapeCSVCell(flat.flatNumber),
    escapeCSVCell(flat.buildingBlock || ""),
    escapeCSVCell(flat.floor ?? ""),
    escapeCSVCell(flat.areaSqFt ?? ""),
    escapeCSVCell(flat.bedrooms ?? ""),
    escapeCSVCell(flat.bathrooms ?? ""),
    escapeCSVCell(flat.groundRent ?? ""),
    escapeCSVCell(flat.notes || ""),
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

export function FlatListClient({ buildingId }: { buildingId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [flats, setFlats] = React.useState<Flat[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<Filters>({ flatNumber: '', buildingBlock: '' });
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'flatNumber', direction: 'ascending' });

  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const initialColumnConfig = React.useMemo<ColumnConfig[]>(() => [
    { id: 'flatNumber', label: 'Flat #', minWidth: 80, defaultWidth: 120, isResizable: true, sortable: true, 
      accessor: (flat) => (
        <div className="flex items-center justify-center text-center w-full">
          <Tooltip><TooltipTrigger asChild><span className="font-medium text-sm truncate cursor-default text-primary" title={flat.flatNumber}>{flat.flatNumber}</span></TooltipTrigger><TooltipContent side="bottom" align="center"><p className="text-xs">Flat: {flat.flatNumber}</p></TooltipContent></Tooltip>
        </div>
      )
    },
    { id: 'buildingBlock', label: 'Block', minWidth: 80, defaultWidth: 120, isResizable: true, sortable: true,
      accessor: (flat) => (
        <div className="flex items-center justify-center text-center w-full">
          <Tooltip><TooltipTrigger asChild><span className="text-xs text-muted-foreground truncate cursor-default" title={flat.buildingBlock || 'N/A'}>{flat.buildingBlock || <span className="italic">No Block</span>}</span></TooltipTrigger><TooltipContent side="bottom" align="center"><p className="text-xs">Block: {flat.buildingBlock || 'N/A'}</p></TooltipContent></Tooltip>
        </div>
      )
    },
    { id: 'floor', label: 'Floor', minWidth: 60, defaultWidth: 80, isResizable: true, sortable: true,
      accessor: (flat) => <div className="flex items-center justify-center text-center w-full text-xs text-muted-foreground cursor-default">{flat.floor ?? <span className="italic">N/A</span>}</div>
    },
    { id: 'areaSqFt', label: 'Area (sq ft)', minWidth: 100, defaultWidth: 120, isResizable: true, sortable: true,
      accessor: (flat) => <div className="flex items-center justify-center text-center w-full text-xs text-muted-foreground cursor-default"><Square className="mr-1 h-3 w-3 flex-shrink-0" /> {flat.areaSqFt ?? <span className="italic">N/A</span>}</div>
    },
    { id: 'groundRent', label: 'Ground Rent', minWidth: 100, defaultWidth: 120, isResizable: true, sortable: true,
      accessor: (flat) => <div className="flex items-center justify-center text-center w-full text-xs text-muted-foreground cursor-default"><LandPlot className="mr-1 h-3 w-3 flex-shrink-0" /> {flat.groundRent ? formatCurrency(flat.groundRent) : <span className="italic">N/A</span>}</div>
    },
    { id: 'bedrooms', label: 'Beds', minWidth: 60, defaultWidth: 80, isResizable: true, sortable: true,
      accessor: (flat) => <div className="flex items-center justify-center text-center w-full text-xs text-muted-foreground cursor-default"><BedDouble className="mr-1 h-3 w-3 flex-shrink-0" /> {flat.bedrooms ?? <span className="italic">N/A</span>}</div>
    },
    { id: 'bathrooms', label: 'Baths', minWidth: 60, defaultWidth: 80, isResizable: true, sortable: true,
      accessor: (flat) => <div className="flex items-center justify-center text-center w-full text-xs text-muted-foreground cursor-default"><Bath className="mr-1 h-3 w-3 flex-shrink-0" /> {flat.bathrooms ?? <span className="italic">N/A</span>}</div>
    },
    { id: 'actions', label: 'Actions', minWidth: 80, defaultWidth: 80, isResizable: false, sortable: false,
      accessor: (flat) => (
        <div className="flex items-center justify-center text-center w-full">
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" asChild><Link href={`/flats/${flat.id}/edit`} onClick={(e) => e.stopPropagation()}><Pencil className="h-4 w-4" /><span className="sr-only">Edit Flat</span></Link></Button></TooltipTrigger><TooltipContent side="left"><p className="text-xs">Edit Flat</p></TooltipContent></Tooltip>
        </div>
      )
    },
  ], []);


  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
  const activeResizer = React.useRef<string | null>(null);
  const startX = React.useRef<number>(0);
  const startWidth = React.useRef<number>(0);

  React.useEffect(() => {
    setColumnWidths(initialColumnConfig.reduce((acc, col) => ({ ...acc, [col.id]: col.defaultWidth }), {}));
  }, [initialColumnConfig]);


  const fetchFlats = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedFlats = await getFlats(buildingId);
      setFlats(fetchedFlats);
    } catch (err: any) {
      setError(err.message || "Failed to fetch flats/units.");
      toast({
        title: 'Error Fetching Flats/Units',
        description: err.message || "Could not load flats/units.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, buildingId]);

  React.useEffect(() => {
    fetchFlats();
  }, [fetchFlats]);

  const handleFilterChange = (filterName: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const requestSort = (key: SortableFlatKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortableFlatKeys) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50 group-hover:opacity-100" />;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-1 h-3 w-3 text-primary" />;
    return <ArrowDown className="ml-1 h-3 w-3 text-primary" />;
  };

  const displayedFlats = React.useMemo(() => {
    let filtered = [...flats];
    if (filters.flatNumber) {
      filtered = filtered.filter(f => f.flatNumber.toLowerCase().includes(filters.flatNumber.toLowerCase()));
    }
    if (filters.buildingBlock) {
      filtered = filtered.filter(f => f.buildingBlock?.toLowerCase().includes(filters.buildingBlock.toLowerCase()));
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        let comparison = 0;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (sortConfig.key === 'flatNumber') {
            const numA = parseInt(aValue.replace(/[^0-9]/g, ''), 10) || 0;
            const strA = aValue.replace(/[0-9]/g, '');
            const numB = parseInt(bValue.replace(/[^0-9]/g, ''), 10) || 0;
            const strB = bValue.replace(/[0-9]/g, '');
            if (numA !== numB) comparison = numA - numB;
            else comparison = strA.localeCompare(strB);
          } else {
            comparison = aValue.toLocaleLowerCase().localeCompare(bValue.toLocaleLowerCase());
          }
        } else {
            const strA = String(aValue ?? '').toLocaleLowerCase();
            const strB = String(bValue ?? '').toLocaleLowerCase();
            comparison = strA.localeCompare(strB);
        }
        return sortConfig.direction === 'ascending' ? comparison : comparison * -1;
      });
    }
    return filtered;
  }, [flats, filters, sortConfig]);

  const clearFilters = () => {
    setFilters({ flatNumber: '', buildingBlock: '' });
  };
  
  const handleExportCSV = () => {
    if (displayedFlats.length === 0) {
      toast({ title: "No Data", description: "No flats to export with current filters." });
      return;
    }
    const csvString = convertFlatsToCSV(displayedFlats);
    triggerDownload(csvString, `flats_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`, 'text/csv;charset=utf-8;');
    toast({ title: "Export Successful", description: `${displayedFlats.length} flat(s) exported as CSV.` });
  };

  const handleExportJSON = () => {
    if (displayedFlats.length === 0) {
      toast({ title: "No Data", description: "No flats to export with current filters." });
      return;
    }
    const jsonString = JSON.stringify(displayedFlats, null, 2);
    triggerDownload(jsonString, `flats_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.json`, 'application/json;charset=utf-8;');
    toast({ title: "Export Successful", description: `${displayedFlats.length} flat(s) exported as JSON.` });
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!user || !buildingId) {
      toast({ title: "Authentication Error", description: "You must be logged in to import flats.", variant: "destructive" });
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
        rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
      } else {
        throw new Error("Unsupported file type. Please upload a CSV, XLS, or XLSX file.");
      }

      if (rows.length < 2) {
        throw new Error("File must contain a header row and at least one data row.");
      }
      
      const headers = rows[0].map(h => String(h).toLowerCase());
      const requiredHeader = 'flatnumber';
      
      if (!headers.includes(requiredHeader)) {
        throw new Error(`The imported file must contain a 'FlatNumber' column (case-insensitive).`);
      }

      const idIndex = headers.indexOf('id');
      const flatNumberIndex = headers.indexOf('flatnumber');
      const floorIdx = headers.indexOf('floor');
      const buildingBlockIdx = headers.indexOf('buildingblock');
      const bedroomsIdx = headers.indexOf('bedrooms');
      const bathroomsIdx = headers.indexOf('bathrooms');
      const areaSqFtIdx = headers.indexOf('areasqft');
      const notesIdx = headers.indexOf('notes');
      
      let createdCount = 0;
      let updatedCount = 0;
      const importErrors: string[] = [];

      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i];
        const rowNum = i + 1;

        const id = idIndex > -1 ? cells[idIndex] : null;
        const flatNumber = cells[flatNumberIndex];

        if (!flatNumber && !id) {
          importErrors.push(`Row ${rowNum}: Row is empty or missing required ID/FlatNumber.`);
          continue;
        }

        const toIntOrUndefined = (index: number) => {
            const val = cells[index];
            if (val === null || val === undefined || String(val).trim() === '') return undefined;
            const num = parseInt(String(val), 10);
            return isNaN(num) ? undefined : num;
        };

        const flatData = {
          flatNumber,
          floor: toIntOrUndefined(floorIdx),
          buildingBlock: buildingBlockIdx > -1 ? cells[buildingBlockIdx] : undefined,
          bedrooms: toIntOrUndefined(bedroomsIdx),
          bathrooms: toIntOrUndefined(bathroomsIdx),
          areaSqFt: toIntOrUndefined(areaSqFtIdx),
          notes: notesIdx > -1 ? cells[notesIdx] : undefined,
        };

        try {
          if (id) {
            await updateFlat(id, flatData as UpdateFlatData);
            updatedCount++;
          } else {
            if (!flatNumber) {
              importErrors.push(`Row ${rowNum}: FlatNumber is required to create a new record.`);
              continue;
            }
            await createFlat(buildingId, flatData as CreateFlatData);
            createdCount++;
          }
        } catch (dbError: any) {
          importErrors.push(`Row ${rowNum} (${id || flatNumber}): Error - ${dbError.message}`);
        }
      }

      if (createdCount > 0 || updatedCount > 0) {
        toast({ title: "Import Successful", description: `${createdCount} flat(s) created, ${updatedCount} flat(s) updated.` });
        fetchFlats();
      }
      if (importErrors.length > 0) {
        const errorMsg = `${importErrors.length} record(s) had errors. First error: ${importErrors[0]}`;
        toast({ title: "Import Issues", description: errorMsg, variant: "destructive", duration: 10000 });
        console.error("File Import Errors:", importErrors);
      }
      if (createdCount === 0 && updatedCount === 0 && importErrors.length === 0 && rows.length > 1) {
          toast({title: "No Data Imported", description: "No new or updatable records found in the file.", variant: "default"});
      }

    } catch (err: any) {
      console.error("Error processing flat import file:", err);
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


  const renderNoResultsMessage = () => {
    if (filters.flatNumber || filters.buildingBlock) {
        return (
            <>
                <p className="mt-5 text-xl font-medium text-foreground">No Flats Match Your Filters</p>
                <p className="text-sm text-muted-foreground/80 mt-2">Try adjusting or clearing your search terms.</p>
                <Button variant="link" onClick={clearFilters} className="mt-3">Clear Filters</Button>
            </>
        );
    }
    return (
        <>
            <p className="mt-5 text-xl font-medium text-foreground">No Flats Yet</p>
            <p className="text-sm text-muted-foreground/80 mt-2">Click the &quot;New Flat/Unit&quot; button to add the first one.</p>
        </>
    );
  };


  return (
    <TooltipProvider>
      <div className="mb-4 p-4 border rounded-md shadow-sm bg-muted/30">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-grow w-full sm:w-auto">
            <Label htmlFor="flatNumberFilter" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
              <Search className="h-3.5 w-3.5 mr-1.5" /> Filter by Flat #
            </Label>
            <Input
              id="flatNumberFilter"
              type="text"
              placeholder="Search flat number..."
              value={filters.flatNumber}
              onChange={(e) => handleFilterChange('flatNumber', e.target.value)}
              className="h-9 bg-card"
            />
          </div>
          <div className="flex-grow w-full sm:w-auto">
            <Label htmlFor="buildingBlockFilter" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
              <Filter className="h-3.5 w-3.5 mr-1.5" /> Filter by Block
            </Label>
            <Input
              id="buildingBlockFilter"
              type="text"
              placeholder="Search block..."
              value={filters.buildingBlock}
              onChange={(e) => handleFilterChange('buildingBlock', e.target.value)}
              className="h-9 bg-card"
            />
          </div>
          {(filters.flatNumber || filters.buildingBlock) && (
             <Button variant="ghost" onClick={clearFilters} className="h-9 px-3 text-xs">Clear Filters</Button>
          )}
        </div>
      </div>
      <Separator className="my-4" />

      {isLoading && flats.length === 0 ? (
        <div className="space-y-0">
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
      ) : error ? (
        <div className="flex flex-col items-center justify-center text-center py-10">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive text-lg font-semibold">Error Loading Flats</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : displayedFlats.length === 0 && (flats.length === 0 || filters.flatNumber || filters.buildingBlock) ? (
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
      ) : (
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
                      onClick={() => col.sortable ? requestSort(col.id as SortableFlatKeys) : undefined}
                    >
                      {col.label}
                      {col.sortable && getSortIndicator(col.id as SortableFlatKeys)}
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
              {displayedFlats.map((flat) => (
                <TableRow 
                  key={flat.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/flats/${flat.id}/edit`)}
                >
                  {initialColumnConfig.map(colConfig => (
                    <TableCell 
                        key={`${flat.id}-${colConfig.id}`} 
                        style={{ width: `${columnWidths[colConfig.id]}px` }} 
                        className="py-2.5 px-2 text-xs text-center truncate"
                    >
                      {colConfig.accessor ? colConfig.accessor(flat) : String((flat as any)[colConfig.id] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
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
