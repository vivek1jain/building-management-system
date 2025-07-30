
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { updateWorkOrderFields } from '@/lib/firebase/firestore';
import type { Supplier, WorkOrder } from '@/types';
import { WorkOrderStatus } from '@/types';
import { Loader2, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const NO_SUPPLIER_SELECTED_VALUE = "__NO_SUPPLIER__";

const scheduleWorkSchema = z.object({
  supplierId: z.string().min(1, { message: "A supplier must be selected." }),
  scheduledDate: z.date({ required_error: "A date for the work must be selected." }),
  cost: z.coerce.number().min(0, "Cost must be non-negative.").optional().nullable(),
});

type ScheduleWorkFormValues = z.infer<typeof scheduleWorkSchema>;

interface ScheduleWorkDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder;
  suppliers: Supplier[];
  initialData: {
    supplierId?: string;
    quotePrice?: number | null;
    scheduledDate?: Date | null;
  } | null;
  onWorkOrderScheduled: () => void;
}

export function ScheduleWorkDialog({
  isOpen,
  onOpenChange,
  workOrder,
  suppliers,
  initialData,
  onWorkOrderScheduled,
}: ScheduleWorkDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ScheduleWorkFormValues>({
    resolver: zodResolver(scheduleWorkSchema),
    defaultValues: {
      supplierId: initialData?.supplierId || NO_SUPPLIER_SELECTED_VALUE,
      scheduledDate: initialData?.scheduledDate || new Date(),
      cost: initialData?.quotePrice,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        supplierId: initialData?.supplierId || NO_SUPPLIER_SELECTED_VALUE,
        scheduledDate: initialData?.scheduledDate || new Date(),
        cost: initialData?.quotePrice,
      });
    }
  }, [isOpen, initialData, form]);

  const handleFormSubmit = async (values: ScheduleWorkFormValues) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const selectedSupplier = suppliers.find(s => s.id === values.supplierId);
      const updatePayload: Partial<WorkOrder> = {
        status: WorkOrderStatus.SCHEDULED,
        supplierId: values.supplierId,
        supplierName: selectedSupplier?.name,
        scheduledDate: values.scheduledDate,
        cost: values.cost,
      };

      await updateWorkOrderFields(workOrder.id, user.uid, updatePayload);
      
      toast({
        title: "Work Scheduled",
        description: `Work order has been scheduled with ${selectedSupplier?.name || 'the selected supplier'}.`,
      });
      onWorkOrderScheduled();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error Scheduling Work",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Work</DialogTitle>
          <DialogDescription>
            Confirm the supplier, schedule date, and cost for this work order.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agreed Cost (£)</FormLabel>
                  <FormControl>
                     <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value === null ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormLabel>Scheduled Date</FormLabel>
                  <FormControl>
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={isSubmitting}
                        className="rounded-md border"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule Work
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
