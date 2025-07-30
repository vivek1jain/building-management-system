
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, UserCog, Users, Construction, CheckSquare } from 'lucide-react';
import { getWorkOrderCountsByStatus, getWorkOrderCountsByStatusForUser, type WorkOrderStats } from '@/lib/firebase/firestore';
import { UserRole, WorkOrderStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface StatCardProps {
  value: string | number;
  icon: React.ElementType;
  href?: string;
  className?: string;
  iconClassName?: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, icon: Icon, href, className, iconClassName }) => {
  const content = (
    <Card className={cn("shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full", className)}>
      <CardContent className="p-0 flex-grow flex items-center justify-center">
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="block h-full">{content}</Link> : <div className="h-full">{content}</div>;
};

interface WorkOrderStatsWidgetProps {
  userId?: string;
  basePath?: string;
}

interface CategorizedStat {
  id: string;
  title: string;
  icon: React.ElementType;
  iconClassName: string;
  value: number;
  href?: string;
  statuses: WorkOrderStatus[];
}

export function WorkOrderStatsWidget({ userId, basePath }: WorkOrderStatsWidgetProps) {
  const [categorizedStats, setCategorizedStats] = React.useState<CategorizedStat[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading, activeBuildingId } = useAuth();

  const getHrefForCategory = (categoryTitle: string): string | undefined => {
    if (!basePath || !user || user.role !== UserRole.MANAGER) return undefined;
    
    switch (categoryTitle) {
        case "Triage":
            return `${basePath}?tab=triage`;
        case "User Action":
            return `${basePath}?tab=userInput`;
        case "Supplier Action":
            return `${basePath}?tab=supplierTasks`;
        case "Closed": 
            return `${basePath}?tab=archivedComplete`;
        default:
            return `${basePath}?tab=all`; 
    }
  };


  React.useEffect(() => {
    const fetchStats = async () => {
      if (!user || !activeBuildingId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      let fetchedIndividualStats: WorkOrderStats | null = null;
      try {
        if (userId) {
          fetchedIndividualStats = await getWorkOrderCountsByStatusForUser(activeBuildingId, userId);
        } else if (user.role === UserRole.MANAGER) {
          fetchedIndividualStats = await getWorkOrderCountsByStatus(activeBuildingId);
        } else {
          setIsLoading(false);
          return;
        }

        const initialCategories: Omit<CategorizedStat, 'value' | 'href'>[] = [
          { id: 'triage', title: 'Triage', icon: UserCog, iconClassName: "text-orange-500", statuses: [WorkOrderStatus.TRIAGE] },
          { id: 'userInput', title: 'User Action', icon: Users, iconClassName: "text-pink-500", statuses: [WorkOrderStatus.AWAITING_USER_FEEDBACK] },
          { id: 'supplierTasks', title: 'Supplier Action', icon: Construction, iconClassName: "text-purple-500", statuses: [WorkOrderStatus.QUOTING, WorkOrderStatus.SCHEDULED] },
          { id: 'archivedComplete', title: 'Closed', icon: CheckSquare, iconClassName: "text-gray-500", statuses: [WorkOrderStatus.RESOLVED, WorkOrderStatus.CLOSED, WorkOrderStatus.CANCELLED] }, 
        ];

        if (fetchedIndividualStats) {
            const newCategorizedStats = initialCategories.map(category => {
                const value = category.statuses.reduce((sum, status) => sum + (fetchedIndividualStats![status as keyof WorkOrderStats] ?? 0), 0);
                return {
                    ...category,
                    value,
                    href: getHrefForCategory(category.title),
                };
            });
            setCategorizedStats(newCategorizedStats);
        } else {
            setCategorizedStats(initialCategories.map(c => ({...c, value: 0, href: getHrefForCategory(c.title) })));
        }

      } catch (err: any) {
        const errorMessage = err.message || "Failed to load statistics.";
        setError(errorMessage);
        console.error("WorkOrderStatsWidget Error:", err);
        toast({
          title: "Error Loading Stats",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && activeBuildingId) {
        if (userId || (user && user.role === UserRole.MANAGER)) {
            fetchStats();
        } else {
            setIsLoading(false);
        }
    }
  }, [toast, user, authLoading, userId, basePath, activeBuildingId]);


  if (isLoading || (authLoading && categorizedStats.length === 0)) {
    return (
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if ((userId || (user && user.role === UserRole.MANAGER)) && error && !isLoading) {
    return (
      <div className="border-destructive border p-4 rounded-md">
        <h3 className="font-headline text-lg flex items-center text-destructive">
          <AlertTriangle className="mr-2 h-5 w-5" /> Error Loading Statistics
        </h3>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }
  
  if ((userId || (user && user.role === UserRole.MANAGER)) && categorizedStats.every(c => c.value === 0) && !isLoading) {
     return (
       <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No work order data available to display stats.
            </p>
        </div>
    );
  }

  if (!userId && (!user || user.role !== UserRole.MANAGER) && !isLoading) {
    return null;
  }

  return (
    <div className="grid gap-x-3 gap-y-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
      {categorizedStats.map((category) => (
        <div key={category.id} className="flex flex-col items-center">
          <Label className="text-sm font-medium text-muted-foreground mb-1.5">{category.title}</Label>
          <div className="w-full h-16">
            <StatCard
              value={category.value}
              icon={category.icon}
              iconClassName={category.iconClassName}
              href={category.href}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
