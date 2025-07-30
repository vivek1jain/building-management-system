
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, type GlobalFinancialSettings, type Flat, type FinancialQuarterOption, type FlatWithServiceCharge, type ServiceChargeDemand } from '@/types';
import { generateAndStoreServiceChargeDemands, type CreateServiceChargeDemandsInput, getGlobalFinancialSettings as fetchGlobalFinancialSettingsFromDB, getFlats, getServiceChargeDemands } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Banknote, Info, Loader2, Receipt, CalendarIcon as CalendarLucideIcon, HelpCircle, FileText, FileSpreadsheet, CreditCard, TrendingUp, ListChecks, Settings, AlertTriangle, Target, PiggyBank, LayoutGrid, Coins, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, formatCurrency } from '@/lib/utils';
import { format, startOfQuarter as startOfCalendarQuarter, endOfQuarter as endOfCalendarQuarter, subDays, getYear, addMonths, parseISO, setMonth, setDate, addYears, getMonth as dateFnsGetMonth, getDate as dateFnsGetDate, isBefore, startOfDay, differenceInCalendarDays, isAfter, isSameDay } from 'date-fns';
import { ServiceChargeDemandListClient } from '@/components/finances/ServiceChargeDemandListClient';
import { GroundRentDemandListClient } from '@/components/finances/GroundRentDemandListClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetManagerClient } from '@/components/finances/BudgetManagerClient';
import { ExpenseLogClient } from '@/components/finances/ExpenseLogClient';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ConfirmIssueDemandsDialog } from '@/components/finances/ConfirmIssueDemandsDialog';
import { generateFinancialQuarterOptions } from '@/lib/date-utils'; 
import { Checkbox } from '@/components/ui/checkbox';

const issueScSchema = z.object({
    quarterYear: z.string().refine((val) => {
      try {
        return !isNaN(parseISO(val).getTime());
      } catch {
        return false;
      }
    }, { message: "Please select a valid quarter." }),
});
type IssueScFormValues = z.infer<typeof issueScSchema>;


const VALID_TABS = ['income', 'expenses', 'budget'] as const;
type ValidTabValue = typeof VALID_TABS[number];

const parseFinancialQuarterStartDate = (quarterYearValue: string): Date | null => {
    try {
        const date = parseISO(quarterYearValue);
        return !isNaN(date.getTime()) ? date : null;
    } catch {
        return null;
    }
};


export default function FinancesPage() {
  const { user, loading: authLoading, activeBuildingId } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [globalFinancialSettings, setGlobalFinancialSettings] = React.useState<GlobalFinancialSettings>({
    serviceChargeRatePerSqFt: null,
    paymentDueLeadDays: null,
    financialYearStartDate: new Date(new Date().getFullYear(), 3, 1),
    reserveFundContributionPercentage: null, 
  });
  const [isLoadingGlobalSettings, setIsLoadingGlobalSettings] = React.useState(true);
  const [allDemands, setAllDemands] = React.useState<ServiceChargeDemand[]>([]);
  const [isLoadingDemands, setIsLoadingDemands] = React.useState(true);
  
  const [isScDemandsForQuarterExist, setIsScDemandsForQuarterExist] = React.useState(false);
  const [isGrDemandsForYearExist, setIsGrDemandsForYearExist] = React.useState(false);

  const [demandsRefreshKey, setDemandsRefreshKey] = React.useState(0);
  const [financialSummaryRefreshKey, setFinancialSummaryRefreshKey] = React.useState(0);
  const [scDueDate, setScDueDate] = React.useState<Date | null>(null);
  const [activeTab, setActiveTab] = React.useState<ValidTabValue>('income');

  const [isConfirmIssueDemandsDialogOpen, setIsConfirmIssueDemandsDialogOpen] = React.useState(false);
  const [flatsForConfirmation, setFlatsForConfirmation] = React.useState<FlatWithServiceCharge[]>([]);
  const [selectedQuarterDetailsForDialog, setSelectedQuarterDetailsForDialog] = React.useState<{
    quarterStartDate: Date,
    financialQuarterDisplayString: string,
    dueDate: Date,
    includeGroundRent: boolean;
  } | null>(null);
  
  const [quarterYearOptions, setQuarterYearOptions] = React.useState<FinancialQuarterOption[]>([]);
  
  const fetchSettingsAndDemands = React.useCallback(async (buildingId: string) => {
    setIsLoadingGlobalSettings(true);
    setIsLoadingDemands(true);
    try {
      let fetchedSettingsFromDB: GlobalFinancialSettings | null = null;
      if (user?.role === UserRole.MANAGER) {
          fetchedSettingsFromDB = await fetchGlobalFinancialSettingsFromDB(buildingId);
      }

      const settingsToUse = fetchedSettingsFromDB || {
        serviceChargeRatePerSqFt: null,
        paymentDueLeadDays: null,
        financialYearStartDate: new Date(new Date().getFullYear(), 3, 1),
        reserveFundContributionPercentage: null,
      };
      
      setGlobalFinancialSettings(settingsToUse);
      const today = startOfDay(new Date());
      const generatedScOptions = generateFinancialQuarterOptions(settingsToUse.financialYearStartDate, today, 4, 0);
      
      const fetchedDemands = await getServiceChargeDemands(buildingId);
      setAllDemands(fetchedDemands);

      const actionableScQuarters = generatedScOptions.filter(option => {
        const demandsForOption = fetchedDemands.filter(
          d => d.financialQuarterDisplayString === option.financialQuarterDisplayString && (d.baseAmount ?? 0) > 0
        );
        if (demandsForOption.length === 0) return true;
        return demandsForOption.some(d => d.outstandingAmount > 0);
      });
      setQuarterYearOptions(actionableScQuarters);
      
    } catch (error) {
      console.error("Error loading financial settings or demands:", error);
      toast({ title: "Error", description: "Could not load application financial data.", variant: "destructive"});
       const defaultSettings = {
          serviceChargeRatePerSqFt: null,
          paymentDueLeadDays: null,
          financialYearStartDate: new Date(new Date().getFullYear(), 3, 1),
          reserveFundContributionPercentage: null,
      };
      setGlobalFinancialSettings(defaultSettings);
      const today = startOfDay(new Date());
      setQuarterYearOptions(generateFinancialQuarterOptions(defaultSettings.financialYearStartDate, today, 4, 0));
      setAllDemands([]);
    } finally {
      setIsLoadingGlobalSettings(false);
      setIsLoadingDemands(false);
    }
  }, [toast, user?.role]);
  
  React.useEffect(() => {
    if (activeBuildingId && !authLoading) { 
      fetchSettingsAndDemands(activeBuildingId);
    }
  }, [authLoading, demandsRefreshKey, fetchSettingsAndDemands, activeBuildingId]);


  React.useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as string | null;
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl as ValidTabValue)) {
      setActiveTab(tabFromUrl as ValidTabValue);
    } else {
      if (tabFromUrl && !VALID_TABS.includes(tabFromUrl as ValidTabValue)) {
        router.replace(`/finances?tab=${VALID_TABS[0]}`, { scroll: false });
      }
      setActiveTab(VALID_TABS[0]);
    }
  }, [searchParams, router]);

  const getCurrentScQuarterStartDateString = React.useCallback(() => {
      if (quarterYearOptions.length > 0) {
        const nextUpcomingQuarterOption = quarterYearOptions.find(opt => !opt.isPast);
        return nextUpcomingQuarterOption?.value || quarterYearOptions[0]?.value || format(startOfCalendarQuarter(new Date()), 'yyyy-MM-dd');
      }
      return format(startOfCalendarQuarter(new Date()), 'yyyy-MM-dd');
  }, [quarterYearOptions]);


  const issueScForm = useForm<IssueScFormValues>({
    resolver: zodResolver(issueScSchema),
    defaultValues: { quarterYear: getCurrentScQuarterStartDateString() }
  });

  React.useEffect(() => {
    if (!isLoadingGlobalSettings) {
      issueScForm.reset({ quarterYear: getCurrentScQuarterStartDateString() });
    }
  }, [isLoadingGlobalSettings, getCurrentScQuarterStartDateString, issueScForm]);


  const scQuarterYearValue = issueScForm.watch('quarterYear');
  
  const isQ1Selected = React.useMemo(() => {
    const selectedOption = quarterYearOptions.find(opt => opt.value === scQuarterYearValue);
    return selectedOption?.financialQuarterDisplayString.startsWith('Q1') ?? false;
  }, [scQuarterYearValue, quarterYearOptions]);


  React.useEffect(() => {
    const leadDays = globalFinancialSettings.paymentDueLeadDays;
    if (leadDays !== undefined && leadDays !== null && scQuarterYearValue) {
        const selectedFinancialQuarterStartDate = parseFinancialQuarterStartDate(scQuarterYearValue);
        if (selectedFinancialQuarterStartDate) {
            setScDueDate(subDays(selectedFinancialQuarterStartDate, leadDays));
        } else { setScDueDate(null); }
    } else { setScDueDate(null); }
  }, [scQuarterYearValue, globalFinancialSettings.paymentDueLeadDays]);

  React.useEffect(() => {
    if (scQuarterYearValue && allDemands.length > 0) {
        const selectedOption = quarterYearOptions.find(opt => opt.value === scQuarterYearValue);
        if (selectedOption) {
            const demandsForSelectedQuarter = allDemands.some(
                demand => demand.financialQuarterDisplayString === selectedOption.financialQuarterDisplayString && (demand.baseAmount ?? 0) > 0
            );
            setIsScDemandsForQuarterExist(demandsForSelectedQuarter);
        } else { setIsScDemandsForQuarterExist(false); }
    } else { setIsScDemandsForQuarterExist(false); }
  }, [scQuarterYearValue, allDemands, quarterYearOptions]);


  const prepareAndShowConfirmation = async (
    quarterYearValue: string,
    includeGroundRent: boolean
  ) => {
    if (!user || user.role !== UserRole.MANAGER || !activeBuildingId) {
      toast({ title: "Unauthorized", description: "Only managers can issue demands.", variant: "destructive" });
      return;
    }

    if (!includeGroundRent && (globalFinancialSettings.serviceChargeRatePerSqFt === null || globalFinancialSettings.serviceChargeRatePerSqFt <= 0)) {
      toast({ title: "Rate Config Required", description: "Global service charge rate must be configured (> 0).", variant: "destructive", duration: 7000 });
      return;
    }
    
    if (globalFinancialSettings.paymentDueLeadDays === null) {
      toast({ title: "Due Days Required", description: "Global payment due lead days must be configured.", variant: "destructive", duration: 7000 });
      return;
    }

    const financialQuarterStartDate = parseFinancialQuarterStartDate(quarterYearValue);
    if (!financialQuarterStartDate) {
      toast({ title: "Invalid Period Date", description: "Could not parse selected period start date.", variant: "destructive" });
      return;
    }

    const dueDate = subDays(financialQuarterStartDate, globalFinancialSettings.paymentDueLeadDays);
    const selectedOption = quarterYearOptions.find(opt => opt.value === quarterYearValue);
    
    if (!selectedOption) {
      toast({ title: "Invalid Period", description: "Selected period is not valid.", variant: "destructive" });
      return;
    }
    
    try {
      const allFlats = await getFlats(activeBuildingId);
      const eligibleFlats: FlatWithServiceCharge[] = allFlats
        .filter(flat => {
            const hasScCriteria = flat.areaSqFt && flat.areaSqFt > 0;
            const hasGrCriteria = includeGroundRent && flat.groundRent && flat.groundRent > 0;
            return hasScCriteria || hasGrCriteria;
        })
        .map(flat => ({
            ...flat,
            calculatedServiceCharge: (flat.areaSqFt || 0) * (globalFinancialSettings.serviceChargeRatePerSqFt || 0),
        }));

      if (eligibleFlats.length === 0) {
        toast({ title: "No Eligible Flats", description: "No flats found with valid criteria to generate demands for.", variant: "default" });
        return;
      }

      setFlatsForConfirmation(eligibleFlats);
      setSelectedQuarterDetailsForDialog({
        quarterStartDate: financialQuarterStartDate,
        financialQuarterDisplayString: selectedOption.financialQuarterDisplayString,
        dueDate: dueDate,
        includeGroundRent: includeGroundRent,
      });
      setIsConfirmIssueDemandsDialogOpen(true);
    } catch (error) {
      console.error("Error preparing for demand issuance dialog:", error);
      toast({ title: "Error", description: "Could not prepare data for demand issuance.", variant: "destructive" });
    }
  };

  const handleIssueScDemandsSubmit = async (values: IssueScFormValues) => {
    const demandExists = allDemands.some(d => {
        const option = quarterYearOptions.find(opt => opt.value === values.quarterYear);
        return d.financialQuarterDisplayString === option?.financialQuarterDisplayString && (d.baseAmount ?? 0) > 0;
    });
    
    const shouldIncludeGroundRent = isQ1Selected;

    if (demandExists) {
        const unpaidDemands = allDemands.filter(d => {
            const option = quarterYearOptions.find(opt => opt.value === values.quarterYear);
            return d.financialQuarterDisplayString === option?.financialQuarterDisplayString && d.outstandingAmount > 0;
        });

        if (unpaidDemands.length === 0) {
            toast({ title: "No Outstanding Demands", description: `All demands for this period have been paid.` });
            return;
        }
        console.log(`[Mock Send Reminders] Sending reminders for ${unpaidDemands.length} unpaid demand(s).`);
        toast({ title: "Reminders Sent (Mock)", description: `Mock reminders sent to ${unpaidDemands.length} flat(s) with outstanding payments.`, duration: 8000 });
    } else {
        await prepareAndShowConfirmation(values.quarterYear, shouldIncludeGroundRent);
    }
  };


  const handleConfirmAndIssueDemands = async (selectedFlats: FlatWithServiceCharge[]) => {
    if (!user || user.role !== UserRole.MANAGER || !activeBuildingId || !selectedQuarterDetailsForDialog || globalFinancialSettings.paymentDueLeadDays === null) {
        toast({ title: "Error", description: "Required data for issuing demands is missing.", variant: "destructive" });
        return;
    }
     if (!selectedQuarterDetailsForDialog.includeGroundRent && (!globalFinancialSettings.serviceChargeRatePerSqFt || globalFinancialSettings.serviceChargeRatePerSqFt <= 0)) {
        toast({ title: "Error", description: "Service Charge Rate is missing.", variant: "destructive" });
        return;
    }

    try {
        const input: CreateServiceChargeDemandsInput = {
            buildingId: activeBuildingId,
            flatsToProcess: selectedFlats,
            financialQuarterDisplayString: selectedQuarterDetailsForDialog.financialQuarterDisplayString,
            financialQuarterStartDate: selectedQuarterDetailsForDialog.quarterStartDate,
            serviceChargeRatePerSqFt: globalFinancialSettings.serviceChargeRatePerSqFt || 0,
            paymentDueLeadDays: globalFinancialSettings.paymentDueLeadDays,
            managerUid: user.uid,
            includeGroundRent: selectedQuarterDetailsForDialog.includeGroundRent,
        };

        const result = await generateAndStoreServiceChargeDemands(input);
        toast({
            title: result.success ? "Demands Generation Complete" : "Demand Generation Issue",
            description: `${result.message} (Mock: Notifications sent to ${result.demandsGenerated} flats).`,
            variant: result.success ? "default" : "destructive",
            duration: result.success ? 7000 : 5000,
        });
        if (result.success && result.demandsGenerated > 0) {
            issueScForm.reset({ quarterYear: getCurrentScQuarterStartDateString() });
            setDemandsRefreshKey(prev => prev + 1);
            setFinancialSummaryRefreshKey(prev => prev + 1);
        }
        setIsConfirmIssueDemandsDialogOpen(false);

    } catch (error: any) {
        console.error("Error in handleConfirmAndIssueDemands:", error);
        toast({ title: "Error Issuing Demands", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    }
  };


  const handleTabChange = (newTabValue: string) => {
    const tab = newTabValue as ValidTabValue;
    setActiveTab(tab);
    router.push(`/finances?tab=${tab}`, { scroll: false });
  };

  const triggerFinancialSummaryRefresh = () => {
    setFinancialSummaryRefreshKey(prev => prev + 1);
  };

  if (authLoading || (!activeBuildingId && user?.role === UserRole.MANAGER) || isLoadingGlobalSettings || isLoadingDemands) {
    return (
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            {!activeBuildingId && user?.role === UserRole.MANAGER && (
                <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800">
                    <Info className="h-5 w-5 text-blue-500"/>
                    <AlertTitle className="font-semibold text-blue-900 text-sm">Select a Building</AlertTitle>
                    <AlertDescription className="text-xs text-blue-700/90">Please select a building from the header to manage finances.</AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!activeBuildingId) {
      return null;
  }

  const isGlobalConfigReadyForServiceCharge =
      globalFinancialSettings.serviceChargeRatePerSqFt !== null &&
      globalFinancialSettings.serviceChargeRatePerSqFt > 0 &&
      globalFinancialSettings.paymentDueLeadDays !== null;
  
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center">
            <Banknote className="mr-3 h-8 w-8 text-primary" />
            Financial Management
          </CardTitle>
          <CardDescription>Manage income, expenses, and budgets for the property. Fields marked with an asterisk (<span className="text-destructive">*</span>) are required.</CardDescription>
        </CardHeader>
        <CardContent>
          {user?.role === UserRole.MANAGER && (
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6"> 
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="budget">Budget</TabsTrigger>
              </TabsList>
              
              <TabsContent value="income" className="space-y-8">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Service Charges &amp; Ground Rent</CardTitle>
                    <CardDescription>Issue quarterly service charge demands and track payment status. Annual ground rent is automatically included with Q1 demands.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-accent/30 shadow-md md:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center"><Receipt className="mr-2 h-5 w-5 text-accent" />Issue Demands</CardTitle>
                            </CardHeader>
                            <Form {...issueScForm}>
                                <form onSubmit={issueScForm.handleSubmit(handleIssueScDemandsSubmit)}>
                                    <CardContent className="space-y-6">
                                        {!isGlobalConfigReadyForServiceCharge && (
                                            <Alert variant="destructive" className="bg-warning/10 text-warning-text-on-light-bg border-warning/30">
                                                <AlertTriangle className="h-5 w-5 text-warning"/>
                                                <CardTitle className="text-sm font-semibold text-warning">SC Settings Incomplete</CardTitle>
                                                <CardDescription className="text-xs text-warning-text-on-light-bg/80">Please set a valid global service charge rate and due days in <Link href="/settings" className="underline font-medium hover:text-warning/80">Settings</Link>.</CardDescription>
                                            </Alert>
                                        )}
                                        <FormField control={issueScForm.control} name="quarterYear" render={({ field }) => (
                                            <FormItem><FormLabel>Quarter<span className="text-destructive ml-1">*</span></FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={quarterYearOptions.length === 0 || !isGlobalConfigReadyForServiceCharge}>
                                                <FormControl><SelectTrigger className="relative pl-8"><CalendarLucideIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><SelectValue placeholder="Select quarter" /></SelectTrigger></FormControl>
                                                <SelectContent>{quarterYearOptions.map(option => (<SelectItem key={option.value} value={option.value} className={cn("text-xs", option.isPast && "text-muted-foreground opacity-70")}>{option.label}</SelectItem>))}</SelectContent>
                                            </Select><FormMessage /></FormItem>
                                        )}/>
                                        {isQ1Selected && (
                                            <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800">
                                                <Info className="h-5 w-5 text-blue-500"/>
                                                <AlertTitle className="font-semibold text-blue-900 text-sm">Annual Ground Rent Included</AlertTitle>
                                                <AlertDescription className="text-xs text-blue-700/90">
                                                    For Q1, annual Ground Rent will be automatically added to the demand for all eligible flats.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                        <FormItem>
                                            <FormLabel>Payment Due by</FormLabel>
                                            <Input value={scDueDate ? format(scDueDate, "PPP") : (globalFinancialSettings.paymentDueLeadDays === null ? "Configure in Settings" : "Select quarter")} disabled className="bg-muted/50 cursor-not-allowed"/>
                                        </FormItem>
                                    </CardContent>
                                    <CardFooter><Button type="submit" disabled={!isGlobalConfigReadyForServiceCharge || quarterYearOptions.length === 0} className={cn("bg-accent hover:bg-accent/90 text-accent-foreground", isScDemandsForQuarterExist && "bg-blue-600 hover:bg-blue-700 text-white")}>
                                        {isScDemandsForQuarterExist ? <Send className="mr-2 h-4 w-4"/> : null}
                                        {isScDemandsForQuarterExist ? 'Send Reminders' : 'Issue Demands'}
                                    </Button></CardFooter>
                                </form>
                            </Form>
                        </Card>
                        <Card className="shadow-md md:col-span-2">
                            <CardHeader><CardTitle className="text-lg flex items-center"><FileSpreadsheet className="mr-2 h-5 w-5 text-primary" />Status</CardTitle></CardHeader>
                            <CardContent><ServiceChargeDemandListClient demands={allDemands} quarterOptions={quarterYearOptions} onUpdate={() => fetchSettingsAndDemands(activeBuildingId)} /></CardContent>
                        </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="expenses" className="space-y-6">
                 <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                        <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                        Detailed Expense Log
                    </CardTitle>
                    <CardDescription>Log and track all operational expenses for the property, including automatically generated costs from work orders.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <ExpenseLogClient
                        buildingId={activeBuildingId}
                        key={`expenselog-${financialSummaryRefreshKey}`}
                        onExpensesUpdated={triggerFinancialSummaryRefresh}
                     />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="budget" className="space-y-6">
                 <BudgetManagerClient
                    buildingId={activeBuildingId}
                    key={`budget-manager-${financialSummaryRefreshKey}`} 
                    onBudgetUpdated={triggerFinancialSummaryRefresh}
                />
              </TabsContent>
            </Tabs>
          )}
          {user?.role === UserRole.RESIDENT && (
             <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                 <TabsList className="grid w-full grid-cols-1 mb-6"> 
                    <TabsTrigger value="income">My Service Charges</TabsTrigger>
                 </TabsList>
                 <TabsContent value="income">
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center">
                                <Receipt className="mr-2 h-5 w-5 text-primary" />
                                My Service Charge Demands
                            </CardTitle>
                            <CardDescription>View your issued service charge demands and payment status.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ServiceChargeDemandListClient buildingId={activeBuildingId} demands={allDemands} quarterOptions={quarterYearOptions} onUpdate={() => fetchSettingsAndDemands(activeBuildingId)}/>
                        </CardContent>
                    </Card>
                 </TabsContent>
             </Tabs>
          )}
        </CardContent>
      </Card>
      {selectedQuarterDetailsForDialog && flatsForConfirmation.length > 0 && (
        <ConfirmIssueDemandsDialog
            isOpen={isConfirmIssueDemandsDialogOpen}
            onOpenChange={setIsConfirmIssueDemandsDialogOpen}
            eligibleFlats={flatsForConfirmation}
            quarterDisplayString={selectedQuarterDetailsForDialog.financialQuarterDisplayString}
            dueDate={selectedQuarterDetailsForDialog.dueDate}
            onConfirmIssue={handleConfirmAndIssueDemands}
            serviceChargeRate={globalFinancialSettings.serviceChargeRatePerSqFt || 0}
            includeGroundRent={selectedQuarterDetailsForDialog.includeGroundRent}
        />
      )}
    </div>
  );
}
