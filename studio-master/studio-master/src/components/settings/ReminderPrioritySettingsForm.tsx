
"use client";

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, XCircle } from 'lucide-react';
import { type GlobalFinancialSettings, ReminderType, ReminderPriority } from '@/types';
import { DEFAULT_REMINDER_PRIORITIES } from '@/lib/firebase/firestore';


type ReminderPrioritySettingsFormValues = {
    reminderPrioritySettings: { [key in ReminderType]?: ReminderPriority };
};

interface ReminderPrioritySettingsFormProps {
  initialSettings: GlobalFinancialSettings;
  onSave: (settings: GlobalFinancialSettings) => void;
  isLoading?: boolean;
}

export function ReminderPrioritySettingsForm({ initialSettings, onSave, isLoading: isFormLoading }: ReminderPrioritySettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ReminderPrioritySettingsFormValues>({
    defaultValues: {
      reminderPrioritySettings: {
        ...DEFAULT_REMINDER_PRIORITIES,
        ...initialSettings.reminderPrioritySettings,
      },
    },
  });

  React.useEffect(() => {
    form.reset({
      reminderPrioritySettings: {
        ...DEFAULT_REMINDER_PRIORITIES,
        ...initialSettings.reminderPrioritySettings,
      },
    });
  }, [initialSettings, form]);

  const onSubmit: SubmitHandler<ReminderPrioritySettingsFormValues> = (data) => {
    setIsSubmitting(true);
    onSave({
        ...initialSettings,
        reminderPrioritySettings: data.reminderPrioritySettings,
    });
    setTimeout(() => setIsSubmitting(false), 700);
  };
  
  const handleCancel = () => {
    form.reset({
      reminderPrioritySettings: {
        ...DEFAULT_REMINDER_PRIORITIES,
        ...initialSettings.reminderPrioritySettings,
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {Object.values(ReminderType).map((reminderType) => (
          <FormField
            key={reminderType}
            control={form.control}
            name={`reminderPrioritySettings.${reminderType}`}
            render={({ field }) => (
                <FormItem className="grid grid-cols-5 items-center gap-x-4">
                    <FormLabel className="col-span-3 text-sm text-left sm:text-right">{reminderType}</FormLabel>
                    <div className="col-span-2 space-y-1">
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting || isFormLoading}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(ReminderPriority).map((priority) => (
                                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
              </FormItem>
            )}
          />
        ))}

        <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting || isFormLoading || !form.formState.isDirty}>
                <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isFormLoading || !form.formState.isDirty}>
                {isSubmitting || isFormLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Saving..." : "Save Priorities"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
