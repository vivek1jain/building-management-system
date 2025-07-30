
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, getYear, setYear } from 'date-fns';
import { Loader2, Save, XCircle, CalendarIcon as CalendarLucideIcon, Percent } from 'lucide-react';
import type { GlobalFinancialSettings } from '@/types';


const financialSettingsSchema = z.object({
  serviceChargeRatePerSqFt: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .positive({ message: "Rate must be a positive number." })
    .nullable(),
  paymentDueLeadDays: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .int({ message: "Lead days must be a whole number." })
    .min(0, { message: "Lead days must be non-negative." })
    .nullable(),
  financialYearStartDate: z.date({
    required_error: "Financial year start date is required.",
    invalid_type_error: "That's not a valid date!",
  }).nullable(),
});


type FinancialSettingsFormValues = z.infer<typeof financialSettingsSchema>;

interface FinancialSettingsFormProps {
  initialSettings: GlobalFinancialSettings;
  onSave: (settings: GlobalFinancialSettings) => void;
  isLoading?: boolean;
}

export function FinancialSettingsForm({ initialSettings, onSave, isLoading: isFormLoading }: FinancialSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FinancialSettingsFormValues>({
    resolver: zodResolver(financialSettingsSchema),
    defaultValues: {
      serviceChargeRatePerSqFt: initialSettings.serviceChargeRatePerSqFt,
      paymentDueLeadDays: initialSettings.paymentDueLeadDays,
      financialYearStartDate: initialSettings.financialYearStartDate,
    },
  });

  React.useEffect(() => {
    form.reset({
      serviceChargeRatePerSqFt: initialSettings.serviceChargeRatePerSqFt,
      paymentDueLeadDays: initialSettings.paymentDueLeadDays,
      financialYearStartDate: initialSettings.financialYearStartDate,
    });
  }, [initialSettings, form]);

  const onSubmit: SubmitHandler<FinancialSettingsFormValues> = (data) => {
    setIsSubmitting(true);
    let dateToSave = data.financialYearStartDate;
    if (dateToSave) {
        dateToSave = setYear(dateToSave, 2000);
    }
    onSave({
        serviceChargeRatePerSqFt: data.serviceChargeRatePerSqFt,
        paymentDueLeadDays: data.paymentDueLeadDays,
        financialYearStartDate: dateToSave,
    });
    setTimeout(() => setIsSubmitting(false), 700);
  };

  const handleCancel = () => {
    form.reset({
        serviceChargeRatePerSqFt: initialSettings.serviceChargeRatePerSqFt,
        paymentDueLeadDays: initialSettings.paymentDueLeadDays,
        financialYearStartDate: initialSettings.financialYearStartDate,
    });
  };
  
  const todayForPicker = new Date();
  const defaultMonthForPicker = initialSettings.financialYearStartDate ? initialSettings.financialYearStartDate : new Date(getYear(todayForPicker), 3, 1);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="serviceChargeRatePerSqFt"
          render={({ field }) => (
            <FormItem className="grid grid-cols-5 items-center gap-x-4">
              <FormLabel className="col-span-3 text-sm text-left sm:text-right">Rate (£/sq. ft.)<span className="text-destructive ml-1">*</span></FormLabel>
              <div className="col-span-2 space-y-1">
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    value={field.value === null ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                    disabled={isSubmitting || isFormLoading}
                    className="h-9" 
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="paymentDueLeadDays"
          render={({ field }) => (
            <FormItem className="grid grid-cols-5 items-center gap-x-4">
              <FormLabel className="col-span-3 text-sm text-left sm:text-right">Due Lead Days<span className="text-destructive ml-1">*</span></FormLabel>
              <div className="col-span-2 space-y-1">
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value === null ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    disabled={isSubmitting || isFormLoading}
                    className="h-9"
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="financialYearStartDate"
            render={({ field }) => (
                <FormItem className="grid grid-cols-5 items-center gap-x-4">
                <FormLabel className="col-span-3 text-sm text-left sm:text-right">FY Start (Month & Day)<span className="text-destructive ml-1">*</span></FormLabel>
                <div className="col-span-2 space-y-1">
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal h-9", !field.value && "text-muted-foreground")}
                            disabled={isSubmitting || isFormLoading}
                            >
                            <CalendarLucideIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "MMMM d") : <span>Pick month & day</span>}
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={isSubmitting || isFormLoading}
                            initialFocus
                            defaultMonth={defaultMonthForPicker}
                            captionLayout="dropdown-buttons"
                            fromYear={getYear(todayForPicker)} 
                            toYear={getYear(todayForPicker)} 
                            />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </div>
                </FormItem>
            )}
        />
        <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting || isFormLoading}>
                <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isFormLoading || !form.formState.isDirty}>
                {isSubmitting || isFormLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
