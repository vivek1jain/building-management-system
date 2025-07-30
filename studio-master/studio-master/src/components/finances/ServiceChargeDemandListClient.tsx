

"use client";

import * as React from 'react';
import { applyPenaltyToDemand, recordPaymentForDemand, type RecordPaymentInput } from '@/lib/firebase/firestore'; 
import type { ServiceChargeDemand } from '@/types';
import { ServiceChargeDemandStatus, UserRole, PaymentMethod } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, FileSpreadsheet, PackageOpen, CheckCircle, AlertCircle, Hourglass, FileWarning, Ban, ArrowUpDown, ArrowUp, ArrowDown, DollarSign, Loader2, CreditCard } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Timestamp } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import type { FinancialQuarterOption } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';


function StatusBadge({ status }: { status: ServiceChargeDemandStatus }) {
  switch (status) {
    case ServiceChargeDemandStatus.ISSUED:
      return <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-500/10 text-xs"><AlertCircle className="mr-1 h-3 w-3" />{status}</Badge>;
    case ServiceChargeDemandStatus.PAID:
      return <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10 text-xs"><CheckCircle className="mr-1 h-3 w-3" />{status}</Badge>;
    case ServiceChargeDemandStatus.OVERDUE:
      return <Badge variant="destructive" className="text-xs"><FileWarning className="mr-1 h-3 w-3" />{status}</Badge>;
    case ServiceChargeDemandStatus.PARTIALLY_PAID:
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500 bg-yellow-500/10 text-xs"><Hourglass className="mr-1 h-3 w-3" />{status}</Badge>;
    case ServiceChargeDemandStatus.CANCELLED:
      return <Badge variant="secondary" className="text-xs"><Ban className="mr-1 h-3 w-3" />{status}</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

interface ServiceChargeDemandListClientProps {
  demands: ServiceChargeDemand[];
  quarterOptions: FinancialQuarterOption[];
  onUpdate: () => void;
}

interface GroupedDemands {
  [quarterKey: string]: {
    demands: ServiceChargeDemand[];
    fullLabel: string;
    totalDue: number;
    totalPaid: number;
    totalOutstanding: number;
    isFullyPaid: boolean;
  };
}


export function ServiceChargeDemandListClient({ demands, quarterOptions, onUpdate }: ServiceChargeDemandListClientProps) { 
  const { user } = useAuth();
  const { toast } = useToast();
  const [applyingPenaltyTo, setApplyingPenaltyTo] = React.useState<string | null>(null);
  
  const [isRecordPaymentDialogOpen, setIsRecordPaymentDialogOpen] = React.useState(false);
  const [selectedDemandForPayment, setSelectedDemandForPayment] = React.useState<ServiceChargeDemand | null>(null);
  const [defaultOpenAccordion, setDefaultOpenAccordion] = React.useState<string[]>([]);
  const [selectedDemands, setSelectedDemands] = React.useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = React.useState(false);
  
  const quarterOptionsMap = React.useMemo(() => {
    if (!quarterOptions) return new Map();
    return new Map(quarterOptions.map(opt => [opt.financialQuarterDisplayString, opt.label]));
  }, [quarterOptions]);

  const groupedDemands = React.useMemo(() => {
    let relevantDemands = demands.filter(d => d.baseAmount > 0);
    if (user?.role === UserRole.RESIDENT && user.flatId) {
        relevantDemands = relevantDemands.filter(d => d.flatId === user.flatId);
    }

    const grouped = relevantDemands.reduce<GroupedDemands>((acc, demand) => {
        const quarterKey = demand.financialQuarterDisplayString;
        if (!acc[quarterKey]) {
          acc[quarterKey] = { 
              demands: [], 
              fullLabel: quarterOptionsMap.get(quarterKey) || quarterKey,
              totalDue: 0, 
              totalPaid: 0, 
              totalOutstanding: 0, 
              isFullyPaid: false 
          };
        }
        acc[quarterKey].demands.push(demand);
        acc[quarterKey].totalDue += demand.totalAmountDue;
        acc[quarterKey].totalPaid += demand.amountPaid;
        acc[quarterKey].totalOutstanding += demand.outstandingAmount;
        return acc;
    }, {});
      
    for (const key in grouped) {
        grouped[key].isFullyPaid = grouped[key].totalOutstanding <= 0.001;
    }
    
    return grouped;
  }, [demands, user, quarterOptionsMap]);
  
  const handleRecordIndividualPaymentClick = (demand: ServiceChargeDemand, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent accordion from toggling
    setSelectedDemandForPayment(demand);
    setIsRecordPaymentDialogOpen(true);
  };

  const handlePaymentRecorded = () => {
    onUpdate(); // Tell parent to re-fetch all data
  };

  const handleApplyPenalty = React.useCallback(async (demandId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const GLOBAL_PENALTY_AMOUNT = 50; 
    if (!user || GLOBAL_PENALTY_AMOUNT <= 0) { 
        toast({ title: "Cannot Apply Penalty", description: "User not authenticated or global penalty amount not configured/zero.", variant: "destructive" });
        return;
    }
    setApplyingPenaltyTo(demandId);
    try {
        await applyPenaltyToDemand(demandId, user.uid, GLOBAL_PENALTY_AMOUNT); 
        toast({ title: "Penalty Applied", description: `Penalty of ${formatCurrency(GLOBAL_PENALTY_AMOUNT)} applied. Mock notification sent.` });
        onUpdate();
    } catch (error: any) {
        toast({ title: "Error Applying Penalty", description: error.message, variant: "destructive" });
    } finally {
        setApplyingPenaltyTo(null);
    }
  }, [user, toast, onUpdate]);

  const handleRecordBulkPayments = async () => {
    if (selectedDemands.size === 0) {
        toast({ title: "No Demands Selected", description: "Please select one or more demands to mark as paid.", variant: "destructive" });
        return;
    }
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }
    setIsBulkUpdating(true);
    let successCount = 0; let errorCount = 0;

    for (const demandId of Array.from(selectedDemands)) {
        const demandToUpdate = demands.find(d => d.id === demandId);
        if (demandToUpdate && demandToUpdate.outstandingAmount > 0) {
            const paymentData: RecordPaymentInput = {
                amount: demandToUpdate.outstandingAmount, 
                paymentDate: new Date(), 
                method: PaymentMethod.ONLINE, 
                reference: "Bulk Paid", 
            };
            try {
                await recordPaymentForDemand(demandId, paymentData, user.uid);
                successCount++;
            } catch (err) {
                errorCount++;
                console.error(`Error bulk updating demand ${demandId}:`, err);
            }
        }
    }
    setIsBulkUpdating(false);
    setSelectedDemands(new Set()); 
    onUpdate(); 
    if (successCount > 0) {
        toast({ title: "Bulk Payment Update Complete", description: `${successCount} demand(s) marked as fully paid.` });
    }
    if (errorCount > 0) {
        toast({ title: "Bulk Payment Update Issues", description: `${errorCount} demand(s) could not be updated.`, variant: "destructive" });
    }
  };


  const sortedQuarters = Object.keys(groupedDemands).sort((a, b) => {
    const getSortKey = (key: string) => {
        const yearMatch = key.match(/(\d{4}|\d{2}\/\d{2})/);
        if (!yearMatch) return 0;
        let yearPart = yearMatch[1];
        let year;
        if (yearPart.includes('/')) {
            const startYear = parseInt(yearPart.split('/')[0], 10);
            year = startYear < 50 ? 2000 + startYear : 1900 + startYear;
        } else {
            year = parseInt(yearPart, 10);
        }
        const quarterNum = parseInt(key.charAt(1), 10);
        return year * 10 + quarterNum;
    };
    return getSortKey(b) - getSortKey(a);
  });
  
  const totalOutstandingCount = Object.values(groupedDemands).flatMap(g => g.demands).filter(d => d.outstandingAmount > 0).length;

  if (Object.keys(groupedDemands).length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/50">
        <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">No Service Charge Demands Issued Yet</p>
        {user?.role === UserRole.MANAGER &&
          <p className="text-sm text-muted-foreground">Use the form to issue new quarterly demands.</p>
        }
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">
            {selectedDemands.size > 0 ? `${selectedDemands.size} of ${totalOutstandingCount} outstanding demand(s) selected.` : `${totalOutstandingCount} demand(s) with outstanding balance.`}
        </p>
        <Button onClick={handleRecordBulkPayments} disabled={selectedDemands.size === 0 || isBulkUpdating} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
            {isBulkUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CreditCard className="mr-2 h-4 w-4" />
            Mark Selected as Paid
        </Button>
      </div>
      <Accordion type="single" collapsible className="w-full" value={defaultOpenAccordion[0]} onValueChange={(val) => setDefaultOpenAccordion(val ? [val] : [])}>
        {sortedQuarters.map(quarterKey => {
            const quarterData = groupedDemands[quarterKey];
            const isFullyPaid = quarterData.isFullyPaid;
            const hasOutstanding = quarterData.totalOutstanding > 0.001;
            const hasPartial = quarterData.totalPaid > 0 && hasOutstanding;
            
            let statusBadge;
            if (isFullyPaid) {
                statusBadge = <Badge variant="outline" className="text-xs border-green-500 text-green-500 bg-green-500/10"><CheckCircle className="mr-1 h-3 w-3" />Fully Paid</Badge>;
            } else if (hasPartial) {
                statusBadge = <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500 bg-yellow-500/10"><Hourglass className="mr-1 h-3 w-3" />Partially Paid</Badge>;
            } else if (hasOutstanding) {
                 statusBadge = <Badge variant="outline" className="text-xs border-red-500 text-red-500 bg-red-500/10"><AlertCircle className="mr-1 h-3 w-3" />Outstanding</Badge>;
            } else {
                statusBadge = <Badge variant="outline" className="text-xs">Issued</Badge>;
            }

            return (
                <AccordionItem key={quarterKey} value={quarterKey} className={cn(isFullyPaid && "opacity-70 hover:opacity-100")}>
                <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-2 rounded-md text-left">
                    <div className="flex justify-between items-center w-full">
                        <span className="font-semibold text-sm">{quarterData.fullLabel}</span>
                        {statusBadge}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-1">
                    <div className="overflow-x-auto rounded-md border shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="text-xs">
                                <TableHead className="w-[50px]"><Checkbox 
                                  checked={quarterData.demands.every(d => selectedDemands.has(d.id))}
                                  onCheckedChange={(checked) => {
                                      const quarterIds = quarterData.demands.map(d => d.id);
                                      if (checked) {
                                          setSelectedDemands(prev => new Set([...prev, ...quarterIds]));
                                      } else {
                                          setSelectedDemands(prev => new Set([...prev].filter(id => !quarterIds.includes(id))));
                                      }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                /></TableHead>
                                <TableHead>Flat</TableHead>
                                <TableHead className="text-right">Outstanding</TableHead>
                                <TableHead className="text-right">Due</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {quarterData.demands.map(demand => (
                            <TableRow key={demand.id}>
                                <TableCell className="py-1.5"><Checkbox 
                                  checked={selectedDemands.has(demand.id)}
                                  onCheckedChange={() => setSelectedDemands(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(demand.id)) newSet.delete(demand.id); else newSet.add(demand.id);
                                    return newSet;
                                  })}
                                  onClick={(e) => e.stopPropagation()}
                                /></TableCell>
                                <TableCell className="font-medium text-xs py-1.5">{demand.flatNumber}</TableCell>
                                <TableCell className="text-right text-xs font-semibold text-primary">{formatCurrency(demand.outstandingAmount)}</TableCell>
                                <TableCell className="text-right text-xs">{format(demand.dueDate, 'PP')}</TableCell>
                                <TableCell className="text-center"><StatusBadge status={demand.status} /></TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {user?.role === UserRole.MANAGER && demand.outstandingAmount > 0 && (
                                            <Button variant="outline" size="xs" onClick={(e) => handleRecordIndividualPaymentClick(demand, e)}>
                                                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                                                Record Payment
                                            </Button>
                                        )}
                                        {user?.role === UserRole.MANAGER && demand.status === ServiceChargeDemandStatus.OVERDUE && !demand.penaltyAppliedAt && (
                                            <Button variant="destructive" size="xs" onClick={(e) => handleApplyPenalty(demand.id, e)} disabled={applyingPenaltyTo === demand.id}>
                                                {applyingPenaltyTo === demand.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <DollarSign className="mr-1 h-3 w-3" />}
                                                Penalty
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </div>
                </AccordionContent>
                </AccordionItem>
            );
        })}
      </Accordion>
       {selectedDemandForPayment && (
        <RecordPaymentDialog
            isOpen={isRecordPaymentDialogOpen}
            onOpenChange={setIsRecordPaymentDialogOpen}
            demandId={selectedDemandForPayment.id}
            demandFlatNumber={selectedDemandForPayment.flatNumber}
            demandQuarterYear={selectedDemandForPayment.financialQuarterDisplayString}
            currentOutstandingAmount={selectedDemandForPayment.outstandingAmount}
            onPaymentRecorded={handlePaymentRecorded}
        />
    )}
    </>
  );
}
