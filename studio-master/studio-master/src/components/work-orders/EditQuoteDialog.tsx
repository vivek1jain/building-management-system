
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, StickyNote, DollarSign, CheckCircle } from 'lucide-react';
import { QuoteRequestStatus, type QuoteRequest } from '@/types'; // Updated to use QuoteRequestStatus
import { cn } from '@/lib/utils';

const editQuoteSchema = z.object({
  quoteAmount: z.coerce.number().min(0, "Amount must be non-negative.").optional().nullable(),
  quoteDocumentUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')).nullable(),
  notes: z.string().max(500).optional().or(z.literal('')).nullable(),
  status: z.nativeEnum(QuoteRequestStatus).optional(), // Use the enum here
});

export type EditQuoteFormValues = z.infer<typeof editQuoteSchema>;

interface EditQuoteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  quoteRequest: QuoteRequest;
  onQuoteUpdated: (updatedQuoteData: EditQuoteFormValues) => void;
}

export function EditQuoteDialog({
  isOpen,
  onOpenChange,
  quoteRequest,
  onQuoteUpdated,
}: EditQuoteDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EditQuoteFormValues>({
    resolver: zodResolver(editQuoteSchema),
    defaultValues: {
      quoteAmount: quoteRequest.quoteAmount || null,
      quoteDocumentUrl: quoteRequest.quoteDocumentUrl || '',
      notes: quoteRequest.notes || '',
      status: quoteRequest.status || QuoteRequestStatus.PENDING,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        quoteAmount: quoteRequest.quoteAmount || null,
        quoteDocumentUrl: quoteRequest.quoteDocumentUrl || '',
        notes: quoteRequest.notes || '',
        status: quoteRequest.status || QuoteRequestStatus.PENDING,
      });
    }
  }, [isOpen, quoteRequest, form]);

  const handleFormSubmit = async (values: EditQuoteFormValues) => {
    setIsSubmitting(true);
    try {
      onQuoteUpdated(values); // Parent component handles the actual update
      toast({
        title: 'Quote Details Updated',
        description: `Details for ${quoteRequest.supplierName} have been saved.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error Updating Quote',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Quote: {quoteRequest.supplierName}</DialogTitle>
          <DialogDescription>
            Update the received quote information for this supplier.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="quoteAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quote Amount (£)</FormLabel>
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
              name="quoteDocumentUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quote Document URL</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="url"
                        placeholder="https://example.com/quote.pdf"
                        {...field}
                        value={field.value || ''}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quote Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || QuoteRequestStatus.PENDING}>
                    <FormControl>
                      <SelectTrigger>
                        <CheckCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <SelectValue placeholder="Select status" className="pl-10"/>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(QuoteRequestStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <Textarea
                        placeholder="Any notes about this quote..."
                        {...field}
                        value={field.value || ''}
                        className="pl-10 min-h-[60px]"
                      />
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
                Save Quote Details
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
