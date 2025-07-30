
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { BellRing, PackageOpen, Info, AlertTriangle as AlertTriangleIcon, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, type Reminder, ReminderSeverity, ReminderPriority } from '@/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getRemindersForUser, dismissReminder } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';


const severityIcons: Record<ReminderSeverity, React.ElementType> = {
  [ReminderSeverity.INFO]: Info,
  [ReminderSeverity.WARNING]: AlertTriangleIcon,
  [ReminderSeverity.DESTRUCTIVE]: AlertTriangleIcon,
};

const severityStyles: Record<ReminderSeverity, string> = {
  [ReminderSeverity.INFO]: "bg-blue-50 border-blue-200 text-blue-800",
  [ReminderSeverity.WARNING]: "bg-yellow-50 border-yellow-300 text-yellow-800",
  [ReminderSeverity.DESTRUCTIVE]: "", // uses default destructive variant
};


export function AlertsWidget() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeAlerts, setActiveAlerts] = React.useState<Reminder[]>([]);
  
  const fetchReminders = React.useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
        const reminders = await getRemindersForUser(userId);
        const highPriorityReminders = reminders.filter(r => r.priority === ReminderPriority.HIGH);
        setActiveAlerts(highPriorityReminders);
    } catch (error) {
        console.error("Failed to fetch reminders:", error);
        toast({ title: "Error", description: "Could not load reminders.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (user && !authLoading) {
      fetchReminders(user.uid);
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading, fetchReminders]);

  const handleDismiss = async (reminderId: string) => {
    if (!user) return;
    try {
        setActiveAlerts(prev => prev.filter(r => r.id !== reminderId));
        await dismissReminder(reminderId, user.uid);
    } catch (error) {
        console.error(`Failed to dismiss reminder ${reminderId}:`, error);
        toast({ title: "Error", description: "Could not dismiss reminder. It may reappear.", variant: "destructive"});
        fetchReminders(user.uid);
    }
  }


  if (authLoading || (isLoading && activeAlerts.length === 0)) {
    return (
      <Card className="shadow-md h-full"> {/* Added h-full */}
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="font-headline text-lg md:text-xl flex items-center"> {/* Mobile: text-lg */}
            <Skeleton className="h-5 w-5 mr-2 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <CardDescription className="text-xs"><Skeleton className="h-4 w-64" /></CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  // No need for a separate check for user role here, as reminders are user-specific.

  if (activeAlerts.length === 0) {
    return (
       <Card className="shadow-md h-full"> {/* Added h-full */}
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="font-headline text-lg md:text-xl flex items-center"> {/* Mobile: text-lg */}
            <BellRing className="mr-2 h-5 w-5 text-primary" />
            Important Reminders
          </CardTitle>
          <CardDescription className="text-xs">Notifications and tasks needing your attention.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-4 text-center">
            <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground/70 mt-4 mb-3" />
            <p className="text-sm text-muted-foreground">No urgent alerts at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md h-full"> {/* Added h-full */}
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="font-headline text-lg md:text-xl flex items-center"> {/* Mobile: text-lg */}
          <BellRing className="mr-2 h-5 w-5 text-primary" />
          Important Reminders
        </CardTitle>
        <CardDescription className="text-xs">Notifications and tasks needing your attention.</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 pb-4 space-y-3">
        {activeAlerts.map(alert => {
          const Icon = severityIcons[alert.severity];
          return (
          <Alert key={alert.id} variant={alert.severity} className={cn(severityStyles[alert.severity], 'pr-9')}>
            <Icon className="h-5 w-5" />
            <AlertTitle className="font-semibold text-sm">{alert.title}</AlertTitle>
            <AlertDescription className="text-xs">
              {alert.description}
              {alert.link && (
                <Button variant="link" asChild className="p-0 h-auto font-medium text-xs block mt-1">
                    <Link href={alert.link}>
                        View Details &rarr;
                    </Link>
                </Button>
              )}
            </AlertDescription>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-1.5 right-1.5 h-6 w-6"
                onClick={() => handleDismiss(alert.id)}
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss reminder</span>
            </Button>
          </Alert>
        )})}
      </CardContent>
    </Card>
  );
}
