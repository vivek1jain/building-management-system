
"use client";

import * as React from 'react';
import { getServiceChargeDemands, getAllWorkOrdersUnpaginated, getExpenses, getFlats, getGlobalFinancialSettings } from '@/lib/firebase/firestore';
import type { ServiceChargeDemand, WorkOrder, Expense, Flat, GlobalFinancialSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { TrendingDown, Wallet, AlertTriangle, ReceiptText, Target, Activity, Coins, PieChartIcon as PieChartLucideIcon } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { getYear, getMonth, getDate, differenceInMonths } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface QuarterData {
  quarter: number;
  isPast: boolean;
  isCurrent: boolean;
  collectedInQuarter: number;
  budgetForQuarter: number;
  fillPercentage: number;
}


export function FinancialSummaryWidget() {
  const { user, loading: authLoading, activeBuildingId } = useAuth();
  const [totalCollected, setTotalCollected] = React.useState<number>(0);
  const [grandTotalExpenses, setGrandTotalExpenses] = React.useState<number>(0);
  const [remainingCash, setRemainingCash] = React.useState<number>(0);
  const [annualBudget, setAnnualBudget] = React.useState<number | null>(null);
  const [quarterlyData, setQuarterlyData] = React.useState<QuarterData[]>([]);


  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (authLoading || !activeBuildingId) {
        setIsLoading(false);
        return;
    }

    const fetchFinancialData = async (buildingId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const [
          demandsData, 
          workOrdersData, 
          otherExpData, 
          flatsData, 
          globalSettings
        ] = await Promise.all([
          getServiceChargeDemands(buildingId),
          getAllWorkOrdersUnpaginated(buildingId),
          getExpenses(buildingId),
          getFlats(buildingId),
          getGlobalFinancialSettings(buildingId)
        ]);

        const collected = demandsData.reduce((sum, demand) => sum + (demand.amountPaid || 0), 0);
        setTotalCollected(collected);

        const workOrderCosts = workOrdersData.reduce((sum, wo) => sum + (wo.cost || 0), 0);
        const otherExp = otherExpData.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        const totalExp = workOrderCosts + otherExp;
        setGrandTotalExpenses(totalExp);
        setRemainingCash(collected - totalExp);
        
        // --- Start of New Quarterly Logic ---
        if (globalSettings?.serviceChargeRatePerSqFt && globalSettings.serviceChargeRatePerSqFt > 0 && flatsData.length > 0) {
            const totalSqFt = flatsData.reduce((sum, flat) => sum + (flat.areaSqFt || 0), 0);
            const quarterlyBudget = totalSqFt * globalSettings.serviceChargeRatePerSqFt;
            const calculatedAnnualBudget = quarterlyBudget * 4;
            setAnnualBudget(calculatedAnnualBudget);

            // Determine current financial quarter
            const today = new Date();
            const fyStartDateSetting = globalSettings.financialYearStartDate || new Date(today.getFullYear(), 0, 1);
            
            let currentFYStartYear = getYear(today);
            let fyStartDateForToday = new Date(currentFYStartYear, getMonth(fyStartDateSetting), getDate(fyStartDateSetting));
            
            if (today < fyStartDateForToday) {
                fyStartDateForToday = new Date(currentFYStartYear - 1, getMonth(fyStartDateSetting), getDate(fyStartDateSetting));
            }
            const monthsIntoFY = differenceInMonths(today, fyStartDateForToday);
            const currentQuarterIndex = Math.floor(monthsIntoFY / 3);

            const allQuarters: QuarterData[] = [];
            const demandsByQuarter: Record<string, number> = {};

            demandsData.forEach(demand => {
                const quarterKey = demand.financialQuarterDisplayString;
                demandsByQuarter[quarterKey] = (demandsByQuarter[quarterKey] || 0) + (demand.amountPaid || 0);
            });

            for (let i = 0; i < 4; i++) {
                const fyStartYear = getYear(fyStartDateForToday);
                const fyEndYear = getYear(new Date(fyStartYear, getMonth(fyStartDateSetting) + 11, getDate(fyStartDateSetting)));
                const fyLabel = `FY ${String(fyStartYear).slice(-2)}/${String(fyEndYear).slice(-2)}`;
                const quarterKey = `Q${i + 1} ${fyLabel}`;

                const collectedInQuarter = demandsByQuarter[quarterKey] || 0;
                
                allQuarters.push({
                    quarter: i + 1,
                    isPast: i < currentQuarterIndex,
                    isCurrent: i === currentQuarterIndex,
                    collectedInQuarter: collectedInQuarter,
                    budgetForQuarter: quarterlyBudget,
                    fillPercentage: quarterlyBudget > 0 ? (collectedInQuarter / quarterlyBudget) * 100 : 0,
                });
            }
             setQuarterlyData(allQuarters);
        } else {
            setAnnualBudget(null);
            setQuarterlyData([]);
        }
        // --- End of New Quarterly Logic ---
        
      } catch (err: any) {
        const errorMessage = err.message || "Failed to fetch financial summary data.";
        setError(errorMessage);
        toast({
          title: 'Error Fetching Financial Data',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchFinancialData(activeBuildingId);
  }, [toast, user, authLoading, activeBuildingId]); 

  if (isLoading) {
    return (
      <Card className="shadow-md h-full">
        <CardHeader className="flex flex-row items-start justify-between pb-3 pt-4">
           <Skeleton className="h-6 w-3/5" /> 
        </CardHeader>
        <CardContent className="pt-2 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-2 p-2 rounded-md border border-border/50 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Skeleton className="h-4 w-4 mr-1.5 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex items-center">
                        <Skeleton className="h-4 w-16 mr-1.5" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </div>
                </div>
                <div className="text-xs text-muted-foreground flex justify-between px-0.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-14" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
                <div className="text-xs text-muted-foreground/90 pt-1 text-center">
                    <Skeleton className="h-3 w-28 mx-auto" />
                </div>
            </div>
            ))}
        </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive col-span-2 h-full">
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-destructive flex items-center text-sm font-headline">
            <AlertTriangle className="mr-2 h-4 w-4" /> Error Loading Financial Data
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          <p className="text-muted-foreground text-xs">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const budgetExists = annualBudget !== null && annualBudget >= 0;
  const expensesVsCollectedPercentage = totalCollected > 0 ? Math.min(100, (grandTotalExpenses / totalCollected) * 100) : 0;

  return (
    <Card className="shadow-md h-full">
        <CardHeader className="flex flex-row items-start justify-between pb-3 pt-4">
            <CardTitle className="font-headline text-xl flex items-center">
                <Wallet className="mr-2 h-5 w-5 text-primary" />
                Cash Flow
            </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-2 rounded-md border border-border/50 shadow-sm">
                {budgetExists ? (
                <>
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                            <Target className="h-4 w-4 mr-1.5 text-indigo-500" />
                            <span className="text-xs font-medium text-foreground">Annual Budget</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-xs font-medium text-foreground mr-1.5">Collected</span>
                            <Coins className="h-4 w-4 mr-1.5 text-green-600" />
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between px-0.5">
                        <span>{formatCurrency(annualBudget)}</span>
                        <span>{formatCurrency(totalCollected)}</span>
                    </div>
                    <div className="flex w-full h-3 rounded-full bg-indigo-100 dark:bg-indigo-800/30 overflow-hidden">
                      {quarterlyData.map((q, index) => (
                        <div key={index} className="w-1/4 h-full" style={{ backgroundColor: q.isCurrent || q.isPast ? '' : 'hsl(var(--muted))' }}>
                          <div className={cn("h-full", q.isPast && "bg-green-500", q.isCurrent && "bg-green-200 dark:bg-green-900")}>
                            {q.isCurrent && (
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${Math.min(100, q.fillPercentage)}%` }}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground/90 pt-1 text-center">
                        Uncollected: <span className={cn("font-semibold", (annualBudget - totalCollected) >= 0 ? "text-indigo-600" : "text-orange-500")}>
                            {formatCurrency(annualBudget - totalCollected)}
                        </span>
                    </p>
                </>
                ) : (
                <div className="flex items-center h-full py-4">
                    <Target className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Annual budget not available.</span>
                </div>
                )}
            </div>

            <div className="space-y-2 p-2 rounded-md border border-border/50 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                        <TrendingDown className="h-4 w-4 mr-1.5 text-red-500" />
                        <span className="text-xs font-medium text-foreground">Total Expenses</span>
                    </div>
                    <div className="flex items-center">
                        <span className="text-xs font-medium text-foreground mr-1.5">Total Income</span>
                        <Activity className="h-4 w-4 mr-1.5 text-green-600" />
                    </div>
                </div>
                
                <div className="text-xs text-muted-foreground flex justify-between px-0.5">
                    <span>{formatCurrency(grandTotalExpenses)}</span>
                    <span>{formatCurrency(totalCollected)}</span>
                </div>
                <div className={cn("relative h-3 w-full overflow-hidden rounded-full bg-green-100 dark:bg-green-800/30")}>
                    <div
                    className={cn("absolute h-full rounded-full bg-red-500")}
                    style={{ width: `${expensesVsCollectedPercentage}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground/90 pt-1 text-center">
                    Net Cash: <span className={cn("font-semibold", remainingCash >= 0 ? "text-green-600" : "text-red-600")}>
                    {formatCurrency(remainingCash)}
                    </span>
                </p>
            </div>
            </div>
        </CardContent>
    </Card>
  );
}
