
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { PaymentMethod, type RecordPaymentInput } from '@/types';
import { CalendarIcon, Banknote, CreditCard, StickyNote, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { recordPaymentForDemand } from '@/lib/firebase/firestore';

interface RecordPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  demandId: string | null;
  demandQuarterYear?: string;
  demandFlatNumber?: string;
  currentOutstandingAmount?: number;
  onPaymentRecorded: (demandId: string, paymentData: RecordPaymentInput) => void;
}

const recordPaymentSchemaBase = z.object({
  amount: z.coerce.number().positive({ message: "Payment amount is required and must be positive." }),
  paymentDate: z.date({ required_error: "Payment date is required." }),
  method: z.nativeEnum(PaymentMethod).optional(),
  reference: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});


export function RecordPaymentDialog({
  isOpen,
  onOpenChange,
  demandId,
  demandQuarterYear,
  demandFlatNumber,
  currentOutstandingAmount = 0,
  onPaymentRecorded,
}: RecordPaymentDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const recordPaymentSchema = recordPaymentSchemaBase.refine(
    (data) => data.amount <= currentOutstandingAmount,
    {
      message: `Payment cannot exceed outstanding amount of ${formatCurrency(currentOutstandingAmount)}.`,
      path: ["amount"],
    }
  );
  
  const form = useForm<z.infer<typeof recordPaymentSchema>>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      amount: currentOutstandingAmount > 0 ? parseFloat(currentOutstandingAmount.toFixed(2)) : 0,
      paymentDate: new Date(),
      method: PaymentMethod.ONLINE,
      reference: '',
      notes: '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        amount: currentOutstandingAmount > 0 ? parseFloat(currentOutstandingAmount.toFixed(2)) : 0,
        paymentDate: new Date(),
        method: PaymentMethod.ONLINE,
        reference: '',
        notes: '',
      });
    }
  }, [isOpen, currentOutstandingAmount, form]);


  const handleFormSubmit = async (values: z.infer<typeof recordPaymentSchema>) => {
    if (!demandId) {
        toast({title: "Error", description: "Demand ID is missing.", variant: "destructive"});
        return;
    }
    if (!user) {
        toast({title: "Authentication Error", description: "You must be logged in.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    
    const paymentData: RecordPaymentInput = {
      amount: values.amount,
      paymentDate: values.paymentDate,
      method: values.method,
      reference: values.reference || undefined,
      notes: values.notes || undefined,
    };
    
    try {
        await recordPaymentForDemand(demandId, paymentData, user.uid);
        toast({
            title: 'Payment Recorded',
            description: `Payment of ${formatCurrency(values.amount)} for ${demandFlatNumber} (${demandQuarterYear}) has been successfully recorded.`,
        });
        onPaymentRecorded(demandId, paymentData); 
        onOpenChange(false); 
    } catch (error: any) {
        toast({
            title: 'Error Recording Payment',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            For Flat <strong>{demandFlatNumber}</strong> - Quarter <strong>{demandQuarterYear}</strong>. <br/>
            Outstanding: <span className="font-semibold text-primary">{formatCurrency(currentOutstandingAmount)}</span>. Fields marked with an asterisk (<span className="text-destructive">*</span>) are required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount (£)<span className="text-destructive ml-1">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="number" step="0.01" placeholder="0.00" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date<span className="text-destructive ml-1">*</span></FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <SelectValue placeholder="Select payment method" className="pl-10" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(PaymentMethod).map((method) => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference / Transaction ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CHQ123, OnlineRefXYZ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <StickyNote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea placeholder="Any notes about the payment..." {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
    
