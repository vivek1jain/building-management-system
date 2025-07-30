

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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { createExpense, type CreateExpenseData, getSuppliers, type Supplier, getBudgetCategories, type BudgetCategory } from '@/lib/firebase/firestore';
import { Loader2, Banknote, CalendarIcon, Tag, Wrench, StickyNote } from 'lucide-react';
import { getFinancialYearForDate } from '@/lib/date-utils';

const NO_SUPPLIER_SELECTED_VALUE = "__NO_SUPPLIER__";

const expenseFormSchema = z.object({
  description: z.string().min(3, { message: "Description is required and must be at least 3 characters." }).max(255),
  amount: z.coerce.number().positive({ message: "Amount is required and must be a positive number." }),
  date: z.date({ required_error: "Expense date is required." }),
  categoryId: z.string({ required_error: "A budget category must be selected."}),
  supplierId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface AddExpenseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseAdded: () => void;
  buildingId: string;
}

export function AddExpenseDialog({ isOpen, onOpenChange, onExpenseAdded, buildingId }: AddExpenseDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = React.useState(true);
  const [budgetCategories, setBudgetCategories] = React.useState<BudgetCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(true);


  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: new Date(),
      categoryId: undefined, 
      supplierId: NO_SUPPLIER_SELECTED_VALUE,
      notes: '',
    },
  });
  
  const expenseDate = form.watch('date');

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        description: '',
        amount: 0,
        date: new Date(),
        categoryId: undefined,
        supplierId: NO_SUPPLIER_SELECTED_VALUE,
        notes: '',
      });

      const fetchSuppliersList = async () => {
        setIsLoadingSuppliers(true);
        try {
            const fetchedSuppliers = await getSuppliers(buildingId);
            setSuppliers(fetchedSuppliers);
        } catch (error) {
            console.error("Failed to fetch suppliers:", error);
            toast({ title: "Error", description: "Could not load suppliers.", variant: "destructive" });
        } finally {
            setIsLoadingSuppliers(false);
        }
      };
      fetchSuppliersList();
    }
  }, [isOpen, form, toast, buildingId]);

  React.useEffect(() => {
    const fetchCategoriesForDate = async () => {
        if (!expenseDate) return;
        setIsLoadingCategories(true);
        try {
            const { fyLabel } = getFinancialYearForDate(expenseDate, null);
            const fetchedCategories = await getBudgetCategories(buildingId, fyLabel);
            setBudgetCategories(fetchedCategories);
            // Reset category if the current one is not in the new list
            const currentCategoryId = form.getValues('categoryId');
            if (currentCategoryId && !fetchedCategories.some(c => c.id === currentCategoryId)) {
                form.setValue('categoryId', undefined);
            }
        } catch (error) {
            console.error("Failed to fetch budget categories for date:", error);
            toast({ title: "Error", description: "Could not load budget categories for the selected date.", variant: "destructive" });
        } finally {
            setIsLoadingCategories(false);
        }
    };
    if (isOpen) {
        fetchCategoriesForDate();
    }
  }, [isOpen, expenseDate, form, toast, buildingId]);


  const handleFormSubmit = async (values: ExpenseFormValues) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    const selectedSupplier = values.supplierId && values.supplierId !== NO_SUPPLIER_SELECTED_VALUE 
        ? suppliers.find(s => s.id === values.supplierId) 
        : null;
    const selectedCategory = budgetCategories.find(c => c.id === values.categoryId);

    const expenseData: CreateExpenseData = {
      description: values.description,
      amount: values.amount,
      date: values.date,
      categoryId: values.categoryId,
      categoryName: selectedCategory?.name || 'Uncategorized',
      supplierId: selectedSupplier?.id,
      supplierName: selectedSupplier?.name,
      notes: values.notes || undefined,
    };

    try {
      await createExpense(buildingId, expenseData, user.uid);
      toast({ title: 'Expense Logged', description: 'The expense has been successfully recorded.' });
      onExpenseAdded();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error Logging Expense', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Log New Expense</DialogTitle>
          <DialogDescription>
            Record an operational expense. Fields marked with an asterisk (<span className="text-destructive">*</span>) are required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description<span className="text-destructive ml-1">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Office stationery, Communal area cleaning" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (£)<span className="text-destructive ml-1">*</span></FormLabel>
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
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Expense<span className="text-destructive ml-1">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category<span className="text-destructive ml-1">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCategories}>
                    <FormControl>
                      <SelectTrigger>
                        <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select expense category"} className="pl-10" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {budgetCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || NO_SUPPLIER_SELECTED_VALUE} 
                    disabled={isLoadingSuppliers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <Wrench className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <SelectValue placeholder={isLoadingSuppliers ? "Loading..." : "Select supplier"} className="pl-10" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_SUPPLIER_SELECTED_VALUE}>None</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
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
                        <Textarea placeholder="Any additional details about the expense..." {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || isLoadingSuppliers || isLoadingCategories}>
                {(isSubmitting || isLoadingSuppliers || isLoadingCategories) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Logging...' : (isLoadingSuppliers || isLoadingCategories ? 'Loading...' : 'Log Expense')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
