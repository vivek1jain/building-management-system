

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
import { createFlat, type CreateFlatData } from '@/lib/firebase/firestore';
import { Loader2, Building, Hash, FileText, BedDouble, Bath, Square, LandPlot } from 'lucide-react';
import { capitalizeFirstLetter, cn } from '@/lib/utils';

const flatFormSchema = z.object({
  flatNumber: z.string().min(1, { message: "Flat/Unit number is required." }).max(20),
  floor: z.coerce.number().int().optional(),
  buildingBlock: z.string().max(50).optional().or(z.literal('')), // Renamed from 'building'
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  areaSqFt: z.coerce.number().int().min(0, {message: "Area must be a positive number."}).optional(),
  groundRent: z.coerce.number().min(0, { message: "Ground rent must be a positive number." }).optional().nullable(),
  notes: z.string().max(1000).optional(),
});

type FlatFormValues = z.infer<typeof flatFormSchema>;

export function CreateFlatForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<FlatFormValues>({
    resolver: zodResolver(flatFormSchema),
    defaultValues: {
      flatNumber: '',
      floor: undefined,
      buildingBlock: '', // Renamed from 'building'
      bedrooms: undefined,
      bathrooms: undefined,
      areaSqFt: undefined,
      groundRent: null,
      notes: '',
    },
  });

  const handleFormSubmit = async (values: FlatFormValues) => {
    if (!user || !user.buildingId) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in and associated with a building to add a flat/unit.',
        variant: 'destructive',
      });
      if(!user) router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const flatData: CreateFlatData = {
        flatNumber: values.flatNumber, 
        floor: values.floor,
        buildingBlock: values.buildingBlock ? capitalizeFirstLetter(values.buildingBlock) : undefined, // Renamed
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        areaSqFt: values.areaSqFt,
        groundRent: values.groundRent,
        notes: values.notes || undefined,
      };
      
      await createFlat(user.buildingId, flatData);
      toast({
        title: 'Flat/Unit Added',
        description: `Flat/Unit ${flatData.flatNumber} has been successfully added.`,
      });
      router.push('/building?tab=flats');
    } catch (error: any) {
      toast({
        title: 'Error Adding Flat/Unit',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlurCapitalize = (fieldName: keyof FlatFormValues) => (event: React.FocusEvent<HTMLInputElement>) => {
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
          name="flatNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Flat/Unit Number<span className="text-destructive ml-1">*</span></FormLabel>
              <FormControl>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="e.g., 101, Flat 2B, Unit 5" {...field} className="pl-10" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="floor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Floor</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="e.g., 1"
                      name={field.name}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      value={field.value ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        field.onChange(val === '' ? undefined : parseInt(val, 10));
                      }}
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
            name="buildingBlock" // Renamed from 'building'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Building/Block Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Block A, Main Building" 
                    {...field} 
                    onBlur={handleBlurCapitalize('buildingBlock')} // Renamed
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="areaSqFt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area (sq ft)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Square className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="e.g., 750"
                      name={field.name}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      value={field.value ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        field.onChange(val === '' ? undefined : parseInt(val, 10));
                      }}
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bedrooms</FormLabel>
                <FormControl>
                    <div className="relative">
                        <BedDouble className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="e.g., 2"
                          name={field.name}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          value={field.value ?? ''}
                          onChange={e => {
                            const val = e.target.value;
                            field.onChange(val === '' ? undefined : parseInt(val, 10));
                          }}
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
            name="bathrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bathrooms</FormLabel>
                <FormControl>
                    <div className="relative">
                        <Bath className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="e.g., 1"
                          name={field.name}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          value={field.value ?? ''}
                          onChange={e => {
                            const val = e.target.value;
                            field.onChange(val === '' ? undefined : parseInt(val, 10));
                          }}
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
            name="groundRent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ground Rent (£)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <LandPlot className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 250.00"
                      name={field.name}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      value={field.value ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        field.onChange(val === '' ? null : parseFloat(val));
                      }}
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea placeholder="Any additional details about the flat/unit..." {...field} className="pl-10" />
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
              {isLoading ? 'Adding Flat/Unit...' : 'Add Flat/Unit'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
    

    
