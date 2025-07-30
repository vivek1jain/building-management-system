

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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, capitalizeFirstLetter } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getFlats, getSuppliers, updateAsset, type UpdateAssetData } from '@/lib/firebase/firestore';
import { AssetStatus, type Flat, type Supplier, type Asset } from '@/types';
import { Loader2, Package, Tag, MapPin, Home, Wrench, CalendarIcon, Settings, FileText, ShieldAlert, Info, PlusCircle, PlayCircle, StopCircle } from 'lucide-react'; // Changed Building to Home, Briefcase to Wrench
import { AddSupplierDialog } from './AddSupplierDialog';
import type { Timestamp } from 'firebase/firestore';

const editAssetFormSchema = z.object({
  name: z.string().min(2, { message: "Asset name is required and must be at least 2 characters." }).max(100),
  type: z.string().max(50).optional().or(z.literal('')),
  status: z.nativeEnum(AssetStatus, { required_error: "Status is required." }),
  locationDescription: z.string().max(255).optional().or(z.literal('')),
  flatId: z.string().optional().nullable(),
  manufacturer: z.string().max(100).optional().or(z.literal('')),
  modelNumber: z.string().max(100).optional().or(z.literal('')),
  serialNumber: z.string().max(100).optional().or(z.literal('')),
  purchaseDate: z.date().optional().nullable(),
  installationDate: z.date().optional().nullable(),
  commissionedDate: z.date().optional().nullable(),
  decommissionedDate: z.date().optional().nullable(),
  warrantyExpiryDate: z.date().optional().nullable(),
  nextServiceDate: z.date().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  notes: z.string().max(1000).optional(),
});

type EditAssetFormValues = z.infer<typeof editAssetFormSchema>;

const NULL_SELECT_VALUE = "__NULL__";

interface EditAssetFormProps {
  asset: Asset;
}

export function EditAssetForm({ asset }: EditAssetFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [flats, setFlats] = React.useState<Flat[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [isLoadingFlats, setIsLoadingFlats] = React.useState(true);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = React.useState(true);
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = React.useState(false);

  const toDateOrNull = (timestamp: Timestamp | Date | null | undefined): Date | null => {
    if (!timestamp) return null;
    if (timestamp instanceof Date) return timestamp;
    return timestamp.toDate();
  };

  const form = useForm<EditAssetFormValues>({
    resolver: zodResolver(editAssetFormSchema),
    defaultValues: {
      name: asset.name || '',
      type: asset.type || '',
      status: asset.status || AssetStatus.UNKNOWN,
      locationDescription: asset.locationDescription || '',
      flatId: asset.flatId || NULL_SELECT_VALUE,
      manufacturer: asset.manufacturer || '',
      modelNumber: asset.modelNumber || '',
      serialNumber: asset.serialNumber || '',
      purchaseDate: toDateOrNull(asset.purchaseDate),
      installationDate: toDateOrNull(asset.installationDate),
      commissionedDate: toDateOrNull(asset.commissionedDate),
      decommissionedDate: toDateOrNull(asset.decommissionedDate),
      warrantyExpiryDate: toDateOrNull(asset.warrantyExpiryDate),
      nextServiceDate: toDateOrNull(asset.nextServiceDate),
      supplierId: asset.supplierId || NULL_SELECT_VALUE,
      notes: asset.notes || '',
    },
  });

  const fetchFlatsAndSuppliers = React.useCallback(async () => {
    setIsLoadingFlats(true);
    setIsLoadingSuppliers(true);
    try {
      const [fetchedFlats, fetchedSuppliers] = await Promise.all([
        getFlats(), 
        getSuppliers()
      ]);
      setFlats(fetchedFlats);
      setSuppliers(fetchedSuppliers);
    } catch (error) {
      console.error("Failed to fetch flats or suppliers:", error);
      toast({
        title: 'Error Fetching Data',
        description: 'Could not load flats or suppliers for selection.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingFlats(false);
      setIsLoadingSuppliers(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchFlatsAndSuppliers();
  }, [fetchFlatsAndSuppliers]);

  const handleSupplierAdded = async (newSupplierId: string) => {
    toast({
      title: "Supplier Added",
      description: "The new supplier has been added to the list.",
    });
    setIsLoadingSuppliers(true);
    try {
      const updatedSuppliers = await getSuppliers();
      setSuppliers(updatedSuppliers);
      form.setValue('supplierId', newSupplierId);
    } catch (error) {
      console.error("Failed to re-fetch suppliers:", error);
      toast({
        title: 'Error refreshing suppliers',
        description: 'Could not update the supplier list.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSuppliers(false);
      setIsAddSupplierDialogOpen(false);
    }
  };

  const handleFormSubmit = async (values: EditAssetFormValues) => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to update an asset.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    setIsUpdating(true);

    const selectedFlat = values.flatId && values.flatId !== NULL_SELECT_VALUE ? flats.find(f => f.id === values.flatId) : null;
    const selectedSupplier = values.supplierId && values.supplierId !== NULL_SELECT_VALUE ? suppliers.find(s => s.id === values.supplierId) : null;

    try {
      const assetUpdateData: UpdateAssetData = { 
        name: capitalizeFirstLetter(values.name),
        type: values.type ? capitalizeFirstLetter(values.type) : undefined,
        status: values.status,
        locationDescription: values.locationDescription ? capitalizeFirstLetter(values.locationDescription) : undefined,
        flatId: selectedFlat ? selectedFlat.id : null,
        flatNumber: selectedFlat ? selectedFlat.flatNumber : null,
        manufacturer: values.manufacturer ? capitalizeFirstLetter(values.manufacturer) : undefined,
        modelNumber: values.modelNumber || undefined,
        serialNumber: values.serialNumber || undefined,
        purchaseDate: values.purchaseDate || null,
        installationDate: values.installationDate || null,
        commissionedDate: values.commissionedDate || null,
        decommissionedDate: values.decommissionedDate || null,
        warrantyExpiryDate: values.warrantyExpiryDate || null,
        nextServiceDate: values.nextServiceDate || null,
        supplierId: selectedSupplier ? selectedSupplier.id : null,
        supplierName: selectedSupplier ? selectedSupplier.name : null,
        notes: values.notes || undefined,
      };
      
      await updateAsset(asset.id, user.uid, assetUpdateData);
      toast({
        title: 'Asset Updated',
        description: `${assetUpdateData.name} has been successfully updated.`,
      });
      router.push('/building?tab=assets');
    } catch (error: any) {
      toast({
        title: 'Error Updating Asset',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const dataLoading = isLoadingFlats || isLoadingSuppliers;

  const handleBlurCapitalize = (fieldName: keyof EditAssetFormValues) => (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      form.setValue(fieldName, capitalizeFirstLetter(value), { shouldValidate: true });
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Name<span className="text-destructive ml-1">*</span></FormLabel>
                <FormControl>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="e.g., Main Boiler, Flat 101 Fridge" 
                      {...field} 
                      onBlur={handleBlurCapitalize('name')}
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Type</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="e.g., Heating, Appliance, Fixture" 
                        {...field} 
                        onBlur={handleBlurCapitalize('type')}
                        className="pl-10" 
                      />
                    </div>
                  </FormControl>
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
                      {Object.values(AssetStatus).map((status) => (
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
          
          <FormField
            control={form.control}
            name="locationDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location Description</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="e.g., Roof, Flat 5A Kitchen, Basement Cupboard" 
                      {...field} 
                      onBlur={handleBlurCapitalize('locationDescription')}
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
                  <FormLabel>Associated Flat/Unit</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || NULL_SELECT_VALUE} 
                    disabled={isLoadingFlats}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <Home className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <SelectValue 
                          placeholder={isLoadingFlats ? "Loading flats..." : "None / Select flat"} 
                          className="pl-10" 
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NULL_SELECT_VALUE}>None</SelectItem>
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
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Supplier/Vendor</FormLabel>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto px-2 py-1 text-xs"
                      onClick={() => setIsAddSupplierDialogOpen(true)}
                      disabled={isLoadingSuppliers}
                    >
                      <PlusCircle className="mr-1 h-3.5 w-3.5" /> New
                    </Button>
                  </div>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || NULL_SELECT_VALUE} 
                    disabled={isLoadingSuppliers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <Wrench className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <SelectValue 
                          placeholder={isLoadingSuppliers ? "Loading suppliers..." : "None / Select supplier"} 
                          className="pl-10" 
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NULL_SELECT_VALUE}>None</SelectItem>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer</FormLabel>
                  <Input 
                    placeholder="e.g., Worcester Bosch, Hotpoint" 
                    {...field} 
                    onBlur={handleBlurCapitalize('manufacturer')}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="modelNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Number</FormLabel>
                  <Input placeholder="e.g., Greenstar 30i, HBNF55181W" {...field} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <Input placeholder="e.g., SN12345XYZ" {...field} />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Purchase Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="installationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Installation Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="commissionedDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Commissioned Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="decommissionedDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Decommissioned Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          <StopCircle className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="warrantyExpiryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Warranty Expiry</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextServiceDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Next Service Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          <Wrench className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea placeholder="Any additional details about the asset..." {...field} className="pl-10 min-h-[80px]" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isUpdating || dataLoading}>
            {isUpdating || dataLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
            {isUpdating ? 'Updating Asset...' : (dataLoading ? 'Loading data...' : 'Save Changes')}
          </Button>
        </form>
      </Form>
      <AddSupplierDialog 
        isOpen={isAddSupplierDialogOpen}
        onOpenChange={setIsAddSupplierDialogOpen}
        onSupplierAdded={handleSupplierAdded}
      />
    </>
  );
}
