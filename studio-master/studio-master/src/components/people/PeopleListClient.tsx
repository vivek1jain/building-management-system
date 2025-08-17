

"use client";

import * as React from 'react';
import Link from 'next/link';
import { getPeople, getFlats, type Flat as FlatType, updatePerson, type UpdatePersonData, createPerson, type CreatePersonData } from '@/lib/firebase/firestore';
import type { Person } from '@/types';
import { PersonStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Users, Pencil, AlertTriangle, PackageOpen, Building, CalendarDays, CheckCircle, Mail, Phone, ArrowUpDown, ArrowUp, ArrowDown, Filter, Search, Download, FileText, FileJson, CircleDashed, Loader2, Upload, Send } from 'lucide-react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
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
import { useAuth } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation'; 
import { capitalizeWords, splitName } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

const ALL_STATUSES_FILTER_VALUE = "__ALL_STATUSES__";

type SortablePeopleKeys = keyof Pick<Person, 'status' | 'name' | 'isPrimaryContact' | 'flatNumber' | 'email' | 'phone' | 'moveInDate' | 'moveOutDate' | 'uid'>;

interface SortConfig {
  key: SortablePeopleKeys | null;
  direction: 'ascending' | 'descending';
}

interface Filters {
  name: string;
  status: PersonStatus | '';
  flatNumber: string;
}

interface ColumnConfig {
  id: SortablePeopleKeys | 'actions' | 'firstName' | 'lastName' | 'appAccess' | 'select';
  label: string;
  minWidth: number;
  defaultWidth: number;
  isResizable: boolean;
  sortable: boolean;
  sortKey?: SortablePeopleKeys;
  accessor?: (person: Person) => React.ReactNode;
}

interface PeopleListClientProps {
  setPeopleForBulkInvite: (people: Person[]) => void;
  selectedPeopleIds: Set<string>;
  setSelectedPeopleIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

function convertPeopleToCSV(data: Person[]): string {
  if (!data || data.length === 0) {
    return "";
  }
  const headers = [
    "ID", "FirstName", "LastName", "Status", "AppAccount", "FlatNumber", "Email", "Phone",
    "PrimaryContact", "MoveInDate", "MoveOutDate", "Notes"
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
    return format(date, "yyyy-MM-dd");
  };
  const rows = data.map(person => {
    const { firstName, lastName } = splitName(person.name);
    return [
      escapeCSVCell(person.id),
      escapeCSVCell(firstName),
      escapeCSVCell(lastName),
      escapeCSVCell(person.status),
      escapeCSVCell(person.uid ? "Yes" : "No"),
      escapeCSVCell(person.flatNumber || ""),
      escapeCSVCell(person.email || ""),
      escapeCSVCell(person.phone || ""),
      escapeCSVCell(person.isPrimaryContact ? "Yes" : "No"),
      formatDateForCSV(person.moveInDate),
      formatDateForCSV(person.moveOutDate),
      escapeCSVCell(person.notes || "")
    ].join(",");
  });
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

export function PeopleListClient({ setPeopleForBulkInvite, selectedPeopleIds, setSelectedPeopleIds }: PeopleListClientProps) {
  const { user } = useAuth();
  const router = useRouter(); 
  const [people, setPeople] = React.useState<Person[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<Filters>({ name: '', status: '', flatNumber: '' });
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'name', direction: 'ascending' });

  const [allFlats, setAllFlats] = React.useState<FlatType[]>([]);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const initialColumnConfig = React.useMemo<ColumnConfig[]>(() => [
    {
        id: 'select', label: '', minWidth: 40, defaultWidth: 50, isResizable: false, sortable: false,
        accessor: (person) => (
            <Checkbox
                aria-label={`Select person ${person.name}`}
                checked={selectedPeopleIds.has(person.id)}
                onCheckedChange={() => setSelectedPeopleIds(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(person.id)) newSet.delete(person.id);
                    else newSet.add(person.id);
                    return newSet;
                })}
                onClick={(e) => e.stopPropagation()}
            />
        )
    },
    { id: 'firstName', label: 'First Name', minWidth: 100, defaultWidth: 140, isResizable: true, sortable: true, sortKey: 'name',
      accessor: (person) => {
        const { firstName } = splitName(person.name);
        return <Tooltip><TooltipTrigger asChild><span className="font-medium text-sm truncate cursor-default text-primary" title={firstName}>{firstName}</span></TooltipTrigger><TooltipContent side="bottom" align="center"><p className="text-xs">{firstName}</p></TooltipContent></Tooltip>;
      }
    },
    { id: 'lastName', label: 'Last Name', minWidth: 100, defaultWidth: 140, isResizable: true, sortable: true, sortKey: 'name',
      accessor: (person) => {
        const { lastName } = splitName(person.name);
        return <Tooltip><TooltipTrigger asChild><span className="font-medium text-sm truncate cursor-default" title={lastName}>{lastName}</span></TooltipTrigger><TooltipContent side="bottom" align="center"><p className="text-xs">{lastName}</p></TooltipContent></Tooltip>;
      }
    },
    { id: 'status', label: 'Status', minWidth: 80, defaultWidth: 110, isResizable: true, sortable: true,
      accessor: (person) => <Badge variant="outline" className="text-xs px-1.5 py-0.5 w-full justify-center truncate" title={person.status}>{person.status}</Badge>
    },
    { id: 'appAccess', label: 'App Access', minWidth: 80, defaultWidth: 90, isResizable: true, sortable: true, sortKey: 'uid',
      accessor: (person: Person) => (
        <div className="flex items-center justify-center w-full">
          {person.uid ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </TooltipTrigger>
              <TooltipContent side="bottom"><p className="text-xs">Has System Account</p></TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <CircleDashed className="h-4 w-4 text-muted-foreground/60" />
              </TooltipTrigger>
              <TooltipContent side="bottom"><p className="text-xs">No System Account</p></TooltipContent>
            </Tooltip>
          )}
        </div>
      )
    },
    { id: 'isPrimaryContact', label: 'P.', minWidth: 40, defaultWidth: 50, isResizable: true, sortable: true,
      accessor: (person) => person.isPrimaryContact ? <Tooltip><TooltipTrigger asChild><CheckCircle className="h-3.5 w-3.5 text-green-500" /></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Primary Contact</p></TooltipContent></Tooltip> : null
    },
    { id: 'flatNumber', label: 'Flat #', minWidth: 80, defaultWidth: 100, isResizable: true, sortable: true,
      accessor: (person) => <Tooltip><TooltipTrigger asChild><div className="flex items-center truncate cursor-default"><Building className="mr-1 h-3 w-3 flex-shrink-0" />{person.flatNumber || <span className="italic">N/A</span>}</div></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Flat: {person.flatNumber || 'N/A'}</p></TooltipContent></Tooltip>
    },
    { id: 'email', label: 'Email', minWidth: 120, defaultWidth: 180, isResizable: true, sortable: true,
      accessor: (person) => person.email ? <Tooltip><TooltipTrigger asChild><div className="flex items-center truncate cursor-default"><Mail className="mr-1 h-3 w-3 flex-shrink-0" /><a href={`mailto:${person.email}`} className="hover:underline hover:text-primary" onClick={(e) => e.stopPropagation()}>{person.email}</a></div></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Email: {person.email}</p></TooltipContent></Tooltip> : <div className="h-[1em]">&nbsp;</div>
    },
    { id: 'phone', label: 'Phone', minWidth: 100, defaultWidth: 130, isResizable: true, sortable: true,
      accessor: (person) => person.phone ? <Tooltip><TooltipTrigger asChild><div className="flex items-center truncate cursor-default"><Phone className="mr-1 h-3 w-3 flex-shrink-0" /><a href={`tel:${person.phone}`} className="hover:underline hover:text-primary" onClick={(e) => e.stopPropagation()}>{person.phone}</a></div></TooltipTrigger><TooltipContent side="bottom"><p className="text-xs">Phone: {person.phone}</p></TooltipContent></Tooltip> : <div className="h-[1em]">&nbsp;</div>
    },
    { id: 'actions', label: 'Actions', minWidth: 70, defaultWidth: 70, isResizable: false, sortable: false,
      accessor: (person) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild><Link href={`/people/${person.id}/edit`} onClick={(e) => e.stopPropagation()}><Pencil className="h-4 w-4" /><span className="sr-only">Edit Person</span></Link></Button>
          </TooltipTrigger><TooltipContent side="left"><p className="text-xs">Edit Person</p></TooltipContent>
        </Tooltip>
      )
    },
  ], [selectedPeopleIds, setSelectedPeopleIds]);


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
      const [fetchedPeople, fetchedFlats] = await Promise.all([
        getPeople(),
        getFlats()
      ]);
      setPeople(fetchedPeople);
      setPeopleForBulkInvite(fetchedPeople); // Pass all people up
      setAllFlats(fetchedFlats);
    } catch (err: any) {
      setError(err.message || "Failed to fetch initial data.");
      toast({
        title: 'Error Fetching Data',
        description: err.message || "Could not load people or flats data.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, setPeopleForBulkInvite]);

  React.useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleFilterChange = (filterName: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value as PersonStatus | '' }));
  };

  const requestSort = (columnId: ColumnConfig['id']) => {
    const column = initialColumnConfig.find(col => col.id === columnId);
    if (!column || !column.sortable) return;

    const sortKey = column.sortKey || (column.id as SortablePeopleKeys);
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === sortKey && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key: sortKey, direction });
  };

  const getSortIndicator = (columnId: ColumnConfig['id']) => {
    const column = initialColumnConfig.find(col => col.id === columnId);
    if (!column || !column.sortable) return null;
    const sortKey = column.sortKey || (column.id as SortablePeopleKeys);

    if (sortConfig.key !== sortKey) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50 group-hover:opacity-100" />;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-1 h-3 w-3 text-primary" />;
    return <ArrowDown className="ml-1 h-3 w-3 text-primary" />;
  };

  const displayedPeople = React.useMemo(() => {
    let filtered = [...people];
    if (filters.name) { 
      filtered = filtered.filter(p => p.name.toLowerCase().includes(filters.name.toLowerCase()));
    }
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.flatNumber) {
      filtered = filtered.filter(p => p.flatNumber?.toLowerCase().includes(filters.flatNumber.toLowerCase()));
    }
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key!];
        let bValue = b[sortConfig.key!];
        
        if (sortConfig.key === 'name') {
            aValue = a.name;
            bValue = b.name;
        } else if (sortConfig.key === 'uid') { 
            const aHasAccount = !!a.uid;
            const bHasAccount = !!b.uid;
            if (aHasAccount !== bHasAccount) {
                return sortConfig.direction === 'ascending' ? (aHasAccount ? -1 : 1) : (aHasAccount ? 1 : -1);
            }
            return (a.name || '').localeCompare(b.name || '') * (sortConfig.direction === 'ascending' ? 1 : -1);
        }


        let comparison = 0;
        if (sortConfig.key === 'moveInDate' || sortConfig.key === 'moveOutDate') {
          const aDate = (aValue as Timestamp | Date | null)?.valueOf() || 0;
          const bDate = (bValue as Timestamp | Date | null)?.valueOf() || 0;
          comparison = aDate > bDate ? 1 : (aDate < bDate ? -1 : 0);
        } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          comparison = aValue === bValue ? 0 : (aValue ? -1 : 1); 
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
  }, [people, filters, sortConfig]);

  const clearFilters = () => {
    setFilters({ name: '', status: '', flatNumber: '' });
  };

  const handleExportCSV = () => {
    if (displayedPeople.length === 0) {
      toast({ title: "No Data to Export", description: "There are no people matching the current filters to export.", variant: "default" });
      return;
    }
    const csvString = convertPeopleToCSV(displayedPeople);
    const filename = `people_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`;
    triggerDownload(csvString, filename, 'text/csv;charset=utf-8;');
    toast({ title: "Export Successful", description: `${displayedPeople.length} record(s) exported to ${filename} as CSV.` });
  };

  const handleExportJSON = () => {
    if (displayedPeople.length === 0) {
      toast({ title: "No Data to Export", description: "There are no people matching the current filters to export.", variant: "default" });
      return;
    }
    const jsonString = JSON.stringify(displayedPeople, null, 2);
    const filename = `people_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.json`;
    triggerDownload(jsonString, filename, 'application/json;charset=utf-8;');
    toast({ title: "Export Successful", description: `${displayedPeople.length} record(s) exported to ${filename} as JSON.` });
  };
  
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to import people.", variant: "destructive" });
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
        if (lines.length > 0) rows = lines.map(line => line.split(',').map(cell => cell.trim()));
      } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
      } else {
        throw new Error("Unsupported file type. Please upload a CSV, XLS, or XLSX file.");
      }

      if (rows.length < 2) throw new Error("File must contain a header row and at least one data row.");
      
      const headers = rows[0].map(h => String(h).toLowerCase());
      const idIdx = headers.indexOf('id');
      const firstNameIdx = headers.indexOf('firstname');
      const lastNameIdx = headers.indexOf('lastname');
      const statusIdx = headers.indexOf('status');
      const flatNumIdx = headers.indexOf('flatnumber');
      const emailIdx = headers.indexOf('email');
      const phoneIdx = headers.indexOf('phone');
      const primaryContactIdx = headers.indexOf('primarycontact');
      const moveInDateIdx = headers.indexOf('moveindate');
      const moveOutDateIdx = headers.indexOf('moveoutdate');
      const notesIdx = headers.indexOf('notes');

      if (firstNameIdx === -1 && idIdx === -1) {
          throw new Error("File must contain at least an 'ID' column (for updates) or 'FirstName' & 'LastName' columns (for new people).");
      }
      
      let createdCount = 0;
      let updatedCount = 0;
      const importErrors: string[] = [];
      const flatMap = new Map(allFlats.map(f => [f.flatNumber.toLowerCase(), f.id]));

      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i];
        const rowNum = i + 1;
        const id = idIdx > -1 ? cells[idIdx] : null;

        const firstName = firstNameIdx > -1 ? cells[firstNameIdx] : undefined;
        const lastName = lastNameIdx > -1 ? cells[lastNameIdx] : undefined;
        let fullName: string | undefined;
        if(firstName !== undefined && lastName !== undefined) {
            fullName = capitalizeWords(`${firstName} ${lastName}`);
        } else if (firstName !== undefined) {
            fullName = capitalizeWords(firstName);
        }

        const flatNumber = flatNumIdx > -1 ? cells[flatNumIdx] : undefined;
        let flatId: string | null | undefined = undefined;
        if (flatNumber !== undefined) {
            if (flatNumber === '') {
                flatId = null;
            } else if (flatMap.has(flatNumber.toLowerCase())) {
                flatId = flatMap.get(flatNumber.toLowerCase());
            } else {
                importErrors.push(`Row ${rowNum}: FlatNumber "${flatNumber}" not found.`);
                continue;
            }
        }
        
        const parseDateString = (dateStr: string | undefined): Date | null => {
            if (!dateStr || dateStr.trim() === '') return null;
            const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
            return isNaN(parsed.getTime()) ? null : parsed;
        };

        const personData: UpdatePersonData | CreatePersonData = {
          name: fullName,
          status: statusIdx > -1 ? cells[statusIdx] as PersonStatus : PersonStatus.RESIDENT, // Default status
          flatId,
          email: emailIdx > -1 ? cells[emailIdx] : undefined,
          phone: phoneIdx > -1 ? cells[phoneIdx] : undefined,
          isPrimaryContact: primaryContactIdx > -1 ? ['true', 'yes', '1'].includes(String(cells[primaryContactIdx]).toLowerCase()) : undefined,
          moveInDate: moveInDateIdx > -1 ? parseDateString(cells[moveInDateIdx]) : undefined,
          moveOutDate: moveOutDateIdx > -1 ? parseDateString(cells[moveOutDateIdx]) : undefined,
          notes: notesIdx > -1 ? cells[notesIdx] : undefined,
        };

        try {
          if (id) {
            await updatePerson(id, user.uid, personData as UpdatePersonData);
            updatedCount++;
          } else {
            if (!fullName) {
              importErrors.push(`Row ${rowNum}: FirstName and LastName are required to create a new record.`);
              continue;
            }
            await createPerson(personData as CreatePersonData, user.uid);
            createdCount++;
          }
        } catch (dbError: any) {
          importErrors.push(`Row ${rowNum} (ID: ${id || fullName}): Error - ${dbError.message}`);
        }
      }

      if (createdCount > 0 || updatedCount > 0) {
        toast({ title: "Import Successful", description: `${createdCount} people created, ${updatedCount} people updated.` });
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
      console.error("Error processing people import file:", err);
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
    if (filters.name || filters.status || filters.flatNumber) {
        return (
            <>
                <p className="mt-5 text-xl font-medium text-foreground">No People Match Your Filters</p>
                <p className="text-sm text-muted-foreground/80 mt-2">Try adjusting or clearing your search terms.</p>
                <Button variant="link" onClick={clearFilters} className="mt-3">Clear Filters</Button>
            </>
        );
    }
    return (
        <>
            <p className="mt-5 text-xl font-medium text-foreground">No People Yet</p>
            <p className="text-sm text-muted-foreground/80 mt-2">New people are added via app signup and approved by an admin.</p>
        </>
    );
  };

  return (
    <TooltipProvider>
      <div className="mb-4 p-4 border rounded-md shadow-sm bg-muted/30">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-grow w-full sm:w-auto">
            <Label htmlFor="nameFilterPeople" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
              <Search className="h-3.5 w-3.5 mr-1.5" /> Filter by Name
            </Label>
            <Input
              id="nameFilterPeople" type="text" placeholder="Search name..."
              value={filters.name} onChange={(e) => handleFilterChange('name', e.target.value)} className="h-9 bg-card"
            />
          </div>
          <div className="w-full sm:w-48">
            <Label htmlFor="statusFilterPeople" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
                <Filter className="h-3.5 w-3.5 mr-1.5" /> Filter by Status
            </Label>
            <Select
              value={filters.status || undefined}
              onValueChange={(value) => handleFilterChange('status', value === ALL_STATUSES_FILTER_VALUE ? '' : value as PersonStatus | '')}
            >
              <SelectTrigger className="h-9 bg-card"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES_FILTER_VALUE}>All Statuses</SelectItem>
                {Object.values(PersonStatus).map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-grow w-full sm:w-auto">
            <Label htmlFor="flatFilterPeople" className="text-xs font-medium text-muted-foreground flex items-center mb-1.5">
              <Filter className="h-3.5 w-3.5 mr-1.5" /> Filter by Flat #
            </Label>
            <Input
              id="flatFilterPeople" type="text" placeholder="Search flat number..."
              value={filters.flatNumber} onChange={(e) => handleFilterChange('flatNumber', e.target.value)} className="h-9 bg-card"
            />
          </div>
          {(filters.name || filters.status || filters.flatNumber) && (
             <Button variant="ghost" onClick={clearFilters} className="h-9 px-3 text-xs">Clear Filters</Button>
          )}
        </div>
      </div>
      <Separator className="my-4" />

      {isLoading && people.length === 0 ? (
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
      ) : error ? (
        <div className="flex flex-col items-center justify-center text-center py-10">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive text-lg font-semibold">Error Loading People</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : displayedPeople.length === 0 && (people.length === 0 || filters.name || filters.status || filters.flatNumber) ? (
        <div className="text-center py-10 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/50 p-8">
          <PackageOpen className="mx-auto h-16 w-16 text-muted-foreground/70" />
          {renderNoResultsMessage()}
        </div>
      ) : (
        <>
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
                    {col.id === 'select' ? (
                        <div className="flex items-center justify-center h-full p-2">
                            <Checkbox
                                aria-label="Select all people on this page"
                                checked={displayedPeople.length > 0 && selectedPeopleIds.size === displayedPeople.length}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setSelectedPeopleIds(new Set(displayedPeople.map(p => p.id)));
                                    } else {
                                        setSelectedPeopleIds(new Set());
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="xs"
                            className="w-full h-full justify-center p-2 text-xs text-center font-medium text-muted-foreground hover:bg-muted/80"
                            onClick={() => requestSort(col.id)}
                        >
                            {col.label}
                            {col.sortable && getSortIndicator(col.id)}
                        </Button>
                    )}
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
                {displayedPeople.map((person) => (
                    <TableRow 
                    key={person.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/people/${person.id}/edit`)}
                    >
                    {initialColumnConfig.map(colConfig => (
                        <TableCell
                            key={`${person.id}-${colConfig.id}`}
                            style={{ width: `${columnWidths[colConfig.id] || col.defaultWidth}px` }}
                            className="py-2.5 px-2 text-xs text-center truncate"
                        >
                        {colConfig.accessor ? colConfig.accessor(person) : String((person as any)[colConfig.id] ?? '')}
                        </TableCell>
                    ))}
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </div>
        </>
      )}

      <div className="mt-6 flex justify-end items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isImporting || isLoading}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import File
        </Button>
        <input type="file" ref={fileInputRef} accept=".csv,.xls,.xlsx" style={{ display: 'none' }} onChange={handleFileImport} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="btn-outline btn-sm">
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
