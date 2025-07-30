

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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { createSupplier, type CreateSupplierData } from '@/lib/firebase/firestore';
import { Loader2, Wrench, User, Mail, Phone } from 'lucide-react'; // Changed Briefcase to Wrench
import { capitalizeWords, capitalizeFirstLetter, formatPhoneNumber } from '@/lib/utils';

const phoneRegex = /^[+\d()-\s]*$/;
const phoneErrorMessage = "Phone number can only contain digits, spaces, and +()-.";

const addSupplierSchema = z.object({
  name: z.string().min(2, { message: "Supplier name is required and must be at least 2 characters." }).max(100),
  contactName: z.string().max(100).optional().or(z.literal('')),
  contactEmail: z.string().email({ message: "Invalid email address." }).max(100).optional().or(z.literal('')),
  contactPhone: z.string().max(25).regex(phoneRegex, {message: phoneErrorMessage}).optional().or(z.literal(''))
  .transform(val => val ? val.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '') : ''),
  specialty: z.string().max(100).optional().or(z.literal('')),
});

type AddSupplierFormValues = z.infer<typeof addSupplierSchema>;

interface AddSupplierDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSupplierAdded: (newSupplierId: string) => void;
}

export function AddSupplierDialog({ isOpen, onOpenChange, onSupplierAdded }: AddSupplierDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreatingSupplier, setIsCreatingSupplier] = React.useState(false);

  const form = useForm<AddSupplierFormValues>({
    resolver: zodResolver(addSupplierSchema),
    defaultValues: {
      name: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      specialty: '',
    },
  });

  React.useEffect(() => {
    if (!isOpen) {
      form.reset(); 
    }
  }, [isOpen, form]);

  const handleCreateSupplier = async (values: AddSupplierFormValues) => {
    if (!user || !user.buildingId) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to a building to add suppliers.',
        variant: 'destructive',
      });
      return;
    }
    setIsCreatingSupplier(true);
    try {
      const supplierData: CreateSupplierData = {
        name: capitalizeWords(values.name),
        contactName: values.contactName ? capitalizeWords(values.contactName) : undefined,
        contactEmail: values.contactEmail || undefined,
        contactPhone: values.contactPhone || undefined,
        specialties: values.specialty ? [capitalizeFirstLetter(values.specialty)] : [],
      };
      const newSupplierId = await createSupplier(user.buildingId, supplierData);
      toast({ title: "Supplier Added", description: `${supplierData.name} has been added.` });
      onSupplierAdded(newSupplierId); 
      onOpenChange(false); 
    } catch (error: any) {
      toast({
        title: 'Error Adding Supplier',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingSupplier(false);
    }
  };

  const handleBlurCapitalizeWords = (fieldName: 'name' | 'contactName') => (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      form.setValue(fieldName, capitalizeWords(value), { shouldValidate: true });
    }
  };
  
  const handleBlurCapitalizeFirstLetter = (fieldName: 'specialty') => (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      form.setValue(fieldName, capitalizeFirstLetter(value), { shouldValidate: true });
    }
  };

  const handleBlurFormatPhone = (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      form.setValue('contactPhone', formatPhoneNumber(value), { shouldValidate: true });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
          <DialogDescription>
            Fill in the supplier details. Fields marked with an asterisk (<span className="text-destructive">*</span>) are required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateSupplier)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Name<span className="text-destructive ml-1">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Wrench className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="e.g., ACME Plumbing Ltd." 
                        {...field} 
                        onBlur={handleBlurCapitalizeWords('name')}
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
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="John Smith" 
                        {...field} 
                        onBlur={handleBlurCapitalizeWords('contactName')}
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
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="email" placeholder="contact@example.co.uk" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="e.g., 01234 567890" 
                        {...field} 
                        onBlur={handleBlurFormatPhone}
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
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialty</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Plumbing, Electrical, Heating" 
                      {...field} 
                      onBlur={handleBlurCapitalizeFirstLetter('specialty')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isCreatingSupplier}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isCreatingSupplier}>
                {isCreatingSupplier && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Supplier
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
