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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, UserPlus, Loader2 } from 'lucide-react';
import { UserRole } from '@/types';

const inviteFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.nativeEnum(UserRole, { required_error: "Please select a role for the invitee." }),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface InviteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({ isOpen, onOpenChange }: InviteUserDialogProps) {
  const { toast } = useToast();
  const [isSendingInvite, setIsSendingInvite] = React.useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: '',
      role: UserRole.RESIDENT,
    },
  });

  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const handleSendInvite = async (values: InviteFormValues) => {
    setIsSendingInvite(true);
    // Simulate sending an invite
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Mock Invitation Sent",
      description: `In a real system, an email invite would be sent to ${values.email} to sign up as a ${values.role}. For now, please ask them to visit the signup page directly.`,
      duration: 7000,
    });
    setIsSendingInvite(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5 text-primary" />
            Invite New Person (Mock)
          </DialogTitle>
          <DialogDescription>
            Enter the email and select a role for the person you'd like to invite.
            They will receive instructions on how to sign up. (This is a mock interface).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSendInvite)} className="space-y-6 py-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="email" placeholder="invitee@example.com" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Invite as...</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={UserRole.RESIDENT} />
                        </FormControl>
                        <Label className="font-normal">{UserRole.RESIDENT}</Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={UserRole.MANAGER} />
                        </FormControl>
                        <Label className="font-normal">{UserRole.MANAGER}</Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSendingInvite}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSendingInvite}>
                {isSendingInvite && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invite
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
