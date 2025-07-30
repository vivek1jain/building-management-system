
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Building as BuildingIcon, MapPin, Pencil, Save, XCircle } from 'lucide-react';
import type { Building, CreateBuildingData } from '@/types';
import { capitalizeWords } from '@/lib/utils';


const buildingFormSchema = z.object({
  name: z.string().min(3, { message: "Building name must be at least 3 characters." }).max(100),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }).max(255),
});

type BuildingFormValues = z.infer<typeof buildingFormSchema>;

interface BuildingSettingsFormProps {
  building: Building | null;
  isLoading: boolean;
  onSave: (data: BuildingFormValues) => Promise<void>;
  onCancel: () => void;
}

export function BuildingSettingsForm({ building, isLoading, onSave, onCancel }: BuildingSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: {
      name: building?.name || '',
      address: building?.address || '',
    },
  });

  React.useEffect(() => {
    form.reset({
      name: building?.name || '',
      address: building?.address || '',
    });
  }, [building, form]);

  const onSubmit: SubmitHandler<BuildingFormValues> = async (data) => {
    setIsSubmitting(true);
    await onSave(data);
    setIsSubmitting(false);
  };

  const handleBlurCapitalize = (fieldName: 'name') => (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      form.setValue(fieldName, capitalizeWords(value), { shouldValidate: true });
    }
  };


  if (isLoading) {
    return (
        <div className="space-y-4 pt-4">
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="flex justify-end"><Skeleton className="h-10 w-24" /></div>
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Building Name<span className="text-destructive ml-1">*</span></FormLabel>
              <FormControl>
                  <div className="relative">
                      <BuildingIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="e.g., The Grand Residences" {...field} onBlur={handleBlurCapitalize('name')} className="pl-10" />
                  </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address<span className="text-destructive ml-1">*</span></FormLabel>
              <FormControl>
                  <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="e.g., 123 Main Street, London" {...field} className="pl-10" />
                  </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
           <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {building ? 'Save Changes' : 'Create Building'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    