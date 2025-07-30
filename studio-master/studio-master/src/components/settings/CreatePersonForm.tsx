
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { createPerson, getBuildings, getFlats, type Building, type Flat, type CreatePersonData } from '@/lib/firebase/firestore';
import { PersonStatus, UserRole } from '@/types';
import { Loader2, User, Mail, Building as BuildingIcon, Home, Info, UserPlus } from 'lucide-react';
import { capitalizeWords } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';

const createPersonSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "A valid email is required." }),
  role: z.nativeEnum(UserRole, { required_error: "A role must be selected." }),
  status: z.nativeEnum(PersonStatus, { required_error: "A status must be selected." }),
  buildingId: z.string().optional(),
  accessibleBuildingIds: z.array(z.string()).optional(),
  flatId: z.string().optional(),
});

type CreatePersonFormValues = z.infer<typeof createPersonSchema>;

const NULL_VALUE = "__NULL__";

interface CreatePersonFormProps {
    onPersonCreated: () => void;
}

export function CreatePersonForm({ onPersonCreated }: CreatePersonFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [buildings, setBuildings] = React.useState<Building[]>([]);
  const [flats, setFlats] = React.useState<Flat[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const form = useForm<CreatePersonFormValues>({
    resolver: zodResolver(createPersonSchema),
    defaultValues: {
      name: '',
      email: '',
      role: UserRole.RESIDENT,
      status: PersonStatus.RESIDENT,
      buildingId: NULL_VALUE,
      accessibleBuildingIds: [],
      flatId: NULL_VALUE,
    },
  });

  const selectedRole = form.watch('role');
  const selectedBuildingId = form.watch('buildingId');

  React.useEffect(() => {
    const fetchSelectData = async () => {
      setIsLoadingData(true);
      try {
        const [fetchedBuildings, fetchedFlats] = await Promise.all([
          getBuildings(),
          getFlats()
        ]);
        setBuildings(fetchedBuildings);
        setFlats(fetchedFlats);
      } catch (error) {
        toast({ title: "Error", description: "Could not load buildings and flats for selection.", variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchSelectData();
  }, [toast]);
  
  React.useEffect(() => {
    // Reset dependant fields when role changes
    form.setValue('buildingId', NULL_VALUE);
    form.setValue('accessibleBuildingIds', []);
    form.setValue('flatId', NULL_VALUE);
  }, [selectedRole, form]);

  const handleFormSubmit = async (values: CreatePersonFormValues) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    const buildingId = values.buildingId === NULL_VALUE ? null : values.buildingId;
    const flatId = values.flatId === NULL_VALUE ? null : values.flatId;
    let flatNumber: string | null = null;
    if (flatId) {
        const selectedFlat = flats.find(f => f.id === flatId);
        flatNumber = selectedFlat?.flatNumber ?? null;
    }

    try {
      const personData: Partial<CreatePersonData> = {
        name: capitalizeWords(values.name),
        email: values.email.toLowerCase().trim(),
        role: values.role,
        status: values.status,
        buildingId: values.role === UserRole.MANAGER ? null : buildingId,
        accessibleBuildingIds: values.role === UserRole.MANAGER ? values.accessibleBuildingIds : null,
        flatId: flatId,
        flatNumber: flatNumber,
        moveInDate: new Date(),
      };
      
      const result = await createPerson(personData, user.uid);
      
      toast({ 
        title: result.action === 'created' ? "Person Created" : "Manager Updated",
        description: result.message
      });
      
      form.reset({
        name: '',
        email: '',
        role: UserRole.RESIDENT,
        status: PersonStatus.RESIDENT,
        buildingId: NULL_VALUE,
        accessibleBuildingIds: [],
        flatId: NULL_VALUE,
      });

      onPersonCreated();

    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not create or update person.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredFlats = selectedBuildingId && selectedBuildingId !== NULL_VALUE
    ? flats.filter(flat => flat.buildingId === selectedBuildingId)
    : [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="e.g., John Doe" {...field} className="pl-10" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" placeholder="user@example.com" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem><FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger></FormControl>
                    <SelectContent>{Object.values(UserRole).map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><Info className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><SelectValue placeholder="Select status" className="pl-10" /></SelectTrigger></FormControl>
                    <SelectContent>{Object.values(PersonStatus).filter(s => s !== PersonStatus.PENDING_APPROVAL).map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}
            />
        </div>
        <Separator/>
        {selectedRole === UserRole.MANAGER ? (
          <FormField
            control={form.control}
            name="accessibleBuildingIds"
            render={() => (
              <FormItem>
                <FormLabel>Accessible Buildings</FormLabel>
                <ScrollArea className="h-32 w-full rounded-md border p-2">
                  {buildings.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="accessibleBuildingIds"
                      render={({ field }) => (
                        <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-y-0 my-1">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.id])
                                  : field.onChange(field.value?.filter((value) => value !== item.id));
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{item.name}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </ScrollArea>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="buildingId"
              render={({ field }) => (
                <FormItem><FormLabel>Building</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingData}>
                    <FormControl><SelectTrigger><BuildingIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><SelectValue placeholder={isLoadingData ? "Loading..." : "Select building"} className="pl-10" /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value={NULL_VALUE}>None</SelectItem>{buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="flatId"
              render={({ field }) => (
                <FormItem><FormLabel>Flat</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedBuildingId || selectedBuildingId === NULL_VALUE || isLoadingData}>
                    <FormControl><SelectTrigger><Home className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><SelectValue placeholder="Select flat" className="pl-10" /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value={NULL_VALUE}>None</SelectItem>{filteredFlats.map(f => <SelectItem key={f.id} value={f.id}>{f.flatNumber}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isLoading || isLoadingData}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <UserPlus className="mr-2 h-4 w-4" />
                Create / Update Person
            </Button>
        </div>
      </form>
    </Form>
  );
}
