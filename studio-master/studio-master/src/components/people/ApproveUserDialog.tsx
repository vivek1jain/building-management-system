
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, capitalizeWords, formatPhoneNumber } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getFlats } from '@/lib/firebase/firestore';
import { PersonStatus, UserRole, type Flat, type UserApprovalData, type UserProfile as PendingUserType } from '@/types';
import { Loader2, User, Mail, Phone, Building, CalendarIcon, Info, FileText, Workflow, Hash } from 'lucide-react';

const phoneRegex = /^[+\d()-\s]*$/;
const phoneErrorMessage = "Phone number can only contain digits, spaces, and +()-.";

const NO_FLAT_SELECTED_VALUE = "__NO_FLAT__";

const approveUserFormSchema = z.object({
  fullName: z.string().min(3, { message: "Full name is required (min 3 characters)." }).max(100),
  flatId: z.string().optional().nullable(),
  personStatus: z.nativeEnum(PersonStatus, { required_error: "Person status is required." }),
  phone: z.string().max(25, { message: "Phone number is too long." })
    .regex(phoneRegex, { message: phoneErrorMessage })
    .optional().or(z.literal(''))
    .transform(val => val ? val.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '') : ''),
  moveInDate: z.date({ required_error: "Move-in date is required." }),
  moveOutDate: z.date().optional().nullable(),
  notes: z.string().max(1000).optional().or(z.literal('')),
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

type ApproveUserFormValues = z.infer<typeof approveUserFormSchema>;

interface ApproveUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pendingUser: PendingUserType | null;
  onApprovalSuccess: () => void;
}

export function ApproveUserDialog({ isOpen, onOpenChange, pendingUser, onApprovalSuccess }: ApproveUserDialogProps) {
  const { toast } = useToast();
  const { user: approverUser, activeBuildingId } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [flats, setFlats] = React.useState<Flat[]>([]);
  const [isLoadingFlats, setIsLoadingFlats] = React.useState(true);

  const form = useForm<ApproveUserFormValues>({
    resolver: zodResolver(approveUserFormSchema),
    defaultValues: {
      fullName: '',
      flatId: NO_FLAT_SELECTED_VALUE,
      personStatus: PersonStatus.RESIDENT,
      phone: '',
      moveInDate: undefined,
      moveOutDate: null,
      notes: '',
    },
  });

  React.useEffect(() => {
    if (isOpen && pendingUser && activeBuildingId) {
      form.reset({
        fullName: pendingUser.name || '',
        flatId: pendingUser.flatId || NO_FLAT_SELECTED_VALUE,
        personStatus: pendingUser.status || (pendingUser.role === UserRole.MANAGER ? PersonStatus.MANAGER : PersonStatus.RESIDENT),
        phone: '', 
        moveInDate: pendingUser.moveInDate ? (pendingUser.moveInDate as any).toDate() : new Date(),
        moveOutDate: null, 
        notes: '', 
      });

      const fetchFlatsList = async () => {
        setIsLoadingFlats(true);
        try {
          if(!activeBuildingId) return;
          const fetchedFlats = await getFlats(activeBuildingId);
          setFlats(fetchedFlats);
        } catch (error) {
          console.error("Failed to fetch flats for approval dialog:", error);
          toast({ title: "Error", description: "Could not load flats list.", variant: "destructive" });
        } finally {
          setIsLoadingFlats(false);
        }
      };
      fetchFlatsList();
    }
  }, [isOpen, form, pendingUser, toast, activeBuildingId]);

  const moveInDateValue = form.watch('moveInDate');

  React.useEffect(() => {
    if (moveInDateValue) {
      const currentMoveOutDate = form.getValues('moveOutDate');
      if (currentMoveOutDate && currentMoveOutDate < moveInDateValue) {
        form.setValue('moveOutDate', moveInDateValue, { shouldValidate: true });
      }
    }
  }, [moveInDateValue, form]);

  const handleFormSubmit = async (values: ApproveUserFormValues) => {
    // In auth-free mode, this is a mock action.
    setIsSubmitting(true);
    console.log("Mock approval form submitted with values:", values);
    toast({
      title: "Mock Action",
      description: "User approval is disabled in this mode.",
    });
    setTimeout(() => {
      onOpenChange(false);
      setIsSubmitting(false);
    }, 1000);
  };
  
  const handleBlurCapitalizeWords = (fieldName: 'fullName') => (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      form.setValue(fieldName, capitalizeWords(value), { shouldValidate: true });
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isSubmitting) onOpenChange(open); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center"><Workflow className="mr-2 h-5 w-5 text-primary" />Approve User &amp; Setup Profile</DialogTitle>
          <DialogDescription>
            Verify or update user-provided details and complete profile information. Email: <strong>{pendingUser?.email}</strong>. Role: <strong>{pendingUser?.role}</strong>.
            Fields marked (<span className="text-destructive">*</span>) are required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name<span className="text-destructive ml-1">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        {...field} 
                        placeholder="User's full name"
                        onBlur={handleBlurCapitalizeWords('fullName')}
                        className="pl-10" 
                        disabled={isSubmitting} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="flatId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Assigned Flat/Unit</FormLabel>
                    <Select
                        value={field.value || NO_FLAT_SELECTED_VALUE}
                        onValueChange={field.onChange}
                        disabled={isSubmitting || isLoadingFlats}
                    >
                        <FormControl>
                        <SelectTrigger>
                            <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <SelectValue placeholder={isLoadingFlats ? "Loading..." : "Select flat"} className="pl-10" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_FLAT_SELECTED_VALUE}>None</SelectItem>
                          {flats.map((flat) => (
                              <SelectItem key={flat.id} value={flat.id}>
                              {flat.flatNumber} {flat.buildingBlock ? `(${flat.buildingBlock})` : ''}
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
                  name="moveInDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Move-in Date<span className="text-destructive ml-1">*</span></FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button 
                              variant={"outline"} 
                              className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} 
                              disabled={isSubmitting}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={isSubmitting}
                            initialFocus
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
              name="personStatus"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Person Status<span className="text-destructive ml-1">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                      <FormControl>
                      <SelectTrigger>
                          <Info className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <SelectValue placeholder="Select status" className="pl-10" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[PersonStatus.OWNER, PersonStatus.TENANT, PersonStatus.RESIDENT].map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                  </Select>
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
                        onBlur={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                        className="pl-10"
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
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
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isSubmitting}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => isSubmitting || (form.getValues("moveInDate") && date < form.getValues("moveInDate")!)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                      <Textarea placeholder="Internal notes about this person..." {...field} className="pl-10 min-h-[80px]" disabled={isSubmitting} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting || isLoadingFlats}>
                {(isSubmitting || isLoadingFlats) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoadingFlats ? "Loading data..." : (isSubmitting ? "Approving..." : "Approve & Save Profile")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
