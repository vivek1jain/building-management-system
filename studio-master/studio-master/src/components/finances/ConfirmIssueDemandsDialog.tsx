

"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, ReceiptText } from 'lucide-react';
import type { Flat, FlatWithServiceCharge } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ConfirmIssueDemandsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eligibleFlats: FlatWithServiceCharge[];
  quarterDisplayString: string;
  dueDate: Date;
  onConfirmIssue: (selectedFlats: FlatWithServiceCharge[]) => Promise<void>;
  serviceChargeRate: number;
  includeGroundRent: boolean;
}

export function ConfirmIssueDemandsDialog({
  isOpen,
  onOpenChange,
  eligibleFlats,
  quarterDisplayString,
  dueDate,
  onConfirmIssue,
  serviceChargeRate,
  includeGroundRent
}: ConfirmIssueDemandsDialogProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [selectedFlatIds, setSelectedFlatIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (isOpen) {
      // Pre-select all eligible flats when dialog opens
      setSelectedFlatIds(new Set(eligibleFlats.map(flat => flat.id)));
    } else {
      // Reset selection when dialog closes
      setSelectedFlatIds(new Set());
    }
  }, [isOpen, eligibleFlats]);

  const handleToggleFlatSelection = (flatId: string) => {
    setSelectedFlatIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(flatId)) {
        newSet.delete(flatId);
      } else {
        newSet.add(flatId);
      }
      return newSet;
    });
  };

  const handleToggleAllFlats = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedFlatIds(new Set(eligibleFlats.map(f => f.id)));
    } else {
      setSelectedFlatIds(new Set());
    }
  };

  const handleConfirm = async () => {
    if (selectedFlatIds.size === 0) {
      toast({ title: "No Flats Selected", description: "Please select at least one flat to issue demands.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    const flatsToIssue = eligibleFlats.filter(flat => selectedFlatIds.has(flat.id));
    await onConfirmIssue(flatsToIssue);
    setIsProcessing(false);
  };

  const totalSelectedFlats = selectedFlatIds.size;
  const totalSelectedAmount = eligibleFlats
    .filter(flat => selectedFlatIds.has(flat.id))
    .reduce((sum, flat) => {
        const serviceCharge = flat.calculatedServiceCharge || 0;
        const groundRent = includeGroundRent ? (flat.groundRent || 0) : 0;
        return sum + serviceCharge + groundRent;
    }, 0);


  const allSelected = eligibleFlats.length > 0 && selectedFlatIds.size === eligibleFlats.length;
  const someSelected = selectedFlatIds.size > 0 && selectedFlatIds.size < eligibleFlats.length;
  const checkboxState = allSelected ? true : (someSelected ? 'indeterminate' : false);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isProcessing) onOpenChange(open); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center"><ReceiptText className="mr-2 h-5 w-5 text-primary" />Confirm {includeGroundRent ? "Consolidated" : "Service Charge"} Demands</DialogTitle>
          <DialogDescription>
            Review the list of flats and their calculated charges for <strong>{quarterDisplayString}</strong>.
            Demands will be due by <strong>{format(dueDate, "PPP")}</strong>.
            Deselect any flats you do not want to issue demands for at this time.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-hidden">
          <ScrollArea className="h-[calc(70vh-200px)] pr-1">
            <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      id="selectAllFlatsConfirmation"
                      checked={checkboxState}
                      onCheckedChange={handleToggleAllFlats}
                      disabled={isProcessing || eligibleFlats.length === 0}
                      aria-label="Select all flats"
                    />
                  </TableHead>
                  <TableHead>Flat No.</TableHead>
                  <TableHead className="text-right">SC Amount</TableHead>
                  {includeGroundRent && <TableHead className="text-right">GR Amount</TableHead>}
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligibleFlats.map((flat) => {
                  const scAmount = flat.calculatedServiceCharge;
                  const grAmount = includeGroundRent ? (flat.groundRent || 0) : 0;
                  const totalAmount = scAmount + grAmount;
                  return (
                  <TableRow key={flat.id} data-state={selectedFlatIds.has(flat.id) ? "selected" : ""}>
                    <TableCell>
                      <Checkbox
                        id={`flat-${flat.id}-confirm`}
                        checked={selectedFlatIds.has(flat.id)}
                        onCheckedChange={() => handleToggleFlatSelection(flat.id)}
                        disabled={isProcessing}
                        aria-label={`Select flat ${flat.flatNumber}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{flat.flatNumber}</TableCell>
                    <TableCell className="text-right">{formatCurrency(scAmount)}</TableCell>
                    {includeGroundRent && <TableCell className="text-right">{formatCurrency(grAmount)}</TableCell>}
                    <TableCell className="text-right font-semibold">{formatCurrency(totalAmount)}</TableCell>
                  </TableRow>
                )})}
                {eligibleFlats.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                            No eligible flats found to issue demands for.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
            </TooltipProvider>
          </ScrollArea>
        </div>

        <div className="border-t pt-4 mt-auto">
            <div className="flex justify-between items-center text-sm mb-4">
                <div className="text-muted-foreground">
                    SC Rate: {formatCurrency(serviceChargeRate)}/sq.ft.
                </div>
                <div className="font-semibold">
                    Selected: {totalSelectedFlats} flat(s)
                </div>
                <div className="font-semibold text-primary">
                    Total Demands: {formatCurrency(totalSelectedAmount)}
                </div>
            </div>
            <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isProcessing}>
                Cancel
                </Button>
            </DialogClose>
            <Button type="button" onClick={handleConfirm} disabled={isProcessing || totalSelectedFlats === 0} className="bg-accent hover:bg-accent/90">
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Issue {totalSelectedFlats > 0 ? `${totalSelectedFlats} Demand(s)` : 'Demands'}
            </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
