

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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createSupplier, type CreateSupplierData } from '@/lib/firebase/firestore';
import { Loader2, User, Mail, Phone, Briefcase, MapPin, FileText, X } from 'lucide-react';
import { capitalizeWords, capitalizeFirstLetter, formatPhoneNumber } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const phoneRegex = /^[+\d()-\s]*$/;
const phoneErrorMessage = "Phone number can only contain digits, spaces, and +()-.";

const supplierFormSchema = z.object({
  name: z.string().min(2, { message: "Supplier name is required and must be at least 2 characters." }).max(100),
  contactName: z.string().max(100).optional().or(z.literal('')),
  contactEmail: z.string().email({ message: "Invalid email address." }).max(100).optional().or(z.literal('')),
  contactPhone: z.string().max(25).regex(phoneRegex, {message: phoneErrorMessage}).optional().or(z.literal(''))
    .transform(val => val ? val.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '') : ''),
  specialties: z.array(z.string()).optional(),
  address: z.string().max(255).optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export function CreateSupplierForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [specialtyInput, setSpecialtyInput] = React.useState('');

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      specialties: [],
      address: '',
      notes: '',
    },
  });

  const handleFormSubmit = async (values: SupplierFormValues) => {
    if (!user || !user.buildingId) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in and associated with a building to add a supplier.',
        variant: 'destructive',
      });
      if(!user) router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const supplierData: CreateSupplierData = {
        name: capitalizeWords(values.name),
        contactName: values.contactName ? capitalizeWords(values.contactName) : undefined,
        contactEmail: values.contactEmail || undefined,
        contactPhone: values.contactPhone || undefined, 
        specialties: values.specialties,
        address: values.address ? capitalizeFirstLetter(values.address) : undefined,
        notes: values.notes || undefined,
      };
      await createSupplier(user.buildingId, supplierData);
      toast({
        title: 'Supplier Added',
        description: `${supplierData.name} has been successfully added.`,
      });
      router.push('/building?tab=suppliers'); 
    } catch (error: any) {
      toast({
        title: 'Error Adding Supplier',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpecialtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newSpecialty = specialtyInput.trim();
      if (newSpecialty) {
        const currentSpecialties = form.getValues('specialties') || [];
        if (!currentSpecialties.includes(newSpecialty)) {
          form.setValue('specialties', [...currentSpecialties, capitalizeFirstLetter(newSpecialty)]);
        }
        setSpecialtyInput('');
      }
    }
  };

  const removeSpecialty = (specialtyToRemove: string) => {
    const currentSpecialties = form.getValues('specialties') || [];
    form.setValue('specialties', currentSpecialties.filter(s => s !== specialtyToRemove));
  };


  const handleBlurCapitalizeWords = (fieldName: keyof SupplierFormValues) => (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      form.setValue(fieldName, capitalizeWords(value), { shouldValidate: true });
    }
  };

  const handleBlurCapitalizeFirstLetter = (fieldName: keyof SupplierFormValues) => (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Name<span className="text-destructive ml-1">*</span></FormLabel>
              <FormControl>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <FormItem>
            <FormLabel>Specialties</FormLabel>
            <FormControl>
              <Input 
                placeholder="e.g., Plumbing, Electrical" 
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
                onKeyDown={handleSpecialtyKeyDown}
              />
            </FormControl>
             <div className="pt-2 flex flex-wrap gap-2">
                {form.watch('specialties')?.map(spec => (
                  <Badge key={spec} variant="secondary">
                    {spec}
                    <button type="button" onClick={() => removeSpecialty(spec)} className="ml-2 rounded-full p-0.5 hover:bg-destructive/20 text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
            </div>
            <FormMessage />
          </FormItem>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea 
                    placeholder="e.g., 123 High Street, Anytown, County, AB1 2CD" 
                    {...field} 
                    onBlur={handleBlurCapitalizeFirstLetter('address')}
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea placeholder="Any additional details about the supplier..." {...field} className="pl-10" />
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
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
              {isLoading ? 'Adding Supplier...' : 'Add Supplier'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
    
