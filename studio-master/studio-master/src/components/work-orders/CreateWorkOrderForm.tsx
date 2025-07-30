

"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { WorkOrderPriority, type Supplier, UserRole } from '@/types';
import { createWorkOrder, type CreateWorkOrderData, getSuppliers } from '@/lib/firebase/firestore';
import { Loader2, Wrench, Banknote } from 'lucide-react'; // Changed Briefcase to Wrench
import { capitalizeFirstLetter } from '@/lib/utils';

const NO_SUPPLIER_SELECTED_VALUE = "__NO_SUPPLIER__"; 

const formSchema = z.object({
  title: z.string().min(5, { message: "Title is required and must be at least 5 characters." }).max(100, { message: "Title must be at most 100 characters." }),
  description: z.string().min(10, { message: "Description is required and must be at least 10 characters." }).max(1000, { message: "Description must be at most 1000 characters." }),
  priority: z.nativeEnum(WorkOrderPriority, { required_error: "Priority is required." }),
  supplierId: z.string().optional(),
  cost: z.coerce.number().min(0, "Cost must be non-negative.").optional().nullable(),
  flatId: z.string().optional(), 
});

type CreateWorkOrderFormValues = z.infer<typeof formSchema>;

export function CreateWorkOrderForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = React.useState(false);

  const form = useForm<CreateWorkOrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: WorkOrderPriority.MEDIUM,
      supplierId: NO_SUPPLIER_SELECTED_VALUE, 
      cost: null,
      flatId: user?.flatId || '', 
    },
  });

  React.useEffect(() => {
    if (user?.flatId) {
      form.setValue('flatId', user.flatId);
    } else if (user && user.role === UserRole.MANAGER) {
      form.setValue('flatId', ''); 
    }
  }, [user, form]);


  React.useEffect(() => {
    const fetchSuppliersList = async () => {
      setIsLoadingSuppliers(true);
      try {
        const fetchedSuppliers = await getSuppliers();
        setSuppliers(fetchedSuppliers);
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
        toast({
          title: 'Error Fetching Suppliers',
          description: 'Could not load suppliers for selection.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingSuppliers(false);
      }
    };
    fetchSuppliersList();
  }, [toast]);

  const handleFormSubmit = async (values: CreateWorkOrderFormValues) => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to create a ticket.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      let actualSupplierId: string | undefined = undefined;
      let actualSupplierName: string | undefined = undefined;

      if (values.supplierId && values.supplierId !== NO_SUPPLIER_SELECTED_VALUE && values.supplierId !== '') {
        actualSupplierId = values.supplierId;
        const selectedSupplier = suppliers.find(s => s.id === values.supplierId);
        actualSupplierName = selectedSupplier?.name;
      }
      
      const workOrderData: CreateWorkOrderData = {
        title: capitalizeFirstLetter(values.title),
        description: values.description, 
        priority: values.priority,
        supplierId: actualSupplierId,
        supplierName: actualSupplierName,
        cost: values.cost ?? undefined, 
        flatId: values.flatId || (user.role === UserRole.RESIDENT ? user.flatId : undefined),
      };
      await createWorkOrder(workOrderData, user.uid, user.email || 'Unknown User');
      toast({
        title: 'Ticket Created',
        description: 'Your ticket has been successfully submitted.',
      });
      router.push('/work-orders'); 
    } catch (error: any) {
      toast({
        title: 'Error Creating Ticket',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlurCapitalize = (fieldName: keyof CreateWorkOrderFormValues) => (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      form.setValue(fieldName, capitalizeFirstLetter(value), { shouldValidate: true });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title<span className="text-destructive ml-1">*</span></FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Leaky Tap in Kitchen" 
                  {...field} 
                  onBlur={handleBlurCapitalize('title')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description<span className="text-destructive ml-1">*</span></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide a detailed description of the issue."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority<span className="text-destructive ml-1">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(WorkOrderPriority).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
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
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  Assign Supplier
                </FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || NO_SUPPLIER_SELECTED_VALUE} 
                  disabled={isLoadingSuppliers}
                >
                  <FormControl>
                    <SelectTrigger>
                       <Wrench className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <SelectValue placeholder={isLoadingSuppliers ? "Loading suppliers..." : "Select a supplier"} className="pl-10"/>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NO_SUPPLIER_SELECTED_VALUE}>None</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
         <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                    Estimated Cost (£)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="e.g., 150.00" 
                      {...field}
                      value={field.value === null ? '' : field.value} 
                      onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} 
                      step="0.01"
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading || isLoadingSuppliers}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isLoadingSuppliers}
              className="w-full sm:w-auto"
            >
              {isLoading || isLoadingSuppliers ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
              {isLoading ? 'Submitting...' : 'Submit Ticket'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
