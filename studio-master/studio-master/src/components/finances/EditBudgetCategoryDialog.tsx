
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { updateBudgetCategory } from '@/lib/firebase/firestore';
import { Loader2, Tag } from 'lucide-react';
import type { BudgetCategory } from '@/types';

const editCategorySchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters." }).max(50),
});

type EditCategoryFormValues = z.infer<typeof editCategorySchema>;

interface EditBudgetCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category: BudgetCategory | null;
  buildingId: string;
  onCategoryUpdated: () => void;
}

export function EditBudgetCategoryDialog({ isOpen, onOpenChange, category, buildingId, onCategoryUpdated }: EditBudgetCategoryDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EditCategoryFormValues>({
    resolver: zodResolver(editCategorySchema),
    defaultValues: { name: '' },
  });

  React.useEffect(() => {
    if (category) {
      form.reset({ name: category.name });
    }
  }, [category, form]);

  const handleFormSubmit = async (values: EditCategoryFormValues) => {
    if (!user || !category) {
      toast({ title: 'Error', description: 'Required data is missing.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateBudgetCategory(buildingId, category.id, { name: values.name });
      toast({ title: 'Category Updated', description: `Category renamed to "${values.name}".` });
      onCategoryUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error Updating Category', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Budget Category</DialogTitle>
          <DialogDescription>
            Rename the category. This will update it for all future expenses.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="e.g., Cleaning, Maintenance" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
