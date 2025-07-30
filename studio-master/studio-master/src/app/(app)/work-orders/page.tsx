
"use client"; 

import * as React from 'react';
import { WorkOrderListClient } from '@/components/work-orders/WorkOrderListClient';
import { AllWorkOrdersClient, type TabValue, tabDisplayNames } from '@/components/admin/AllWorkOrdersClient'; // Import TabValue and tabDisplayNames
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, AlertTriangle, Loader2, ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, type WorkOrderStatus, WorkOrderStatus as WorkOrderStatusEnum } from '@/types'; 
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

// TabValue and tabDisplayNames are now imported from AllWorkOrdersClient

export default function WorkOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const statusFilterFromUrl = searchParams.get('status') as WorkOrderStatus | null;
  const tabFromUrl = searchParams.get('tab') as string | null;

  if (authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-full" /> 
        <Skeleton className="h-32 w-full" /> 
        <Skeleton className="h-10 w-1/4 mt-4" /> 
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <AlertTriangle className="w-16 h-16 text-destructive" />
        <h2 className="text-2xl font-semibold mt-4">Authentication Required</h2>
        <p className="text-muted-foreground mt-2">Please log in to view tickets.</p>
        <Button asChild className="mt-4">
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }
  
  if (user.role === undefined && !authLoading) { 
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <h2 className="text-2xl font-semibold mt-4">Loading User Profile...</h2>
        <p className="text-muted-foreground mt-2">Please wait while we fetch your details.</p>
      </div>
    );
  }


  const isManager = user.role === UserRole.MANAGER;
  
  let titleText = isManager ? 'Ticket Management' : 'My Tickets';
  // The titleText will no longer change dynamically based on tab for managers


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4 pt-6">
          <div>
            <CardTitle className="font-headline text-3xl flex items-center">
              <ClipboardList className="mr-3 h-8 w-8 text-primary" />
              {titleText}
            </CardTitle>
            <CardDescription>
              {isManager
                ? 'View, manage, and update tickets. Use tabs to filter by category.'
                : 'View and manage your submitted tickets.'}
            </CardDescription>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/work-orders/new">
              <PlusCircle className="mr-2 h-5 w-5" />
              New Ticket
            </Link>
          </Button>
        </CardHeader>
        
        <CardContent>
          {isManager ? <AllWorkOrdersClient /> : <WorkOrderListClient />}
        </CardContent>
      </Card>
    </div>
  );
}
