

"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, capitalizeWords, formatPhoneNumber, splitName } from '@/lib/utils'; 
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { updatePerson, getFlats, type UpdatePersonData } from '@/lib/firebase/firestore';
import { PersonStatus, UserRole, type Flat, type Person } from '@/types';
import { Loader2, User, Mail, Phone, Home, CalendarIcon, Info, FileText, Link2, Lock } from 'lucide-react'; // Changed Building to Home
import type { Timestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase/config';

const phoneRegex = /^[+\d()-\s]*$/;
const phoneErrorMessage = "Phone number can only contain digits, spaces, and +()-.";

const NO_FLAT_SELECTED_VALUE = "__NO_FLAT__";

const personFormSchema = z.object({
  name: z.string().min(2, { message: "Name is required and must be at least 2 characters." }).max(100), 
  flatId: z.string().nullable().optional(),
  status: z.nativeEnum(PersonStatus, { required_error: "Status is required."}),
  email: z.string().email({ message: "Invalid email address." }).max(100).optional().or(z.literal('')),
  phone: z.string().max(25, { message: "Phone number is too long." })
    .regex(phoneRegex, { message: phoneErrorMessage })
    .optional().or(z.literal(''))
    .transform(val => val ? val.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '') : ''),
  isPrimaryContact: z.boolean().default(false).optional(),
  moveInDate: z.date().optional().nullable(),
  moveOutDate: z.date().optional().nullable(),
  notes: z.string().max(1000).optional().or(z.literal('')),
  uid: z.string().max(128).optional().nullable(),
}).refine(
  (data) => {
    if (data.moveInDate && data.moveOutDate) {
      return data.moveOutDate >= data.moveInDate;
    }
    return true;
  },
  {
    message: "Move-out date cannot be earlier than move-in date.",
    path: ["moveOutDate"],
  }
);

type EditPersonFormValues = z.infer<typeof personFormSchema>;

interface EditPersonFormProps {
  person: Person;
}

const toDateOrNull = (timestamp: Timestamp | Date | null | undefined): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
};

export function EditPersonForm({ person }: EditPersonFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user: editorUser, refreshAuthContextUser } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [flats, setFlats] = React.useState<Flat[]>([]);
  const [isLoadingFlats, setIsLoadingFlats] = React.useState(true);

  const form = useForm<EditPersonFormValues>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      name: person.name || '', 
      flatId: person.flatId || NO_FLAT_SELECTED_VALUE,
      status: person.status || PersonStatus.RESIDENT,
      email: person.email || '',
      phone: person.phone ? formatPhoneNumber(person.phone) : '',
      isPrimaryContact: person.isPrimaryContact || false,
      moveInDate: toDateOrNull(person.moveInDate),
      moveOutDate: toDateOrNull(person.moveOutDate),
      notes: person.notes || '',
      uid: person.uid || null,
    },
  });

  const moveInDateValue = form.watch('moveInDate');

  React.useEffect(() => {
    if (moveInDateValue) {
      const currentMoveOutDate = form.getValues('moveOutDate');
      if (currentMoveOutDate && currentMoveOutDate < moveInDateValue) {
        form.setValue('moveOutDate', moveInDateValue, { shouldValidate: true });
      }
    }
  }, [moveInDateValue, form]);


  React.useEffect(() => {
    const fetchFlatsList = async () => {
      setIsLoadingFlats(true);
      try {
        const fetchedFlats = await getFlats();
        setFlats(fetchedFlats);
      } catch (error) {
        console.error("Failed to fetch flats:", error);
        toast({
          title: 'Error Fetching Flats',
          description: 'Could not load flats for selection. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingFlats(false);
      }
    };
    fetchFlatsList();
  }, [toast]);

  const handleFormSubmit = async (values: EditPersonFormValues) => {
    if (!editorUser) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to update a person.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const finalFlatId = values.flatId === NO_FLAT_SELECTED_VALUE ? null : values.flatId;
      const newFullName = capitalizeWords(values.name); 

      const personDataToUpdate: UpdatePersonData = {
        name: newFullName, 
        flatId: finalFlatId,
        status: values.status,
        email: values.email || undefined,
        phone: values.phone || undefined,
        isPrimaryContact: values.isPrimaryContact,
        moveInDate: values.moveInDate || null,
        moveOutDate: values.moveOutDate || null,
        notes: values.notes || undefined,
      };

      await updatePerson(person.id, editorUser.uid, personDataToUpdate);
      
      if (editorUser.uid === person.uid) { 
        await refreshAuthContextUser();
      }

      toast({
        title: 'Person Updated',
        description: `${newFullName} has been successfully updated.`,
      });
      router.push('/building?tab=people');
    } catch (error: any) {
      toast({
        title: 'Error Updating Person',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlurCapitalizeWords = (fieldName: 'name') => (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      form.setValue(fieldName, capitalizeWords(value), { shouldValidate: true });
    }
  };

  const handleBlurFormatPhone = (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      form.setValue('phone', formatPhoneNumber(value), { shouldValidate: true });
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
              <FormLabel>Full Name<span className="text-destructive ml-1">*</span></FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="e.g., Jane Smith"
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
            name="flatId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Flat/Unit</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value === null || field.value === undefined ? NO_FLAT_SELECTED_VALUE : field.value}
                  disabled={isLoadingFlats}
                >
                  <FormControl>
                    <SelectTrigger>
                      <Home className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <SelectValue
                        placeholder={isLoadingFlats ? "Loading flats..." : "Select flat/unit"}
                        className="pl-10"
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                     <SelectItem value={NO_FLAT_SELECTED_VALUE}>None</SelectItem>
                    {isLoadingFlats ? (
                      <SelectItem value="loading_flats_disabled" disabled>Loading flats...</SelectItem>
                    ) : flats.length === 0 ? (
                      <SelectItem value="no_flats_available_disabled" disabled>
                        No flats available.
                      </SelectItem>
                    ) : (
                      flats.map((flat) => (
                        <SelectItem key={flat.id} value={flat.id}>
                          {flat.flatNumber} {flat.buildingBlock ? `(${flat.buildingBlock})` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status<span className="text-destructive ml-1">*</span></FormLabel>
                 <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                       <Info className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                       <SelectValue placeholder="Select status" className="pl-10"/>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(PersonStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="email" placeholder="person@example.co.uk" {...field} className="pl-10" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="e.g., 07700 900000"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="moveInDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Move-in Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="moveOutDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Move-out Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) =>
                            form.getValues("moveInDate") && date < form.getValues("moveInDate")!
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <FormField
          control={form.control}
          name="isPrimaryContact"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Set as primary contact for the flat/unit?
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="uid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Linked App User ID</FormLabel>
              <FormControl>
                <div className="relative">
                  {person.uid ? (
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  ) : (
                     <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  )}
                  <Input
                    placeholder={person.uid ? "" : "No app account linked"}
                    {...field}
                    value={field.value ?? ''}
                    className="pl-10"
                    readOnly
                    disabled
                  />
                </div>
              </FormControl>
              {person.uid ? (
                 <FormDescription>
                  This person is linked to an app account (ID: {person.uid}). This link is permanent.
                </FormDescription>
              ) : (
                <FormDescription>
                  This person does not have a linked app account. An account must be created via the Signup page.
                </FormDescription>
              )}
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
                  <Textarea placeholder="Any additional details about this person..." {...field} className="pl-10" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isLoadingFlats}
        >
          {isLoading || isLoadingFlats ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
          {isLoading ? 'Saving Changes...' : (isLoadingFlats ? 'Loading Data...' : 'Save Changes')}
        </Button>
      </form>
    </Form>
  );
}
    
