
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ScheduledEvent, UserRole } from '@/types';
import { format, isSameDay, isToday as dateIsToday } from 'date-fns';
import { AlertTriangle, Loader2, CalendarClock, Briefcase, Archive, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';

interface SelectedDayEventsWidgetProps {
    clickedDate?: Date;
    eventsForSelectedDate: ScheduledEvent[];
    isLoading: boolean;
    error: string | null;
    onEventListItemClick: (event: ScheduledEvent) => void;
}

export function SelectedDayEventsWidget({
    clickedDate,
    eventsForSelectedDate,
    isLoading,
    error,
    onEventListItemClick,
}: SelectedDayEventsWidgetProps) {
  const { user } = useAuth();

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
                {event.contractorName && (
                    <div className="text-muted-foreground/90 flex items-center text-[10px] mt-0 truncate">
                        <Briefcase className="mr-1 h-3 w-3 flex-shrink-0" />
                        <span>{event.contractorName}</span>
                    </div>
                )}
                {event.assetName && (
                    <div className="text-muted-foreground/90 flex items-center text-[10px] mt-0 truncate">
                        <Archive className="mr-1 h-3 w-3 flex-shrink-0" />
                        <span>{event.assetName}</span>
                    </div>
                )}
            </div>
        </>
    );

    const baseClasses = "flex items-start gap-x-2 text-sm p-1.5 rounded-md shadow-sm h-[52px] overflow-hidden";
    const bgClasses = "bg-card hover:bg-muted/30 border";
    
    if (user?.role === UserRole.MANAGER) {
      return (
        <li key={event.id}>
            <button 
                onClick={() => onEventListItemClick(event)}
                className={cn(baseClasses, bgClasses, "w-full text-left focus:outline-none focus:ring-1 focus:ring-primary/50")}
                aria-label={`Edit event: ${event.title}`}
            >
                {listItemContent}
            </button>
        </li>
      );
    }

    return (
        <li key={event.id} className={cn(baseClasses, bgClasses)}>
            {listItemContent}
        </li>
    );
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="font-headline text-lg md:text-xl flex items-center"> {/* Mobile: text-lg */}
          <ListChecks className="mr-2 h-5 w-5 text-primary" />
          Today
        </CardTitle>
        {/* Removed sub-header CardDescription */}
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        {isLoading ? (
          <div className="space-y-2">
            {/* Remove Skeleton for description if it's gone */}
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="text-destructive flex items-center justify-center py-1 text-xs bg-destructive/10 p-2 rounded-md">
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> {error}
          </div>
        ) : (
          <ScrollArea className="h-[110px]"> 
            <div className="pr-1 space-y-1.5 mt-1">
                {eventsForSelectedDate.length > 0 ? (
                <ul className="space-y-1.5">
                    {eventsForSelectedDate.map(event => renderEventListItem(event))}
                </ul>
                ) : (
                <p className="text-sm text-muted-foreground italic">
                  {clickedDate ? `No events for ${format(clickedDate, "MMM d")}.` : "No date selected."}
                </p>
                )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
