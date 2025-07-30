
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Wrench, Archive } from 'lucide-react'; // Changed Briefcase to Wrench
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { createScheduledEvent, updateScheduledEvent, getSuppliers, getAssets, type CreateScheduledEventData, type UpdateScheduledEventData } from '@/lib/firebase/firestore';
import type { ScheduledEvent, Supplier, Asset } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NO_SUPPLIER_SELECTED_VALUE = "__NO_SUPPLIER__";
const NO_ASSET_SELECTED_VALUE = "__NO_ASSET__";

const combineDateAndTime = (date: Date, time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

const eventFormSchema = z.object({
  title: z.string().min(3, { message: "Title is required and must be at least 3 characters." }).max(100),
  startDate: z.date({ required_error: "Start date is required." }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Valid start time (HH:MM) is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Valid end time (HH:MM) is required." }),
  allDay: z.boolean().default(false),
  supplierId: z.string().optional(),
  assetId: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => {
  const startDateTime = combineDateAndTime(data.startDate, data.startTime);
  const endDateTime = combineDateAndTime(data.endDate, data.endTime);
  return endDateTime >= startDateTime;
}, {
  message: "End date/time must be after start date/time.",
  path: ["endDate"],
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface AddEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  eventToEdit?: ScheduledEvent | null;
  onEventModified?: () => void;
}

export function AddEventDialog({
    isOpen,
    onOpenChange,
    defaultDate,
    eventToEdit,
    onEventModified
}: AddEventDialogProps) {
  const { toast } = useToast();
  const { user, activeBuildingId } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = React.useState(false);
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = React.useState(false);

  const prevIsOpenRef = React.useRef(isOpen);
  const prevEventToEditIdRef = React.useRef(eventToEdit?.id);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
        title: '',
        startDate: new Date(),
        startTime: "09:00",
        endDate: new Date(),
        endTime: "10:00",
        allDay: false,
        supplierId: NO_SUPPLIER_SELECTED_VALUE,
        assetId: NO_ASSET_SELECTED_VALUE,
        notes: '',
      },
  });

  const startDateValue = form.watch('startDate');
  const startTimeValue = form.watch('startTime');

  React.useEffect(() => {
    if (startDateValue && startTimeValue) {
      const currentEndDate = form.getValues('endDate');
      const currentEndTime = form.getValues('endTime');

      if (!currentEndDate || !currentEndTime) return;

      const startDateTime = combineDateAndTime(startDateValue, startTimeValue);
      const endDateTime = combineDateAndTime(currentEndDate, currentEndTime);

      if (startDateTime > endDateTime) {
        form.setValue('endDate', startDateValue, { shouldValidate: true });
        form.setValue('endTime', startTimeValue, { shouldValidate: true });
      }
    }
  }, [startDateValue, startTimeValue, form]);

  const fetchDialogData = React.useCallback(async (buildingId: string) => {
    setIsLoadingSuppliers(true);
    setIsLoadingAssets(true);
    try {
      const [fetchedSuppliers, fetchedAssets] = await Promise.all([
        getSuppliers(buildingId),
        getAssets(buildingId) 
      ]);
      setSuppliers(fetchedSuppliers);
      setAssets(fetchedAssets);
    } catch (error) {
      console.error("Error fetching suppliers or assets for event dialog:", error);
      toast({ title: "Error", description: "Could not load suppliers or assets list.", variant: "destructive" });
    } finally {
      setIsLoadingSuppliers(false);
      setIsLoadingAssets(false);
    }
  }, [toast]);

  React.useEffect(() => {
    const eventToEditChanged = eventToEdit?.id !== prevEventToEditIdRef.current;
    const justOpened = isOpen && !prevIsOpenRef.current;

    if (justOpened || (isOpen && eventToEditChanged)) {
      if (activeBuildingId) {
        fetchDialogData(activeBuildingId);
      }

      if (eventToEdit) {
        const start = eventToEdit.start instanceof Date ? eventToEdit.start : (eventToEdit.start as any).toDate();
        const end = eventToEdit.end instanceof Date ? eventToEdit.end : (eventToEdit.end as any).toDate();

        form.reset({
          title: eventToEdit.title || '',
          startDate: start,
          startTime: format(start, "HH:mm"),
          endDate: end,
          endTime: format(end, "HH:mm"),
          allDay: eventToEdit.allDay || false,
          supplierId: eventToEdit.supplierId || NO_SUPPLIER_SELECTED_VALUE,
          assetId: eventToEdit.assetId || NO_ASSET_SELECTED_VALUE,
          notes: eventToEdit.notes || '',
        });
      } else {
        const baseDateForForm = defaultDate ? new Date(defaultDate) : new Date();
        const initialStartTime = new Date(baseDateForForm);
        initialStartTime.setHours(9, 0, 0, 0); 
        const initialEndTime = new Date(initialStartTime.getTime() + 60 * 60 * 1000); 

        form.reset({
          title: '',
          startDate: baseDateForForm,
          startTime: format(initialStartTime, "HH:mm"),
          endDate: baseDateForForm,
          endTime: format(initialEndTime, "HH:mm"),
          allDay: false,
          supplierId: NO_SUPPLIER_SELECTED_VALUE,
          assetId: NO_ASSET_SELECTED_VALUE,
          notes: '',
        });
      }
    }
    prevIsOpenRef.current = isOpen;
    prevEventToEditIdRef.current = eventToEdit?.id;
  }, [isOpen, defaultDate, eventToEdit, form, toast, fetchDialogData, activeBuildingId]);


  const handleFormSubmit = async (values: EventFormValues) => {
    if (!user || !activeBuildingId) {
      toast({ title: 'Authentication Error', description: 'Please log in.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    const startDateTime = combineDateAndTime(values.startDate, values.startTime);
    const endDateTime = combineDateAndTime(values.endDate, values.endTime);

    const selectedSupplier = values.supplierId && values.supplierId !== NO_SUPPLIER_SELECTED_VALUE
      ? suppliers.find(s => s.id === values.supplierId)
      : null;

    const selectedAsset = values.assetId && values.assetId !== NO_ASSET_SELECTED_VALUE
      ? assets.find(a => a.id === values.assetId)
      : null;

    const eventDataPayload: Omit<CreateScheduledEventData, 'buildingId'> & { buildingId?: string } = {
      title: values.title,
      start: startDateTime,
      end: endDateTime,
      allDay: values.allDay,
      supplierId: selectedSupplier ? selectedSupplier.id : null,
      contractorName: selectedSupplier ? selectedSupplier.name : null,
      assetId: selectedAsset ? selectedAsset.id : null,
      assetName: selectedAsset ? selectedAsset.name : null,
      notes: values.notes,
    };

    try {
      if (eventToEdit && eventToEdit.id) {
        await updateScheduledEvent(eventToEdit.id, eventDataPayload as UpdateScheduledEventData, user.uid);
        toast({ title: 'Event Updated', description: 'The event has been successfully updated.' });
      } else {
        if (!activeBuildingId) throw new Error("No active building selected.");
        await createScheduledEvent({ ...eventDataPayload, buildingId: activeBuildingId }, user.uid);
        toast({ title: 'Event Scheduled', description: 'The event has been added to the calendar.' });
      }
      onOpenChange(false);
      onEventModified?.();
    } catch (error: any) {
      toast({ title: eventToEdit ? 'Error Updating Event' : 'Error Scheduling Event', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const dialogTitle = eventToEdit ? "Edit Event" : "Schedule New Event";
  const dialogDescription = "Fields marked with an asterisk (*) are required.";
  const submitButtonText = eventToEdit ? "Save Changes" : "Schedule Event";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title<span className="text-destructive ml-1">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Boiler Service Flat 5B" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date<span className="text-destructive ml-1">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={isLoading}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time<span className="text-destructive ml-1">*</span></FormLabel>
                    <FormControl>
                      <Input type="time" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date<span className="text-destructive ml-1">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            isLoading || (form.getValues("startDate") && date < form.getValues("startDate"))
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time<span className="text-destructive ml-1">*</span></FormLabel>
                    <FormControl>
                      <Input type="time" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contractor/Supplier</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || NO_SUPPLIER_SELECTED_VALUE}
                    disabled={isLoadingSuppliers || isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <Wrench className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <SelectValue
                          placeholder={isLoadingSuppliers ? "Loading..." : "None / Select supplier"}
                          className="pl-10"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_SUPPLIER_SELECTED_VALUE}>
                        {isLoadingSuppliers ? "Loading suppliers..." : "None"}
                      </SelectItem>
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
             <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Asset</FormLabel>
                   <Select
                    onValueChange={field.onChange}
                    value={field.value || NO_ASSET_SELECTED_VALUE}
                    disabled={isLoadingAssets || isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <Archive className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <SelectValue
                          placeholder={isLoadingAssets ? "Loading assets..." : "None / Select asset"}
                          className="pl-10"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_ASSET_SELECTED_VALUE}>
                         {isLoadingAssets ? "Loading assets..." : "None"}
                      </SelectItem>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name} {asset.locationDescription ? `(${asset.locationDescription})` : ''}
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
                    <Textarea placeholder="Any specific instructions or details..." {...field} value={field.value || ''} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading || isLoadingSuppliers || isLoadingAssets}>
                {(isLoading || isLoadingSuppliers || isLoadingAssets) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoadingSuppliers || isLoadingAssets ? "Loading..." : submitButtonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
