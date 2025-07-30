
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
import { PersonStatus, UserRole, type Flat, type UserApprovalData, type Person } from '@/types';
import { Loader2, User, Mail, Phone, Building, CalendarIcon, Info, FileText, Workflow, Hash } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

// This component is no longer used and can be removed in a future cleanup.
// Its logic has been replaced by the CreatePersonForm.

const phoneRegex = /^[+\d()-\s]*$/;
const phoneErrorMessage = "Phone number can only contain digits, spaces, and +()-.";

const NO_FLAT_SELECTED_VALUE = "__NO_FLAT__";

const approveUserFormSchema = z.object({
  name: z.string().min(3, { message: "Full name is required (min 3 characters)." }).max(100),
  flatId: z.string().optional().nullable(),
  status: z.nativeEnum(PersonStatus, { required_error: "Person status is required." }),
  phone: z.string().max(25, { message: "Phone number is too long." })
    .optional().or(z.literal('')),
  moveInDate: z.date({ required_error: "A move-in date is required." }),
  moveOutDate: z.date().optional().nullable(),
  notes: z.string().max(1000).optional().or(z.literal('')),
}).refine(
  (data) => {
    // If the status is Manager, flatId is not required.
    if (data.status === PersonStatus.MANAGER) {
      return true;
    }
    // Otherwise, for other roles, a flatId must be selected.
    return !!data.flatId && data.flatId !== NO_FLAT_SELECTED_VALUE;
  },
  {
    message: "A flat must be selected unless the status is Manager.",
    path: ["flatId"],
  }
).refine(
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
  pendingUser: Person | null;
  onApprovalSuccess: () => void;
  buildingId: string;
}

export function ApproveUserDialog({ isOpen, onOpenChange, pendingUser, onApprovalSuccess, buildingId }: ApproveUserDialogProps) {
  const { toast } = useToast();
  const { user: approverUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [flats, setFlats] = React.useState<Flat[]>([]);
  const [isLoadingFlats, setIsLoadingFlats] = React.useState(true);

  const form = useForm<ApproveUserFormValues>({
    resolver: zodResolver(approveUserFormSchema),
    defaultValues: {
      name: '',
      flatId: NO_FLAT_SELECTED_VALUE,
      status: PersonStatus.RESIDENT,
      phone: '',
      moveInDate: undefined,
      moveOutDate: null,
      notes: '',
    },
  });
  
  const selectedStatus = form.watch('status');
  const showFlatSelection = selectedStatus !== PersonStatus.MANAGER;

  const toDateOrNull = (timestamp: Timestamp | Date | null | undefined): Date | null => {
    if (!timestamp) return null;
    if (timestamp instanceof Date) return timestamp;
    return timestamp.toDate();
  };

  React.useEffect(() => {
    if (isOpen && pendingUser && buildingId) {
      let defaultStatus = PersonStatus.RESIDENT;
      if (pendingUser.role === UserRole.MANAGER) defaultStatus = PersonStatus.MANAGER;

      form.reset({
        name: pendingUser.name || '',
        flatId: pendingUser.flatId || NO_FLAT_SELECTED_VALUE,
        status: defaultStatus,
        phone: '',
        moveInDate: toDateOrNull(pendingUser.moveInDate) || new Date(),
        moveOutDate: null,
        notes: '',
      });

      const fetchFlatsList = async () => {
        setIsLoadingFlats(true);
        try {
          const fetchedFlats = await getFlats(buildingId);
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
  }, [isOpen, form, pendingUser, toast, buildingId]);

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
    setIsSubmitting(true);
    // Since auth is removed, we just show a toast and close the dialog
    console.log("Mock user approval data:", values);
    toast({ title: 'Mock Approval', description: 'User approval functionality is disabled in auth-free mode.' });
    onOpenChange(false);
    setIsSubmitting(false);
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isSubmitting) onOpenChange(open); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center"><Workflow className="mr-2 h-5 w-5 text-primary" />Approve User &amp; Setup Profile</DialogTitle>
          <DialogDescription>
            This component is no longer in use. Please use the "Create Person" form instead.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
