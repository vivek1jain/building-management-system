

"use client";

import * as React from 'react';
import Link from 'next/link';
import { getSuppliers, createSupplier, type CreateSupplierData, updateSupplier, type UpdateSupplierData } from '@/lib/firebase/firestore';
import type { Supplier } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { PackageOpen, Pencil, Trash2, AlertTriangle, Mail, Phone, Loader2, User, ArrowUpDown, ArrowUp, ArrowDown, Filter, Search, Download, FileText, FileJson, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
import { capitalizeWords, capitalizeFirstLetter } from '@/lib/utils';


type SortableSupplierKeys = keyof Pick<Supplier, 'name' | 'contactName' | 'contactEmail' | 'contactPhone'> | 'specialties';

interface SortConfig {
  key: SortableSupplierKeys | null;
  direction: 'ascending' | 'descending';
}

interface Filters {
  name: string;
  specialty: string;
}

interface ColumnConfig {
  id: SortableSupplierKeys | 'actions';
  label: string;
  minWidth: number;
  defaultWidth: number;
  isResizable: boolean;
  sortable: boolean;
  accessor?: (supplier: Supplier) => React.ReactNode;
}

function convertSuppliersToCSV(data: Supplier[]): string {
  if (!data || data.length === 0) {
    return "";
  }
  const headers = [
    "ID", "Name", "Specialties", "ContactName", "ContactEmail",
    "ContactPhone", "Address", "Notes"
  ];

  const escapeCSVCell = (cellData: any): string => {
    if (cellData === null || cellData === undefined) return "";
    let cell = String(cellData);
    if (cell.search(/("|,|\n)/g) >= 0) {
      cell = '"' + cell.replace(/"/g, '""') + '"';
    }
    return cell;
  };

  const rows = data.map(supplier => [
    escapeCSVCell(supplier.id),
    escapeCSVCell(supplier.name),
    escapeCSVCell(supplier.specialties?.join(', ') || ""),
    escapeCSVCell(supplier.contactName || ""),
    escapeCSVCell(supplier.contactEmail || ""),
    escapeCSVCell(supplier.contactPhone || ""),
    escapeCSVCell(supplier.address || ""),
    escapeCSVCell(supplier.notes || "")
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

export function SupplierListClient() {
  const { user } = useAuth();
  const router = useRouter(); 
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<Filters>({ name: '', specialty: '' });
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'name', direction: 'ascending' });

  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
  const activeResizer = React.useRef<string | null>(null);
  const startX = React.useRef<number>(0);
  const startWidth = React.useRef<number>(0);

  const initialColumnConfig = React.useMemo<ColumnConfig[]>(() => [
    { id: 'name', label: 'Name', minWidth: 120, defaultWidth: 200, isResizable: true, sortable: true,
      accessor: (supplier) => <Tooltip><TooltipTrigger asChild><span className="font-medium text-sm truncate cursor-default text-primary" title={supplier.name}>{supplier.name}</span></TooltipTrigger><TooltipContent side="bottom" align="center"><p className="text-xs">{supplier.name}</p></TooltipContent></Tooltip>
    },
    { id: 'specialties', label: 'Specialties', minWidth: 120, defaultWidth: 180, isResizable: true, sortable: true,
      accessor: (supplier) => (
        <div className="flex flex-wrap gap-1 justify-center">
          {supplier.specialties?.map(spec => <Badge key={spec} variant="outline" className="text-xs">{spec}</Badge>)}
        </div>
      )
    },
    { id: 'contactName', label: 'Contact', minWidth: 100, defaultWidth: 150, isResizable: true, sortable: true,
      accessor: (supplier) => supplier.contactName ? <Tooltip><TooltipTrigger asChild><div className="flex items-center truncate cursor-default"><User className="mr-1 h-3 w-3 flex-shrink-0" />{supplier.contactName}</div></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Contact: {supplier.contactName}</p></TooltipContent></Tooltip> : <div className="h-[1em]">&nbsp;</div>
    },
    { id: 'contactEmail', label: 'Email', minWidth: 120, defaultWidth: 200, isResizable: true, sortable: true,
      accessor: (supplier) => supplier.contactEmail ? <Tooltip><TooltipTrigger asChild><div className="flex items-center truncate cursor-default"><Mail className="mr-1 h-3 w-3 flex-shrink-0" /><a href={`mailto:${supplier.contactEmail}`} className="hover:underline hover:text-primary" onClick={(e) => e.stopPropagation()}>{supplier.contactEmail}</a></div></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Email: {supplier.contactEmail}</p></TooltipContent></Tooltip> : <div className="h-[1em]">&nbsp;</div>
    },
    { id: 'contactPhone', label: 'Phone', minWidth: 100, defaultWidth: 140, isResizable: true, sortable: true,
      accessor: (supplier) => supplier.contactPhone ? <Tooltip><TooltipTrigger asChild><div className="flex items-center truncate cursor-default"><Phone className="mr-1 h-3 w-3 flex-shrink-0" /><a href={`tel:${supplier.contactPhone}`} className="hover:underline hover:text-primary" onClick={(e) => e.stopPropagation()}>{supplier.contactPhone}</a></div></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Phone: {supplier.contactPhone}</p></TooltipContent></Tooltip> : <div className="h-[1em]">&nbsp;</div>
    },
    { id: 'actions', label: 'Actions', minWidth: 100, defaultWidth: 100, isResizable: false, sortable: false,
      accessor: (supplier) => (
        <div className="flex items-center justify-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild><Link href={`/suppliers/${supplier.id}/edit`} onClick={(e) => e.stopPropagation()}><Pencil className="h-4 w-4" /><span className="sr-only">Edit Supplier</span></Link></Button>
            </TooltipTrigger><TooltipContent side="left"><p className="text-xs">Edit Supplier</p></TooltipContent>
          </Tooltip>
        </div>
      )
    },
  ], []);

  React.useEffect(() => {
    setColumnWidths(initialColumnConfig.reduce((acc, col) => ({ ...acc, [col.id]: col.defaultWidth }), {}));
  }, [initialColumnConfig]);

  const fetchSuppliers = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedSuppliers = await getSuppliers();
      fetchedSuppliers.sort((a, b) => a.name.localeCompare(b.name));
      setSuppliers(fetchedSuppliers);
    } catch (err: any) {
      setError(err.message || "Failed to fetch suppliers.");
      toast({
        title: 'Error Fetching Suppliers',
        description: err.message || "Could not load suppliers.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleFilterChange = (filterName: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const requestSort = (key: SortableSupplierKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortableSupplierKeys) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50 group-hover:opacity-100" />;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-1 h-3 w-3 text-primary" />;
    return <ArrowDown className="ml-1 h-3 w-3 text-primary" />;
  };

  const displayedSuppliers = React.useMemo(() => {
    let filtered = [...suppliers];
    if (filters.name) {
      filtered = filtered.filter(s => s.name.toLowerCase().includes(filters.name.toLowerCase()));
    }
    if (filters.specialty) {
      filtered = filtered.filter(s => s.specialties?.some(spec => spec.toLowerCase().includes(filters.specialty.toLowerCase())));
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        let comparison = 0;
        if (sortConfig.key === 'specialties') {
          const aText = a.specialties?.join(', ') || '';
          const bText = b.specialties?.join(', ') || '';
          comparison = aText.localeCompare(bText);
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.toLocaleLowerCase().localeCompare(bValue.toLocaleLowerCase());
        } else {
          const strA = String(aValue ?? '').toLocaleLowerCase();
          const strB = String(bValue ?? '').toLocaleLowerCase();
          comparison = strA.localeCompare(strB);
        }
        return sortConfig.direction === 'ascending' ? comparison : comparison * -1;
      });
    }
    return filtered;
  }, [suppliers, filters, sortConfig]);

  const clearFilters = () => {
    setFilters({ name: '', specialty: '' });
  };

  const handleExportCSV = () => {
    if (displayedSuppliers.length === 0) {
      toast({ title: "No Data", description: "No suppliers to export with current filters." });
      return;
    }
    const csvString = convertSuppliersToCSV(displayedSuppliers);
    triggerDownload(csvString, `suppliers_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`, 'text/csv;charset=utf-8;');
    toast({ title: "Export Successful", description: `${displayedSuppliers.length} supplier(s) exported as CSV.` });
  };

  const handleExportJSON = () => {
     if (displayedSuppliers.length === 0) {
      toast({ title: "No Data", description: "No suppliers to export with current filters." });
      return;
    }
    const jsonString = JSON.stringify(displayedSuppliers, null, 2);
    triggerDownload(jsonString, `suppliers_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.json`, 'application/json;charset=utf-8;');
    toast({ title: "Export Successful", description: `${displayedSuppliers.length} supplier(s) exported as JSON.` });
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to import suppliers.", variant: "destructive" });
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
      const idIdx = headers.indexOf('id');
      const nameIdx = headers.indexOf('name');
      const contactNameIdx = headers.indexOf('contactname');
      const emailIdx = headers.indexOf('contactemail');
      const phoneIdx = headers.indexOf('contactphone');
      const specialtyIdx = headers.indexOf('specialties');
      const addressIdx = headers.indexOf('address');
      const notesIdx = headers.indexOf('notes');

      if (nameIdx === -1 && idIdx === -1) {
        throw new Error("File must contain at least an 'ID' column (for updates) or a 'Name' column (for new suppliers).");
      }
      
      let createdCount = 0;
      let updatedCount = 0;
      const importErrors: string[] = [];

      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i];
        const rowNum = i + 1;

        const id = idIdx > -1 ? cells[idIdx] : null;
        const name = nameIdx > -1 ? cells[nameIdx] : undefined;

        if (!name && !id) {
          importErrors.push(`Row ${rowNum}: Row is empty or missing required ID/Name.`);
          continue;
        }

        const contactEmail = emailIdx > -1 ? cells[emailIdx] : undefined;
        if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
            importErrors.push(`Row ${rowNum}: Invalid email format for "${contactEmail}".`);
            continue;
        }

        const specialtiesStr = specialtyIdx > -1 ? cells[specialtyIdx] : undefined;
        const specialties = specialtiesStr ? specialtiesStr.split(',').map((s: string) => capitalizeFirstLetter(s.trim())).filter(Boolean) : undefined;

        const supplierData = {
          name: name ? capitalizeWords(name) : undefined,
          contactName: contactNameIdx > -1 ? capitalizeWords(cells[contactNameIdx]) : undefined,
          contactEmail,
          contactPhone: phoneIdx > -1 ? cells[phoneIdx] : undefined,
          specialties,
          address: addressIdx > -1 ? capitalizeFirstLetter(cells[addressIdx]) : undefined,
          notes: notesIdx > -1 ? cells[notesIdx] : undefined,
        };

        try {
          if (id) {
            await updateSupplier(id, supplierData as UpdateSupplierData);
            updatedCount++;
          } else {
            if (!name) {
              importErrors.push(`Row ${rowNum}: Name is required to create a new record.`);
              continue;
            }
            await createSupplier(supplierData as CreateSupplierData);
            createdCount++;
          }
        } catch (dbError: any) {
          importErrors.push(`Row ${rowNum} (${id || name}): Error - ${dbError.message}`);
        }
      }

      if (createdCount > 0 || updatedCount > 0) {
        toast({ title: "Import Successful", description: `${createdCount} supplier(s) created, ${updatedCount} supplier(s) updated.` });
        fetchSuppliers();
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
      console.error("Error processing supplier import file:", err);
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
    if (filters.name || filters.specialty) {
        return (
            <>
                <p className="mt-5 text-xl font-medium text-foreground">No Suppliers Match Your Filters</p>
                <p className="text-sm text-muted-foreground/80 mt-2">Try adjusting or clearing your search terms.</p>
                <Button variant="link" onClick={clearFilters} className="mt-3">Clear Filters</Button>
            </>
        );
    }
    return (
        <>
            <p className="mt-5 text-xl font-medium text-foreground">No Suppliers Yet</p>
            <p className="text-sm text-muted-foreground/80 mt-2">Click the &quot;New Supplier&quot; button to add your first supplier.</p>
        </>
    );
  };

  if (isLoading && suppliers.length === 0) {
    return (
      <div className="space-y-0">
        <div className="p-4 space-y-3 border-b bg-muted/30">
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-grow bg-card" />
            <Skeleton className="h-10 flex-grow bg-card" />
            <Skeleton className="h-10 w-24 bg-card" />
          </div>
        </div>
        <Separator className="my-4" />
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
        <p className="text-destructive text-lg font-semibold">Error Loading Suppliers</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (displayedSuppliers.length === 0 && !isLoading && (suppliers.length === 0 || filters.name || filters.specialty)) {
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
            <Label htmlFor="nameFilterSupplier" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
              <Search className="h-3.5 w-3.5 mr-1.5" /> Filter by Name
            </Label>
            <Input
              id="nameFilterSupplier"
              type="text"
              placeholder="Search name..."
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              className="h-9 bg-card"
            />
          </div>
          <div className="flex-grow w-full sm:w-auto">
            <Label htmlFor="specialtyFilterSupplier" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
              <Filter className="h-3.5 w-3.5 mr-1.5" /> Filter by Specialty
            </Label>
            <Input
              id="specialtyFilterSupplier"
              type="text"
              placeholder="Search specialty..."
              value={filters.specialty}
              onChange={(e) => handleFilterChange('specialty', e.target.value)}
              className="h-9 bg-card"
            />
          </div>
          {(filters.name || filters.specialty) && (
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
                  style={{ width: `${columnWidths[col.id] || col.defaultWidth}px`, position: 'relative' }}
                  className="p-0 group/header text-center bg-muted/30"
                >
                  <Button
                    variant="ghost"
                    size="xs"
                    className="w-full h-full justify-center p-2 text-xs text-center font-medium text-muted-foreground hover:bg-muted/80"
                    onClick={() => col.sortable ? requestSort(col.id as SortableSupplierKeys) : undefined}
                  >
                    {col.label}
                    {col.sortable && getSortIndicator(col.id as SortableSupplierKeys)}
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
            {displayedSuppliers.map((supplier) => (
              <TableRow 
                key={supplier.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/suppliers/${supplier.id}/edit`)}
              >
                {initialColumnConfig.map(colConfig => (
                  <TableCell
                      key={`${supplier.id}-${colConfig.id}`}
                      style={{ width: `${columnWidths[colConfig.id] || colConfig.defaultWidth}px` }}
                      className="py-2.5 px-2 text-xs text-center truncate"
                  >
                    {colConfig.accessor ? colConfig.accessor(supplier) : String((supplier as any)[colConfig.id] ?? '')}
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
