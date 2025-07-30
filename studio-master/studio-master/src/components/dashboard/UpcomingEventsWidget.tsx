
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ScheduledEvent } from '@/types';
import { format, isSameDay } from 'date-fns';
import { AlertTriangle, Loader2, ListChecks, Wrench, CalendarClock, Archive } from 'lucide-react'; // Changed Briefcase to Wrench
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UpcomingEventsWidgetProps {
    upcomingEvents: ScheduledEvent[];
    isLoading: boolean;
    error: string | null;
    currentMonthForDisplay: Date;
}

export function UpcomingEventsWidget({
    upcomingEvents,
    isLoading,
    error,
    currentMonthForDisplay,
}: UpcomingEventsWidgetProps) {

  const formatEventTimeOnly = (event: ScheduledEvent) => {
    if (event.allDay) {
      return "All Day";
    }
    const startTime = format(event.start, "h:mm a");
    const endTime = format(event.end, "h:mm a");
    
    if (isSameDay(event.start, event.end)) {
      return `${startTime}${startTime !== endTime ? ` - ${endTime}` : ''}`;
    } else { 
      return `${startTime} - ${format(event.end, "E, MMM d, h:mm a")}`;
    }
  };

  const renderEventListItem = (event: ScheduledEvent) => {
    const listItemContent = (
        <>
            <div className="date-badge flex items-center justify-center bg-primary text-primary-foreground rounded-md w-10 h-10 text-center flex-shrink-0 mr-2">
                <span className="text-lg font-bold leading-none">{format(event.start, "d")}</span>
            </div>
        <div className="event-details flex-grow min-h-0 h-full flex flex-col overflow-y-auto pr-1 text-xs">
            <div className="flex justify-between items-start mb-0.5">
                <div className="font-semibold text-foreground truncate flex-grow mr-1">{event.title}</div>
                <div className="text-muted-foreground flex items-center text-[10px] flex-shrink-0">
                    <CalendarClock className="mr-1 h-3 w-3 flex-shrink-0" />
                    {formatEventTimeOnly(event)}
                </div>
            </div>
            <div className="text-muted-foreground/90 flex items-center text-[10px] mt-0 truncate">
                <Wrench className="mr-1 h-3 w-3 flex-shrink-0" />
                Supplier:&nbsp;
                {event.contractorName ? (
                    <span>{event.contractorName}</span>
                ) : (
                    <span className="text-muted-foreground/70 italic">None</span>
                )}
            </div>
            <div className="text-muted-foreground/90 flex items-center text-[10px] mt-0 truncate">
                <Archive className="mr-1 h-3 w-3 flex-shrink-0" />
                Asset:&nbsp;
                {event.assetName ? (
                    <span>{event.assetName}</span>
                ) : (
                    <span className="text-muted-foreground/70 italic">None</span>
                )}
            </div>
        </div>
        </>
    );

    const baseClasses = "flex items-start gap-x-2 text-sm p-1.5 rounded-md shadow-sm h-[52px] overflow-hidden";
    const bgClasses = "bg-card hover:bg-muted/30 border";
    
    return (
        <li key={event.id} className={cn(baseClasses, bgClasses)}>
            {listItemContent}
        </li>
    );
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="font-headline text-lg md:text-xl flex items-center"> 
          <ListChecks className="mr-2 h-5 w-5 text-primary" />
          Upcoming in {format(currentMonthForDisplay, "MMMM")}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)} 
          </div>
        ) : error ? (
          <div className="text-destructive flex items-center justify-center py-1 text-xs bg-destructive/10 p-2 rounded-md">
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> {error}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <ScrollArea className="flex-grow h-60"> 
            <ul className="space-y-1.5 pr-2">
              {upcomingEvents.map(event => renderEventListItem(event))}
            </ul>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No other events scheduled for {format(currentMonthForDisplay, "MMMM")}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
