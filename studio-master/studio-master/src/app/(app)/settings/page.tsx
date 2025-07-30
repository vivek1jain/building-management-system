
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, type Person, type GlobalFinancialSettings, type Building, type CreateBuildingData } from '@/types';
import { saveGlobalFinancialSettings, getGlobalFinancialSettings, getBuildingById, updateBuilding, createBuilding } from '@/lib/firebase/firestore'; 
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, UserPlus, PackageOpen, CheckCircle, Loader2, DollarSign, Settings2, AlertTriangle, Palette, BellRing, Building as BuildingIcon, MapPin, PlusCircle, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { FinancialSettingsForm } from '@/components/settings/FinancialSettingsForm';
import { DesignSystemTokens } from '@/components/settings/DesignSystemTokens';
import { ReminderPrioritySettingsForm } from '@/components/settings/ReminderPrioritySettingsForm';
import { BuildingSettingsForm } from '@/components/settings/BuildingSettingsForm';
import { collection, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createPerson } from '@/lib/firebase/firestore';
import { PersonStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CreatePersonForm } from '@/components/settings/CreatePersonForm';


export default function SettingsPage() {
  const { user, loading: authLoading, refreshAuthContextUser, activeBuildingId } = useAuth();
  const { toast } = useToast();

  const [financialSettings, setFinancialSettings] = React.useState<GlobalFinancialSettings>({
    serviceChargeRatePerSqFt: null,
    paymentDueLeadDays: null,
    financialYearStartDate: new Date(2000, 3, 1), 
    reminderPrioritySettings: {},
  });
  const [isLoadingFinancialSettings, setIsLoadingFinancialSettings] = React.useState(true);

  const [building, setBuilding] = React.useState<Building | null>(null);
  const [isLoadingBuilding, setIsLoadingBuilding] = React.useState(true);
  const [isBuildingFormOpen, setIsBuildingFormOpen] = React.useState(false);
  const [buildingToEdit, setBuildingToEdit] = React.useState<Building | null>(null);

  const fetchGlobalSettings = React.useCallback(async (buildingId: string) => {
    if (user && user.role === UserRole.MANAGER) {
      setIsLoadingFinancialSettings(true);
      try {
        const fetchedSettings = await getGlobalFinancialSettings(buildingId);
        setFinancialSettings(fetchedSettings);
      } catch (error: any) {
        toast({ title: "Error Fetching Financial Settings", description: error.message || "Could not load financial settings from database.", variant: "destructive" });
      } finally {
        setIsLoadingFinancialSettings(false);
      }
    } else {
        setIsLoadingFinancialSettings(false);
    }
  }, [user, toast]);

  const fetchBuildingDetails = React.useCallback(async (buildingId: string) => {
    setIsLoadingBuilding(true);
    try {
        const buildingData = await getBuildingById(buildingId);
        setBuilding(buildingData);
    } catch (err: any) {
        toast({ title: "Error", description: err.message || "Could not load building details", variant: "destructive" });
    } finally {
        setIsLoadingBuilding(false);
    }
  }, [toast]);


  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
        setIsLoadingFinancialSettings(false);
        setIsLoadingBuilding(false);
        return;
    }

    if (user.role === UserRole.MANAGER) {
        if (activeBuildingId) {
            fetchGlobalSettings(activeBuildingId);
            fetchBuildingDetails(activeBuildingId);
        } else {
            setIsLoadingFinancialSettings(false);
            setIsLoadingBuilding(false);
            setBuilding(null);
            setBuildingToEdit(null);
            setIsBuildingFormOpen(true);
        }
    } else {
        setIsLoadingFinancialSettings(false);
        setIsLoadingBuilding(false);
    }

  }, [authLoading, user, activeBuildingId, fetchGlobalSettings, fetchBuildingDetails]);


  const handleSaveSettings = async (newSettings: GlobalFinancialSettings) => {
    if (!user || !activeBuildingId) {
      toast({ title: "Unauthorized or No Building Selected", description: "You must be logged in and have an active building to save settings.", variant: "destructive"});
      return;
    }
    try {
        await saveGlobalFinancialSettings(activeBuildingId, newSettings, user.uid);
        setFinancialSettings(newSettings); 
        toast({
            title: "Settings Updated",
            description: "Global settings have been saved to the database.",
        });
    } catch (error: any) {
        console.error("Error saving global settings to Firestore:", error);
        toast({
            title: "Error Saving Settings",
            description: "Could not save settings to the database. " + (error.message || ""),
            variant: "destructive",
        });
    }
  };

  const handleSaveBuilding = async (data: CreateBuildingData) => {
    if (!user) return;
    try {
        if (buildingToEdit && buildingToEdit.id) {
            await updateBuilding(buildingToEdit.id, data);
            toast({ title: "Building Details Saved", description: `${data.name} has been updated.` });
        } else {
            const newBuildingId = doc(collection(db, 'buildings')).id;
            await createBuilding(newBuildingId, data, user.uid);
            const personDataForNewBuilding: Partial<Person> = {
                buildingId: newBuildingId,
                name: user.name || "Manager",
                email: user.email,
                role: UserRole.MANAGER,
                status: PersonStatus.MANAGER,
            };
            await createPerson(personDataForNewBuilding, user.uid, newBuildingId);
            toast({ title: "Building Created", description: `${data.name} has been created and assigned to you.` });
        }
        await refreshAuthContextUser();
        setIsBuildingFormOpen(false);
        setBuildingToEdit(null);

    } catch (err: any) {
        toast({ title: "Error", description: err.message || "Could not save building details.", variant: "destructive" });
    }
  };
  
  const handleEditBuildingClick = () => {
    setBuildingToEdit(building);
    setIsBuildingFormOpen(true);
  }

  const renderFinancialSettingsLoadingSkeleton = () => (
     <Card className="shadow-lg">
      <CardHeader> <Skeleton className="h-8 w-1/2" /> <Skeleton className="h-4 w-3/4" /> </CardHeader>
      <CardContent className="space-y-4">
        <div className="mb-6 p-3 bg-muted/50 border rounded-md text-xs">
            <Skeleton className="h-4 w-1/3 mb-1" />
            <Skeleton className="h-3 w-full mb-0.5" />
            <Skeleton className="h-3 w-full mb-0.5" />
            <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
        <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
        <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
        <Skeleton className="h-10 w-24" />
      </CardContent>
    </Card>
  );

  const isManager = user?.role === UserRole.MANAGER;

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline text-3xl flex items-center">
                    <SettingsIcon className="mr-3 h-8 w-8 text-primary" />
                    Application Settings
                </CardTitle>
                <CardDescription>Manage various configuration options for the application.</CardDescription>
            </div>
            {isManager && (
                <Button onClick={() => { setBuildingToEdit(null); setIsBuildingFormOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Building
                </Button>
            )}
        </CardHeader>
        <CardContent>
          {isManager ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              <div className="flex flex-col gap-6">
                {isLoadingBuilding ? (
                    <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                ) : building ? (
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-xl flex items-center"><BuildingIcon className="mr-2 h-5 w-5 text-primary" />Building Details</CardTitle>
                                <CardDescription>Details for the active building.</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleEditBuildingClick}><Pencil className="h-4 w-4" /><span className="sr-only">Edit</span></Button>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                           <p><strong className="font-semibold text-foreground/90">Name:</strong> <span className="text-muted-foreground">{building.name}</span></p>
                           <p><strong className="font-semibold text-foreground/90">Address:</strong> <span className="text-muted-foreground">{building.address}</span></p>
                        </CardContent>
                    </Card>
                ) : (
                     <Card className="shadow-lg border-dashed border-primary/50">
                        <CardHeader><CardTitle className="text-xl flex items-center"><BuildingIcon className="mr-2 h-5 w-5 text-primary" />No Active Building</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground">Select a building from the header switcher or create a new one to manage its settings.</p></CardContent>
                    </Card>
                )}

                {activeBuildingId && (authLoading || isLoadingFinancialSettings ? renderFinancialSettingsLoadingSkeleton() : (
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center">
                                <DollarSign className="mr-2 h-5 w-5 text-accent" />
                                Financial Configuration
                            </CardTitle>
                            <CardDescription>
                                Define global rates, due dates, and financial year settings. Fields marked with (<span className="text-destructive">*</span>) are required.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FinancialSettingsForm
                                initialSettings={financialSettings}
                                onSave={handleSaveSettings}
                                isLoading={isLoadingFinancialSettings}
                            />
                        </CardContent>
                    </Card>
                ))}
              </div>

              <div className="flex flex-col gap-6">
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center">
                            <UserPlus className="mr-2 h-5 w-5 text-accent" />
                            User Management
                        </CardTitle>
                        <CardDescription>Manually create new person records for the application.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CreatePersonForm onPersonCreated={refreshAuthContextUser} />
                    </CardContent>
                 </Card>

                 {activeBuildingId && (authLoading || isLoadingFinancialSettings ? <Skeleton className="h-48 w-full" /> : (
                  <Card className="shadow-lg">
                      <CardHeader>
                          <CardTitle className="text-xl flex items-center">
                              <BellRing className="mr-2 h-5 w-5 text-accent" />
                              Reminder Priorities
                          </CardTitle>
                          <CardDescription>
                            Set the priority for different types of automated reminders. 'High' priority reminders will appear in the main Dashboard Alerts widget.
                          </CardDescription>
                      </CardHeader>
                      <CardContent>
                          <ReminderPrioritySettingsForm
                              initialSettings={financialSettings}
                              onSave={handleSaveSettings}
                          />
                      </CardContent>
                  </Card>
                 ))}
              </div>
              <div className="lg:col-span-1">
                <DesignSystemTokens />
              </div>
            </div>
          ) : (
             <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                 <Settings2 className="mr-2 h-5 w-5 text-primary"/> General Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Your application settings will appear here. Administrative settings are available to Property Managers only.</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Dialog open={isBuildingFormOpen} onOpenChange={setIsBuildingFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{buildingToEdit ? 'Edit Building Details' : 'Create New Building'}</DialogTitle>
                <DialogDescription>
                    {buildingToEdit ? `Update the details for "${buildingToEdit.name}".` : "Enter the details for your new building."}
                </DialogDescription>
            </DialogHeader>
            <BuildingSettingsForm 
                building={buildingToEdit} 
                isLoading={false} 
                onSave={handleSaveBuilding}
                onCancel={() => setIsBuildingFormOpen(false)}
            />
        </DialogContent>
      </Dialog>
    </>
  );
}
