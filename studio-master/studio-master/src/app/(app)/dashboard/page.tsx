
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Settings, AlertTriangle, UserPlus, Building, ReceiptText, PieChartIcon as PieChartLucideIcon, CreditCard, Activity, ClipboardList, Archive, Wrench, Target, PiggyBank, LayoutGrid, PackageSearch, Grid, CalendarDays, PlusCircle, Home } from 'lucide-react'; // Added Wrench, Home, PlusCircle
import { QuickActionTile } from '@/components/dashboard/QuickActionTile';
import { UpcomingEventsWidget } from '@/components/dashboard/UpcomingEventsWidget';
import { SelectedDayEventsWidget } from '@/components/dashboard/SelectedDayEventsWidget';
import { AddEventDialog } from '@/components/dashboard/AddEventDialog';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { UserRole, type ScheduledEvent } from '@/types';
import { getScheduledEventsForPeriod } from '@/lib/firebase/firestore';
import { startOfMonth, endOfMonth, parseISO, isSameDay, startOfTomorrow, endOfDay } from 'date-fns';
import { WorkOrderStatsWidget } from '@/components/admin/WorkOrderStatsWidget';
import { FinancialSummaryWidget } from '@/components/finances/FinancialSummaryWidget';
import { AlertsWidget } from '@/components/dashboard/AlertsWidget';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"; 
import { ScrollArea } from '@/components/ui/scroll-area'; 
import { useRouter } from 'next/navigation'; 


export default function DashboardPage() {
  const { user, loading: authLoading, activeBuildingId } = useAuth();
  const router = useRouter(); 

  const [currentMonth, setCurrentMonth] = React.useState<Date | null>(null);
  const [events, setEvents] = React.useState<ScheduledEvent[]>([]);
  const [clickedDate, setClickedDate] = React.useState<Date | undefined>(undefined);
  const [selectedDateEvents, setSelectedDateEvents] = React.useState<ScheduledEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState<ScheduledEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = React.useState(false);
  const [eventsError, setEventsError] = React.useState<string | null>(null);

  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = React.useState(false);
  const [dialogDefaultDate, setDialogDefaultDate] = React.useState<Date | undefined>(undefined);
  const [eventBeingEdited, setEventBeingEdited] = React.useState<ScheduledEvent | null>(null);
  const [isInviteUserDialogOpen, setIsInviteUserDialogOpen] = React.useState(false);
  const [isQuickActionsSheetOpen, setIsQuickActionsSheetOpen] = React.useState(false); 

  const [isClientReady, setIsClientReady] = React.useState(false);

  React.useEffect(() => {
    const now = new Date();
    setCurrentMonth(now);
    setClickedDate(now);
    setIsClientReady(true);
  }, []);


  const fetchEvents = React.useCallback(async (monthToFetch: Date) => {
    if (!user || !activeBuildingId) {
        return;
    }
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const monthStart = startOfMonth(monthToFetch);
      const monthEnd = endOfMonth(monthToFetch);
      const fetchedEvents = await getScheduledEventsForPeriod(activeBuildingId, monthStart, monthEnd, user.uid);
      
      const parsedEvents = fetchedEvents.map(event => ({
        ...event,
        start: event.start instanceof Date ? event.start : (event.start as any).toDate(),
        end: event.end instanceof Date ? event.end : (event.end as any).toDate(),
      }));
      setEvents(parsedEvents);
    } catch (err: any) {
      setEventsError(err.message || "Failed to load scheduled events.");
      console.error("[Dashboard] Error fetching events:", err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [user, activeBuildingId]);

  React.useEffect(() => {
    if (user && !authLoading && currentMonth && isClientReady && activeBuildingId) {
      fetchEvents(currentMonth);
    }
  }, [currentMonth, fetchEvents, user, authLoading, isClientReady, activeBuildingId]);

  React.useEffect(() => {
    if (!events || !isClientReady) return;

    if (clickedDate) {
      const filteredSelectedDateEvents = events
        .filter(event => isSameDay(event.start, clickedDate))
        .sort((a, b) => (eventBeingEdited && a.id === eventBeingEdited.id ? -1 : eventBeingEdited && b.id === eventBeingEdited.id ? 1 : 0) || a.start.getTime() - b.start.getTime());
      setSelectedDateEvents(filteredSelectedDateEvents);
    } else {
      setSelectedDateEvents([]);
    }

    if (currentMonth) {
        const tomorrow = startOfTomorrow();
        const endOfViewMonth = endOfDay(endOfMonth(currentMonth));
        
        const filteredFutureEvents = events
          .filter(event => event.start >= tomorrow && event.start <= endOfViewMonth)
          .sort((a, b) => a.start.getTime() - b.start.getTime());
        setUpcomingEvents(filteredFutureEvents.slice(0, 10)); 
    } else {
        setUpcomingEvents([]);
    }

  }, [events, clickedDate, eventBeingEdited, currentMonth, isClientReady]);
  
  const handleEventListItemClick = (event: ScheduledEvent) => {
    if (user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN) {
      setEventBeingEdited(event);
      setDialogDefaultDate(undefined); 
      setIsAddEventDialogOpen(true);
    }
  };
  
  const handleOpenNewEventDialog = () => {
    setEventBeingEdited(null);
    setDialogDefaultDate(isClientReady && clickedDate ? clickedDate : new Date());
    setIsAddEventDialogOpen(true);
  };

  const handleOpenInviteUserDialog = () => {
    setIsInviteUserDialogOpen(true);
  };


  if (authLoading || !isClientReady) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Dashboard loading...</p>
        </div>
    );
  }
  
  if (!user) {
    return (
        <div className="flex justify-center items-center h-64">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="ml-4 text-destructive">Error: User data not found. Please try logging in again.</p>
        </div>
    );
  }

  const isManagerOrAdmin = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;

  const managerAdminQuickCreateActions = [
    { href: "/work-orders/new", icon: ClipboardList, label: "New Ticket" },
    { href: "/assets/new", icon: Archive, label: "Asset" },
    { href: "/suppliers/new", icon: Wrench, label: "Supplier" }, // Changed Briefcase to Wrench
    { href: "/flats/new", icon: Home, label: "Flat" }, // Changed Building to Home
    { onClick: handleOpenInviteUserDialog, icon: UserPlus, label: "Person" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  const residentQuickCreateActions = [
    { href: "/work-orders/new", icon: ClipboardList, label: "New Ticket" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];
  
  const quickCreateActions = isManagerOrAdmin ? managerAdminQuickCreateActions : residentQuickCreateActions;
  const userIdForStats = user.role === UserRole.RESIDENT ? user.uid : undefined;


  return (
    <div className="space-y-4">
      <h1 className="font-headline text-2xl md:text-3xl text-foreground">
        Welcome, {user.displayName || user.email}!
      </h1>
      
      {isManagerOrAdmin ? (
        <>
          <div className="flex flex-row gap-4 md:hidden items-stretch"> 
            <div className="w-1/2">{<AlertsWidget />}</div>
            <div className="w-1/2">
              <Card className="shadow-md h-full">
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="font-headline text-lg flex items-center"> 
                    <PieChartLucideIcon className="mr-2 h-5 w-5 text-primary" />
                    Ticketing
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col justify-center grid grid-cols-2 gap-3"> 
                  <WorkOrderStatsWidget userId={userIdForStats} basePath={"/work-orders"} />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="grid grid-cols-1 gap-4">
              <AlertsWidget />
            </div>
          </div>
          <div className="hidden md:grid md:grid-cols-2 md:gap-4 md:items-stretch">
            <div> 
              <Card className="shadow-md h-full">
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="font-headline text-xl flex items-center">
                    <PieChartLucideIcon className="mr-2 h-5 w-5 text-primary" />
                    Ticketing
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col justify-center">
                  <WorkOrderStatsWidget userId={userIdForStats} basePath={"/work-orders"} />
                </CardContent>
              </Card>
            </div>
            <FinancialSummaryWidget />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 items-stretch">
          <Card className="shadow-md">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="font-headline text-lg md:text-xl flex items-center"> 
                <PieChartLucideIcon className="mr-2 h-5 w-5 text-primary" />
                Ticketing
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-grow flex flex-col justify-center">
              <WorkOrderStatsWidget userId={userIdForStats} basePath={"/work-orders"} />
            </CardContent>
          </Card>
        </div>
      )}

      
      <div className="block md:hidden fixed bottom-4 right-4 z-40">
        <Sheet open={isQuickActionsSheetOpen} onOpenChange={setIsQuickActionsSheetOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="h-7 w-7" />
              <span className="sr-only">Quick Actions</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[auto] max-h-[70vh] rounded-t-xl p-0 bg-background">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="font-headline text-lg">Quick Actions</SheetTitle>
              <SheetDescription className="text-xs">Quickly create new items.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="max-h-[calc(70vh-120px)]">
              <div className="p-4 grid grid-cols-2 gap-3">
                {quickCreateActions.map(action => (
                  <QuickActionTile
                    key={action.label}
                    icon={action.icon}
                    label={action.label}
                    showLabel={true}
                    iconSize="h-5 w-5"
                    cardClassName="shadow-none border-border/70 hover:border-primary active:bg-muted/50 h-full"
                    contentClassName="p-4 flex-col items-center text-center min-h-[90px] justify-center"
                    onClick={() => {
                      if (action.onClick) {
                        action.onClick();
                      } else if (action.href) {
                        router.push(action.href);
                      }
                      setIsQuickActionsSheetOpen(false);
                    }}
                  />
                ))}
              </div>
            </ScrollArea>
            <SheetFooter className="p-4 border-t">
              <SheetClose asChild>
                <Button variant="outline" className="w-full">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        
        {isManagerOrAdmin && (
          <div className="hidden md:block"> 
              <Card>
                  <CardHeader className="pb-3 pt-4">
                      <CardTitle className="font-headline text-lg md:text-xl flex items-center">
                          <Grid className="mr-2 h-5 w-5 text-primary" />
                          Quick Actions
                      </CardTitle>
                      <CardDescription className="text-xs">Quickly add new records to the system.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 pb-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {quickCreateActions.map(action => (
                          <QuickActionTile 
                              key={action.label} 
                              {...action} 
                              showLabel={true} 
                              iconSize="h-5 w-5"
                              contentClassName="p-3"
                          />
                          ))}
                      </div>
                  </CardContent>
              </Card>
          </div>
        )}
        
        
        {isManagerOrAdmin && (
            <Card className="shadow-md flex flex-col">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="font-headline text-lg md:text-xl flex items-center">
                  <PackageSearch className="mr-2 h-5 w-5 text-primary" /> 
                  Manager Panel
                </CardTitle>
                <CardDescription className="text-xs">This is a placeholder for future manager-specific content.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-4 flex-grow flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Content coming soon...</p>
              </CardContent>
            </Card>
        )}
        
         {isClientReady ? (
            <SelectedDayEventsWidget
                clickedDate={clickedDate}
                eventsForSelectedDate={selectedDateEvents}
                isLoading={isLoadingEvents}
                error={eventsError}
                onEventListItemClick={handleEventListItemClick}
            />
         ) : (
            <Card className="shadow-md"><CardHeader className="pb-2 pt-4"><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent className="pt-2 pb-4"><Skeleton className="h-[110px] w-full" /></CardContent></Card>
         )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch"> 
        {isClientReady && currentMonth ? (
            <UpcomingEventsWidget
                upcomingEvents={upcomingEvents}
                isLoading={isLoadingEvents}
                error={eventsError}
                currentMonthForDisplay={currentMonth}
            />
        ) : (
            <Card className="shadow-md"><CardHeader className="pb-2 pt-4"><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent className="pt-2 pb-4"><Skeleton className="h-[168px] w-full" /></CardContent></Card>
        )}
        {isClientReady && currentMonth ? (
            <CalendarWidget
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            events={events}
            isLoadingEvents={isLoadingEvents}
            eventsError={eventsError}
            clickedDate={clickedDate}
            onDayClick={setClickedDate}
            onOpenNewEventDialog={handleOpenNewEventDialog}
            />
        ) : (
            <Card className="shadow-md flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4">
                    <CardTitle className="font-headline text-lg md:text-xl flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary" /> Calendar</CardTitle>
                    <Skeleton className="h-7 w-24" />
                </CardHeader>
                <CardContent className="pt-0.5 pb-4 flex items-center justify-center h-[290px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        )}
        <Card className="shadow-md flex flex-col">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="font-headline text-lg md:text-xl flex items-center">
              <LayoutGrid className="mr-2 h-5 w-5 text-primary" /> 
              Future Panel
            </CardTitle>
            <CardDescription className="text-xs">This is a placeholder for future content.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-4 flex-grow flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Content coming soon...</p>
          </CardContent>
        </Card>
      </div>

      <AddEventDialog
        isOpen={isAddEventDialogOpen}
        onOpenChange={(open) => {
            setIsAddEventDialogOpen(open);
            if (!open) setEventBeingEdited(null);
        }}
        defaultDate={dialogDefaultDate}
        eventToEdit={eventBeingEdited}
        onEventModified={() => {
            if (currentMonth) fetchEvents(currentMonth); 
        }}
      />
      {isManagerOrAdmin && (
        <InviteUserDialog
            isOpen={isInviteUserDialogOpen}
            onOpenChange={setIsInviteUserDialogOpen}
        />
      )}
    </div>
  );
}
