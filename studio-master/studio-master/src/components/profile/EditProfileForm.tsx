
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
// getFlats and updateUserProfileDocument are Firebase specific, remove if not adapting for no-auth
// For now, getFlats might still be useful if flats are independent of auth
import { getFlats, updatePerson } from "@/lib/firebase/firestore"; 
import { Loader2, Building, Info, LogOut, AlertOctagon } from "lucide-react";
import { type Flat, PersonStatus, UserRole, type UpdatePersonData } from "@/types";
import { useRouter } from "next/navigation";
import { CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
// updateUserFirebaseProfile from firebase/auth is now a no-op

const NO_FLAT_SELECTED_VALUE = "__NO_FLAT__";
const NO_STATUS_SELECTED_VALUE = "__NO_STATUS__";

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50, { message: "Display name cannot exceed 50 characters." }), 
  flatId: z.string().optional().nullable(),
  status: z.union([
    z.nativeEnum(PersonStatus),
    z.literal(NO_STATUS_SELECTED_VALUE)
  ]).optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function EditProfileForm() {
  const { user: authContextUser, loading: authContextLoading, refreshAuthContextUser } = useAuth(); 
  const { toast } = useToast();
  const router = useRouter();
  const [flats, setFlats] = React.useState<Flat[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingFlats, setIsLoadingFlats] = React.useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "", 
      flatId: NO_FLAT_SELECTED_VALUE,
      status: NO_STATUS_SELECTED_VALUE,
    },
  });

  const fetchFlatsList = React.useCallback(async (buildingId: string) => {
    setIsLoadingFlats(true);
    try {
      const fetchedFlats = await getFlats(buildingId);
      setFlats(fetchedFlats);
    } catch (error) {
      console.error("[EditProfileForm] Failed to fetch flats:", error);
      toast({
        title: 'Error Fetching Flats',
        description: 'Could not load flats for selection.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingFlats(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (authContextUser?.buildingId) {
      fetchFlatsList(authContextUser.buildingId);
    } else {
      setIsLoadingFlats(false);
    }
  }, [fetchFlatsList, authContextUser?.buildingId]);

  React.useEffect(() => {
    if (authContextUser && !isLoadingFlats) {
      form.reset({
        displayName: authContextUser.displayName || "",
        flatId: authContextUser.flatId || NO_FLAT_SELECTED_VALUE,
        status: authContextUser.status || NO_STATUS_SELECTED_VALUE,
      });
    }
  }, [authContextUser, isLoadingFlats, form, form.reset]);

  const handleFormSubmit = async (values: ProfileFormValues) => {
    if (!authContextUser) {
      toast({ title: "Error", description: "Not logged in.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const dataToUpdate: UpdatePersonData = {};

      if (values.displayName !== authContextUser.displayName) {
          dataToUpdate.name = values.displayName;
      }
      
      if (values.flatId !== (authContextUser.flatId || NO_FLAT_SELECTED_VALUE)) {
        dataToUpdate.flatId = values.flatId === NO_FLAT_SELECTED_VALUE ? null : values.flatId;
      }
      
      if(Object.keys(dataToUpdate).length > 0) {
        await updatePerson(authContextUser.id, authContextUser.uid, dataToUpdate);
        await refreshAuthContextUser();
        toast({ title: "Profile Updated", description: "Your profile details have been updated."});
      } else {
        toast({ title: "No Changes", description: "No changes were detected to save."});
      }
      
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  };


  if (authContextLoading && !authContextUser) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!authContextUser) {
    return <p className="text-muted-foreground">User profile could not be loaded.</p>
  }

  const isManager = authContextUser.role === UserRole.MANAGER;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
            <Input type="email" value={authContextUser?.email || ""} disabled className="bg-muted/50 cursor-not-allowed" />
            </FormControl>
        </FormItem>

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <div className="relative">
                    <Input placeholder="Your first name" {...field} value={field.value || ''} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormItem>
            <FormLabel>Role</FormLabel>
            <FormControl>
            <Input value={authContextUser?.role || "N/A"} disabled className="bg-muted/50 cursor-not-allowed" />
            </FormControl>
            <FormMessage />
        </FormItem>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                Occupancy Status
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || NO_STATUS_SELECTED_VALUE}
                disabled
              >
                <FormControl>
                  <SelectTrigger disabled className="bg-muted/50 cursor-not-allowed">
                    <Info className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <SelectValue placeholder="Select your status" className="pl-10"/>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_STATUS_SELECTED_VALUE}>None</SelectItem>
                  {Object.values(PersonStatus).map((statusVal) => (
                    <SelectItem key={statusVal} value={statusVal}>
                      {statusVal}
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
          name="flatId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                My Flat
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || NO_FLAT_SELECTED_VALUE}
                disabled={isLoadingFlats || isLoading || isManager}
              >
                <FormControl>
                  <SelectTrigger disabled={isManager} className={cn(isManager && "bg-muted/50 cursor-not-allowed")}>
                     <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <SelectValue
                      placeholder={isLoadingFlats ? "Loading flats..." : "Select your flat/unit"} className="pl-10"
                    />
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
              {isManager && <CardDescription className="text-xs">Managers are not associated with a single flat.</CardDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-3 pt-4">
             <Button type="submit" disabled={isLoading || isLoadingFlats}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
            </Button>
        </div>
      </form>
    </Form>
  );
}
    
