
"use client";

import * as React from 'react';
import { getServiceChargeDemands, getAllWorkOrdersUnpaginated, getExpenses, getFlats, getGlobalFinancialSettings } from '@/lib/firebase/firestore';
import type { ServiceChargeDemand, WorkOrder, Expense, Flat, GlobalFinancialSettings, FinancialQuarterOption } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { TrendingDown, Wallet, AlertTriangle, ReceiptText, Target, Activity, Coins, PieChartIcon as PieChartLucideIcon, CalendarClock } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { generateFinancialQuarterOptions } from '@/lib/date-utils';
import { isWithinInterval, parseISO, addMonths, subDays } from 'date-fns';

export function QuarterlyFinancialSummaryWidget() {
  const [quarterlyCollected, setQuarterlyCollected] = React.useState<number>(0);
  const [quarterlyExpenses, setQuarterlyExpenses] = React.useState<number>(0);
  const [quarterlyRemainingCash, setQuarterlyRemainingCash] = React.useState<number>(0);
  const [quarterlyBudget, setQuarterlyBudget] = React.useState<number | null>(null);
  const [currentQuarterString, setCurrentQuarterString] = React.useState<string>("");

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchFinancialData = async () => {
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
          getServiceChargeDemands(),
          getAllWorkOrdersUnpaginated(),
          getExpenses(),
          getFlats(),
          getGlobalFinancialSettings()
        ]);

        let currentQuarter: FinancialQuarterOption | null = null;
        if (globalSettings?.financialYearStartDate) {
            const today = new Date();
            const quarterOptions = generateFinancialQuarterOptions(globalSettings.financialYearStartDate, today, 4, 1);
            
            currentQuarter = quarterOptions.find(opt => {
                const start = parseISO(opt.value);
                const end = subDays(addMonths(start, 3), 1);
                return isWithinInterval(today, { start, end });
            }) || quarterOptions.slice().reverse().find(opt => !opt.isPast) || null;
        }
        
        if (currentQuarter) {
            setCurrentQuarterString(currentQuarter.financialQuarterDisplayString);
            const quarterStartDate = parseISO(currentQuarter.value);
            const quarterEndDate = subDays(addMonths(quarterStartDate, 3), 1);

            const quarterlyDemands = demandsData.filter(d => d.financialQuarterDisplayString === currentQuarter!.financialQuarterDisplayString);
            const collected = quarterlyDemands.reduce((sum, demand) => sum + (demand.amountPaid || 0), 0);
            setQuarterlyCollected(collected);
            
            const workOrderCosts = workOrdersData
                .filter(wo => {
                    if (!wo.createdAt) return false;
                    const woDate = wo.createdAt.toDate();
                    return isWithinInterval(woDate, { start: quarterStartDate, end: quarterEndDate });
                })
                .reduce((sum, wo) => sum + (wo.cost || 0), 0);

            const otherExp = otherExpData
                .filter(exp => {
                    const expDate = exp.date instanceof Date ? exp.date : exp.date.toDate();
                    return isWithinInterval(expDate, { start: quarterStartDate, end: quarterEndDate });
                })
                .reduce((sum, exp) => sum + (exp.amount || 0), 0);
            
            const totalExp = workOrderCosts + otherExp;
            setQuarterlyExpenses(totalExp);
            setQuarterlyRemainingCash(collected - totalExp);

            if (globalSettings?.serviceChargeRatePerSqFt && globalSettings.serviceChargeRatePerSqFt > 0 && flatsData.length > 0) {
                const totalSqFt = flatsData.reduce((sum, flat) => sum + (flat.areaSqFt || 0), 0);
                if (totalSqFt > 0) {
                    setQuarterlyBudget(totalSqFt * globalSettings.serviceChargeRatePerSqFt);
                } else {
                    setQuarterlyBudget(0);
                }
            } else {
                setQuarterlyBudget(null);
            }

        } else {
            setCurrentQuarterString("N/A");
            setQuarterlyBudget(null);
        }

      } catch (err: any) {
        const errorMessage = err.message || "Failed to fetch quarterly financial data.";
        setError(errorMessage);
        toast({
          title: 'Error Fetching Quarterly Data',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchFinancialData();
  }, [toast]); 

  if (isLoading) {
    return (
      <Card className="shadow-md h-full">
        <CardHeader className="pb-3 pt-4">
           <Skeleton className="h-6 w-3/5" /> 
           <Skeleton className="h-4 w-2/5" /> 
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
            <AlertTriangle className="mr-2 h-4 w-4" /> Error Loading Quarterly Data
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          <p className="text-muted-foreground text-xs">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const budgetExists = quarterlyBudget !== null && quarterlyBudget >= 0;
  const collectedVsBudgetPercentage = budgetExists && quarterlyBudget > 0 ? Math.min(100, (quarterlyCollected / quarterlyBudget) * 100) : 0;
  const expensesVsCollectedPercentage = quarterlyCollected > 0 ? Math.min(100, (quarterlyExpenses / quarterlyCollected) * 100) : 0;

  return (
    <Card className="shadow-md h-full">
        <CardHeader className="pb-3 pt-4">
            <CardTitle className="font-headline text-xl flex items-center">
                <CalendarClock className="mr-2 h-5 w-5 text-primary" />
                Quarterly Cash Flow
            </CardTitle>
            <CardDescription className="text-xs">Summary for the current quarter ({currentQuarterString})</CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-2 rounded-md border border-border/50 shadow-sm">
                {budgetExists ? (
                <>
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                            <Target className="h-4 w-4 mr-1.5 text-indigo-500" />
                            <span className="text-xs font-medium text-foreground">Budget</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-xs font-medium text-foreground mr-1.5">Collected</span>
                            <Coins className="h-4 w-4 mr-1.5 text-green-600" />
                        </div>
                    </div>
                     <div className="text-xs text-muted-foreground flex justify-between px-0.5">
                        <span>{formatCurrency(quarterlyBudget)}</span>
                        <span>{formatCurrency(quarterlyCollected)}</span>
                    </div>
                    <div className={cn("relative h-3 w-full overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-800/30")}>
                    <div
                        className={cn("absolute h-full rounded-full bg-green-500")}
                        style={{ width: `${collectedVsBudgetPercentage}%` }}
                    />
                    </div>
                     <p className="text-xs text-muted-foreground/90 pt-1 text-center">
                        Uncollected: <span className={cn("font-semibold", (quarterlyBudget - quarterlyCollected) >= 0 ? "text-indigo-600" : "text-orange-500")}>
                            {formatCurrency(quarterlyBudget - quarterlyCollected)}
                        </span>
                    </p>
                </>
                ) : (
                <div className="flex items-center h-full py-4">
                    <Target className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Quarterly budget not available.</span>
                </div>
                )}
            </div>

            <div className="space-y-2 p-2 rounded-md border border-border/50 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                    <TrendingDown className="h-4 w-4 mr-1.5 text-red-500" />
                    <span className="text-xs font-medium text-foreground">Expenses</span>
                    </div>
                    <div className="flex items-center">
                        <span className="text-xs font-medium text-foreground mr-1.5">Income</span>
                        <Activity className="h-4 w-4 mr-1.5 text-green-600" />
                    </div>
                </div>
                
                <div className="text-xs text-muted-foreground flex justify-between px-0.5">
                    <span>{formatCurrency(quarterlyExpenses)}</span>
                    <span>{formatCurrency(quarterlyCollected)}</span>
                </div>
                <div className={cn("relative h-3 w-full overflow-hidden rounded-full bg-green-100 dark:bg-green-800/30")}>
                    <div
                    className={cn("absolute h-full rounded-full bg-red-500")}
                    style={{ width: `${expensesVsCollectedPercentage}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground/90 pt-1 text-center">
                    Net Cash: <span className={cn("font-semibold", quarterlyRemainingCash >= 0 ? "text-green-600" : "text-red-600")}>
                    {formatCurrency(quarterlyRemainingCash)}
                    </span>
                </p>
            </div>
            </div>
        </CardContent>
    </Card>
  );
}
