

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
import { RecordPaymentDialog } from './RecordPaymentDialog';
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

interface GroundRentDemandListClientProps {
  demands: ServiceChargeDemand[];
  onUpdate: () => void;
}

export function GroundRentDemandListClient({ demands, onUpdate }: GroundRentDemandListClientProps) { 
  const { user } = useAuth();
  const { toast } = useToast();
  const [applyingPenaltyTo, setApplyingPenaltyTo] = React.useState<string | null>(null);
  
  const [isRecordPaymentDialogOpen, setIsRecordPaymentDialogOpen] = React.useState(false);
  const [selectedDemandForPayment, setSelectedDemandForPayment] = React.useState<ServiceChargeDemand | null>(null);
  const [selectedDemands, setSelectedDemands] = React.useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = React.useState(false);

  const relevantDemands = React.useMemo(() => {
    let filteredDemands = demands.filter(d => (d.groundRentAmount ?? 0) > 0);
    if (user?.role === UserRole.RESIDENT && user.flatId) {
        filteredDemands = filteredDemands.filter(d => d.flatId === user.flatId);
    }
    return filteredDemands.sort((a, b) => b.issuedDate.getTime() - a.issuedDate.getTime());
  }, [demands, user]);
  
  const handleRecordIndividualPaymentClick = (demand: ServiceChargeDemand, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedDemandForPayment(demand);
    setIsRecordPaymentDialogOpen(true);
  };

  const handlePaymentRecorded = () => {
    onUpdate();
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

  const totalOutstandingCount = relevantDemands.filter(d => d.outstandingAmount > 0).length;

  if (relevantDemands.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/50">
        <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">No Ground Rent Demands Issued</p>
        {user?.role === UserRole.MANAGER &&
          <p className="text-sm text-muted-foreground">Use the form to issue new annual demands.</p>
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
      <div className="overflow-x-auto rounded-md border shadow-sm">
        <Table>
            <TableHeader>
                <TableRow className="text-xs">
                    <TableHead className="w-[50px]"><Checkbox 
                      checked={relevantDemands.length > 0 && selectedDemands.size === relevantDemands.length}
                      onCheckedChange={(checked) => {
                          const allIds = relevantDemands.map(d => d.id);
                          if (checked) {
                              setSelectedDemands(new Set(allIds));
                          } else {
                              setSelectedDemands(new Set());
                          }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    /></TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Flat</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
            {relevantDemands.map(demand => (
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
                    <TableCell className="font-medium text-xs py-1.5">{demand.financialQuarterDisplayString}</TableCell>
                    <TableCell className="font-medium text-xs py-1.5">{demand.flatNumber}</TableCell>
                    <TableCell className="text-right text-xs font-semibold text-primary">{formatCurrency(demand.outstandingAmount)}</TableCell>
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
