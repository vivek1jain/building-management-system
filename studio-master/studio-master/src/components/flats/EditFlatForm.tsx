

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
import { updateFlat, type UpdateFlatData } from '@/lib/firebase/firestore';
import type { Flat } from '@/types';
import { Loader2, Building, Hash, FileText, BedDouble, Bath, Square, LandPlot } from 'lucide-react';
import { capitalizeFirstLetter, cn } from '@/lib/utils';

const flatFormSchema = z.object({
  flatNumber: z.string().min(1, { message: "Flat/Unit number is required." }).max(20),
  floor: z.coerce.number().int().optional().nullable(),
  buildingBlock: z.string().max(50).optional().or(z.literal('')), // Renamed from 'building'
  bedrooms: z.coerce.number().int().min(0).optional().nullable(),
  bathrooms: z.coerce.number().int().min(0).optional().nullable(),
  areaSqFt: z.coerce.number().int().min(0, {message: "Area must be a positive number."}).optional().nullable(),
  groundRent: z.coerce.number().min(0, { message: "Ground rent must be a positive number." }).optional().nullable(),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

type EditFlatFormValues = z.infer<typeof flatFormSchema>;

interface EditFlatFormProps {
  flat: Flat;
}

export function EditFlatForm({ flat }: EditFlatFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<EditFlatFormValues>({
    resolver: zodResolver(flatFormSchema),
    defaultValues: {
      flatNumber: flat.flatNumber || '',
      floor: flat.floor ?? null,
      buildingBlock: flat.buildingBlock || '', // Renamed
      bedrooms: flat.bedrooms ?? null,
      bathrooms: flat.bathrooms ?? null,
      areaSqFt: flat.areaSqFt ?? null,
      groundRent: flat.groundRent ?? null,
      notes: flat.notes || '',
    },
  });

  const handleFormSubmit = async (values: EditFlatFormValues) => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to update a flat/unit.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const flatData: UpdateFlatData = {
        flatNumber: values.flatNumber,
        floor: values.floor === null ? undefined : values.floor,
        buildingBlock: values.buildingBlock ? capitalizeFirstLetter(values.buildingBlock) : undefined, // Renamed
        bedrooms: values.bedrooms === null ? undefined : values.bedrooms,
        bathrooms: values.bathrooms === null ? undefined : values.bathrooms,
        areaSqFt: values.areaSqFt === null ? undefined : values.areaSqFt,
        groundRent: values.groundRent === null ? undefined : values.groundRent,
        notes: values.notes || undefined,
      };
      // updateFlat no longer takes buildingId
      await updateFlat(flat.id, flatData);
      toast({
        title: 'Flat/Unit Updated',
        description: `Flat/Unit ${flatData.flatNumber} has been successfully updated.`,
      });
      router.push('/building?tab=flats');
    } catch (error: any) {
      toast({
        title: 'Error Updating Flat/Unit',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlurCapitalize = (fieldName: keyof EditFlatFormValues) => (event: React.FocusEvent<HTMLInputElement>) => {
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
                      {...field}
                      value={field.value ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        field.onChange(val === '' ? null : parseInt(val, 10));
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
                      {...field}
                      value={field.value ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        field.onChange(val === '' ? null : parseInt(val, 10));
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
                          {...field}
                          value={field.value ?? ''}
                           onChange={e => {
                            const val = e.target.value;
                            field.onChange(val === '' ? null : parseInt(val, 10));
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
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => {
                            const val = e.target.value;
                            field.onChange(val === '' ? null : parseInt(val, 10));
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
                      {...field}
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
          {isLoading ? 'Saving Changes...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  );
}
    

    
