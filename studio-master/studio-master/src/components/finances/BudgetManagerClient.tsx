

"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getBudgetCategories, createBudgetCategory, deleteBudgetCategory, getExpenses, getFlats, getGlobalFinancialSettings, getServiceChargeDemands, updateBudgetCategoryForecasts, saveGlobalFinancialSettings, type BudgetCategory, type Expense } from '@/lib/firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Trash2, PlusCircle, Loader2, AlertTriangle, PackageOpen, PiggyBank, Percent, Save, Info, Lock, Unlock, XCircle, Edit2 } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { startOfYear, getYear, format, getMonth, getDate } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { EditBudgetCategoryDialog } from './EditBudgetCategoryDialog';
import { Label } from '../ui/label';
import { getFinancialYearForDate } from '@/lib/date-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const addCategorySchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters." }).max(50),
});
type AddCategoryFormValues = z.infer<typeof addCategorySchema>;

interface BudgetManagerClientProps {
  onBudgetUpdated: () => void;
  buildingId: string;
}

interface AggregatedBudgetData extends BudgetCategory {
    actualSpent: number;
    forecastAmount: number;
    variance: number;
}

export function BudgetManagerClient({ onBudgetUpdated, buildingId }: BudgetManagerClientProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [aggregatedData, setAggregatedData] = React.useState<AggregatedBudgetData[]>([]);
  const [annualIncome, setAnnualIncome] = React.useState(0);
  const [isAddingCategory, setIsAddingCategory] = React.useState(false);
  const [isSavingBudget, setIsSavingBudget] = React.useState(false);
  
  const [reserveFundPercentage, setReserveFundPercentage] = React.useState(0);
  const [isBudgetLocked, setIsBudgetLocked] = React.useState(false);
  const [editableForecasts, setEditableForecasts] = React.useState<Record<string, { percentage: number, amount: number }>>({});
  const [initialForecasts, setInitialForecasts] = React.useState<Record<string, { percentage: number, amount: number }>>({});
  const [initialReserveFundPercentage, setInitialReserveFundPercentage] = React.useState(0);

  const [categoryToEdit, setCategoryToEdit] = React.useState<BudgetCategory | null>(null);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = React.useState(false);
  const [financialYearOptions, setFinancialYearOptions] = React.useState<{value: string, label: string}[]>([]);
  const [selectedFinancialYear, setSelectedFinancialYear] = React.useState<string>("");

  const addCategoryForm = useForm<AddCategoryFormValues>({
    resolver: zodResolver(addCategorySchema),
    defaultValues: { name: '' },
  });

  const fetchBudgetData = React.useCallback(async (fyLabel: string) => {
    if (!buildingId) {
        setIsLoading(false);
        setError("Building information is not available.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const [categories, expenses, flats, settings, demands] = await Promise.all([
            getBudgetCategories(buildingId, fyLabel),
            getExpenses(buildingId),
            getFlats(buildingId),
            getGlobalFinancialSettings(buildingId),
            getServiceChargeDemands(buildingId),
        ]);

        setIsBudgetLocked(settings?.isBudgetLocked || false);
        const fetchedReservePercentage = settings?.reserveFundContributionPercentage || 0;
        setReserveFundPercentage(fetchedReservePercentage);
        setInitialReserveFundPercentage(fetchedReservePercentage);
        
        const totalAreaSqFt = flats.reduce((sum, flat) => sum + (flat.areaSqFt || 0), 0);
        const rate = settings?.serviceChargeRatePerSqFt || 0;
        const calculatedAnnualIncome = totalAreaSqFt * rate * 4;
        setAnnualIncome(calculatedAnnualIncome);
        
        const expensesByCategoryId: Record<string, number> = {};
        expenses.forEach(expense => {
            if (expense.categoryId) {
                expensesByCategoryId[expense.categoryId] = (expensesByCategoryId[expense.categoryId] || 0) + expense.amount;
            }
        });

        const newForecasts: Record<string, { percentage: number, amount: number }> = {};
        const newAggregatedData = categories.map(category => {
            const forecastAmount = calculatedAnnualIncome * ((category.forecastPercentage || 0) / 100);
            newForecasts[category.id] = { 
                percentage: category.forecastPercentage || 0,
                amount: forecastAmount
            };
            const actualSpent = expensesByCategoryId[category.id] || 0;
            return {
                ...category,
                actualSpent,
                forecastAmount,
                variance: forecastAmount - actualSpent,
            };
        });
        
        setEditableForecasts(newForecasts);
        setInitialForecasts(JSON.parse(JSON.stringify(newForecasts))); // Deep copy for initial state
        setAggregatedData(newAggregatedData);

    } catch (err: any) {
        setError(err.message || "Failed to load budget data.");
        toast({ title: "Error", description: "Could not load budget data.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [toast, buildingId]);
  
  React.useEffect(() => {
    const today = new Date();
    const { fyLabel: currentFYLabel } = getFinancialYearForDate(today, null);
    setSelectedFinancialYear(currentFYLabel);

    const yearOptions = [-1, 0, 1, 2].map(offset => {
      const yearDate = new Date(today.getFullYear() + offset, getMonth(today), getDate(today));
      const { fyLabel } = getFinancialYearForDate(yearDate, null);
      return { value: fyLabel, label: fyLabel };
    });
    setFinancialYearOptions([...new Map(yearOptions.map(item => [item['value'], item])).values()]);

  }, []);

  React.useEffect(() => {
    if (selectedFinancialYear && buildingId) {
      fetchBudgetData(selectedFinancialYear);
    }
  }, [selectedFinancialYear, fetchBudgetData, buildingId]);

  const handleAddCategory = async (values: AddCategoryFormValues) => {
    if (!user || !buildingId) return;
    setIsAddingCategory(true);
    try {
        await createBudgetCategory(buildingId, { 
            name: values.name, 
            forecastPercentage: 0,
            financialYear: selectedFinancialYear,
        });
        toast({ title: "Category Added", description: `"${values.name}" has been added to the budget for ${selectedFinancialYear}.` });
        addCategoryForm.reset();
        fetchBudgetData(selectedFinancialYear);
    } catch (err: any) {
        toast({ title: "Error", description: "Could not add category.", variant: "destructive" });
    } finally {
        setIsAddingCategory(false);
    }
  };
  
  const handleEditCategory = (category: BudgetCategory) => {
    setCategoryToEdit(category);
    setIsEditCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!user || !buildingId) return;
    try {
        await deleteBudgetCategory(buildingId, categoryId);
        toast({ title: "Category Archived", description: "The budget category has been archived." });
        fetchBudgetData(selectedFinancialYear);
    } catch (err: any) {
        toast({ title: "Error", description: "Could not archive category. It might be in use by some expenses.", variant: "destructive", duration: 7000 });
    }
  };

  const handleForecastChange = (categoryId: string, value: string, type: 'percentage' | 'amount') => {
    const numValue = parseFloat(value) || 0;
    
    setEditableForecasts(prev => {
        const newForecasts = { ...prev };
        if (type === 'percentage') {
            const newAmount = annualIncome * (numValue / 100);
            newForecasts[categoryId] = { percentage: numValue, amount: newAmount };
        } else { // type is 'amount'
            const newPercentage = annualIncome > 0 ? (numValue / annualIncome) * 100 : 0;
            newForecasts[categoryId] = { percentage: newPercentage, amount: numValue };
        }
        return newForecasts;
    });
};

  const handleSaveForLater = async () => {
    if (!user || !buildingId) return;
    setIsSavingBudget(true);
    try {
        const forecastsToSave = Object.entries(editableForecasts).map(([id, values]) => ({
            id,
            forecastPercentage: values.percentage
        }));
        await updateBudgetCategoryForecasts(buildingId, forecastsToSave);

        const currentSettings = await getGlobalFinancialSettings(buildingId);
        if (currentSettings) {
            await saveGlobalFinancialSettings(buildingId, { ...currentSettings, reserveFundContributionPercentage: reserveFundPercentage }, user.uid);
        }

        setInitialForecasts(JSON.parse(JSON.stringify(editableForecasts))); // Update initial state on save
        setInitialReserveFundPercentage(reserveFundPercentage);
        toast({ title: "Budget Saved", description: "Your forecast changes have been saved for later." });
    } catch(err: any) {
        toast({ title: "Error Saving", description: err.message, variant: "destructive" });
    } finally {
        setIsSavingBudget(false);
    }
  };

  const handleCancelChanges = () => {
    setEditableForecasts(initialForecasts);
    setReserveFundPercentage(initialReserveFundPercentage);
    toast({ title: "Changes Discarded", description: "Your changes have been reverted to the last saved state." });
  };


  const handleToggleBudgetLock = async () => {
    if (!user || !buildingId) return;
    setIsSavingBudget(true);

    const newLockState = !isBudgetLocked;
    
    // Always save latest values when locking/unlocking
    const forecastsToSave = Object.entries(editableForecasts).map(([id, values]) => ({
        id,
        forecastPercentage: values.percentage
    }));
    await updateBudgetCategoryForecasts(buildingId, forecastsToSave);

    const settings = await getGlobalFinancialSettings(buildingId);
    if (settings) {
        await saveGlobalFinancialSettings(buildingId, { ...settings, reserveFundContributionPercentage: reserveFundPercentage, isBudgetLocked: newLockState }, user.uid);
    }
    
    setIsBudgetLocked(newLockState);
    setInitialForecasts(JSON.parse(JSON.stringify(editableForecasts)));
    setInitialReserveFundPercentage(reserveFundPercentage);
    toast({
      title: newLockState ? "Budget Locked" : "Budget Unlocked",
      description: newLockState
        ? "Forecast percentages have been saved and locked for the year."
        : "You can now edit the forecast percentages.",
    });
    fetchBudgetData(selectedFinancialYear); 
    setIsSavingBudget(false);
  };

  const manuallyAllocatedPercentage = Object.values(editableForecasts).reduce((sum, val) => sum + val.percentage, 0);
  const totalAllocatedPercentage = manuallyAllocatedPercentage + reserveFundPercentage;

  const manuallyAllocatedAmount = Object.values(editableForecasts).reduce((sum, val) => sum + val.amount, 0);
  const reserveFundAmount = annualIncome * (reserveFundPercentage / 100);

  const canLockBudget = Math.abs(totalAllocatedPercentage - 100) < 0.001 || Math.abs(manuallyAllocatedAmount + reserveFundAmount - annualIncome) < 0.01;
  const isDirty = JSON.stringify(editableForecasts) !== JSON.stringify(initialForecasts) || reserveFundPercentage !== initialReserveFundPercentage;


  const reserveFundRow = {
    id: 'reserve-fund',
    name: 'Reserve Fund',
    financialYear: selectedFinancialYear,
    buildingId,
    forecastPercentage: reserveFundPercentage,
    actualSpent: reserveFundAmount, 
    forecastAmount: reserveFundAmount,
    variance: 0,
  };

  const totalForecastAmount = manuallyAllocatedAmount + reserveFundAmount;
  const totalActualSpent = aggregatedData.reduce((sum, item) => sum + item.actualSpent, 0) + reserveFundRow.actualSpent;
  const totalVariance = totalForecastAmount - totalActualSpent;

  const allBudgetRows = [reserveFundRow, ...aggregatedData.map(cat => {
    const forecast = editableForecasts[cat.id] || { percentage: 0, amount: 0 };
    return {
        ...cat,
        forecastPercentage: forecast.percentage,
        forecastAmount: forecast.amount,
        variance: forecast.amount - cat.actualSpent,
    };
  })];


  if (isLoading) {
    return <Card><CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>;
  }

  if (error) {
    return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl flex items-center">
              <PiggyBank className="mr-2 h-5 w-5 text-primary" />
              Budget
            </CardTitle>
            <CardDescription>
              Allocate forecasted income to spending categories. Based on total estimated annual income of <span className="font-bold text-foreground">{formatCurrency(annualIncome, false)}</span>.
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
              <div className="w-48">
                <Label htmlFor="financialYearSelect" className="text-xs text-muted-foreground">Financial Year</Label>
                <Select value={selectedFinancialYear} onValueChange={setSelectedFinancialYear}>
                    <SelectTrigger id="financialYearSelect" className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{financialYearOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="w-64">
                <form onSubmit={addCategoryForm.handleSubmit(handleAddCategory)} className="flex items-center gap-2">
                    <div className="flex-grow relative">
                        <Input {...addCategoryForm.register("name")} placeholder="New category name..." disabled={isBudgetLocked || isAddingCategory} className="h-9 text-xs pr-16"/>
                        <Button type="submit" disabled={isAddingCategory || isBudgetLocked} size="xs" className="absolute right-1 top-1/2 -translate-y-1/2 h-7">
                            {isAddingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                        </Button>
                    </div>
                </form>
                {addCategoryForm.formState.errors.name && <p className="text-xs text-destructive mt-1">{addCategoryForm.formState.errors.name.message}</p>}
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
              <div className="w-64 space-y-1.5">
                  <Label htmlFor="reserveFundInput" className="text-sm">Reserve Fund (%)</Label>
                  <div className="relative">
                      <Input
                          id="reserveFundInput"
                          type="number"
                          step="0.1"
                          placeholder="e.g., 10"
                          value={reserveFundPercentage || ''}
                          onChange={(e) => setReserveFundPercentage(parseFloat(e.target.value) || 0)}
                          disabled={isBudgetLocked || isSavingBudget}
                          className="h-9 pr-8 hide-number-arrows"
                      />
                      <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
              </div>
          </div>
          {!canLockBudget && !isBudgetLocked && (
              <Alert variant="destructive" className="text-sm mb-4 p-3">
                  <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-grow flex items-baseline gap-x-2">
                        <AlertTitle className="font-bold">Allocation Incomplete:</AlertTitle>
                        <AlertDescription>
                          Total forecast must be 100% ({totalAllocatedPercentage.toFixed(2)}%) or {formatCurrency(annualIncome)} ({formatCurrency(totalForecastAmount, false)}) to lock.
                        </AlertDescription>
                      </div>
                  </div>
              </Alert>
          )}
          {allBudgetRows.length === 1 && aggregatedData.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/50">
              <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No Budget Categories Yet For {selectedFinancialYear}</p>
              <p className="text-sm text-muted-foreground">Add a category above to start building your budget.</p>
            </div>
          ) : (
            <TooltipProvider>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[30%]">Category</TableHead>
                          <TableHead className="w-[15%] text-right">Forecast (%)</TableHead>
                          <TableHead className="w-[15%] text-right">Forecast (£)</TableHead>
                          <TableHead className="w-[15%] text-right">Actual (£)</TableHead>
                          <TableHead className="w-[15%] text-right">Variance (£)</TableHead>
                          <TableHead className="w-[10%] text-center">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {allBudgetRows.map(item => (
                          <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-right">
                                  {item.id === 'reserve-fund' ? (
                                      <span>{item.forecastPercentage.toFixed(2)}%</span>
                                  ) : (
                                      <Input
                                          type="number"
                                          step="0.01"
                                          value={editableForecasts[item.id]?.percentage || ''}
                                          placeholder=' '
                                          onChange={(e) => handleForecastChange(item.id, e.target.value, 'percentage')}
                                          className="h-8 text-right bg-background disabled:bg-muted/50 disabled:cursor-not-allowed hide-number-arrows"
                                          disabled={isBudgetLocked || isSavingBudget}
                                      />
                                  )}
                              </TableCell>
                              <TableCell className="text-right">
                                  {item.id === 'reserve-fund' ? (
                                      <span>{formatCurrency(item.forecastAmount, false)}</span>
                                  ) : (
                                      <Input
                                          type="number"
                                          step="0.01"
                                          value={editableForecasts[item.id]?.amount || ''}
                                          placeholder=' '
                                          onChange={(e) => handleForecastChange(item.id, e.target.value, 'amount')}
                                          className="h-8 text-right bg-background disabled:bg-muted/50 disabled:cursor-not-allowed hide-number-arrows"
                                          disabled={isBudgetLocked || isSavingBudget}
                                      />
                                  )}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(item.actualSpent, false)}</TableCell>
                              <TableCell className={`text-right font-semibold ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(item.variance, false)}
                              </TableCell>
                              <TableCell className="text-center">
                                  {item.id !== 'reserve-fund' && (
                                    <div className="flex justify-center items-center">
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditCategory(item)} disabled={isBudgetLocked}>
                                          <Edit2 className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteCategory(item.id)} disabled={isBudgetLocked}>
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  )}
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
                  <TableFooter>
                      <TableRow className="hover:bg-transparent">
                          <TableCell>Totals</TableCell>
                          <TableCell className={cn("text-right font-bold", totalAllocatedPercentage !== 100 && "text-destructive")}>{totalAllocatedPercentage.toFixed(2)}%</TableCell>
                          <TableCell className={cn("text-right font-bold", Math.abs(totalForecastAmount - annualIncome) >= 0.01 && "text-destructive")}>{formatCurrency(totalForecastAmount, false)}</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(totalActualSpent, false)}</TableCell>
                          <TableCell className={`text-right font-bold ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(totalVariance, false)}
                          </TableCell>
                          <TableCell></TableCell>
                      </TableRow>
                  </TableFooter>
              </Table>
            </TooltipProvider>
          )}
          <Separator className="my-6" />
          <div className="flex justify-end gap-2">
              <Button onClick={handleCancelChanges} disabled={!isDirty || isSavingBudget || isBudgetLocked} variant="outline">
                  <XCircle className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button onClick={handleSaveForLater} disabled={!isDirty || isSavingBudget || isBudgetLocked}>
                  {isSavingBudget ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save for Later
              </Button>
              <Button onClick={handleToggleBudgetLock} disabled={isSavingBudget || (!isBudgetLocked && !canLockBudget)} className="min-w-[150px]">
                  {isSavingBudget ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isBudgetLocked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />)}
                  {isBudgetLocked ? 'Unlock Budget' : 'Lock Budget'}
              </Button>
          </div>
        </CardContent>
      </Card>
      {categoryToEdit && (
        <EditBudgetCategoryDialog
          isOpen={isEditCategoryDialogOpen}
          onOpenChange={setIsEditCategoryDialogOpen}
          category={categoryToEdit}
          buildingId={buildingId}
          onCategoryUpdated={() => fetchBudgetData(selectedFinancialYear)}
        />
      )}
    </>
  );
}
