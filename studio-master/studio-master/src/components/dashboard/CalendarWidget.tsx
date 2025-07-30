
"use client";

import React from 'react';
import { Calendar as ShadCalendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ScheduledEvent } from '@/types';
import { format, isSameDay, parseISO } from 'date-fns';
import type { DayClickEventHandler, DayModifiers, DayProps } from 'react-day-picker';
import { AlertTriangle, Loader2, CalendarDays, PlusCircle } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CalendarDayContent = (props: DayProps & { events: ScheduledEvent[] }) => {
  const { date, displayMonth, events, modifiers } = props;
  const isOutside = date.getMonth() !== displayMonth.getMonth();
  
  const isToday = !isOutside && modifiers && modifiers.today;
  const isSelected = !isOutside && modifiers && modifiers.selected;

  const hasEventsOnThisDay = !isOutside && events.some(event => {
    const eventStartDate = event.start instanceof Date ? event.start : (event.start as any)?.toDate ? (event.start as any).toDate() : parseISO(event.start as unknown as string);
    return isSameDay(eventStartDate, date);
  });

  let dayClasses = "h-8 w-8 rounded-md flex items-center justify-center relative transition-colors duration-150 ease-in-out";
  let numberClasses = "text-sm";

  if (isOutside) {
    numberClasses = cn(numberClasses, "text-muted-foreground opacity-50");
    dayClasses = cn(dayClasses, "cursor-default"); 
  } else {
    if (isToday && isSelected) {
      dayClasses = cn(dayClasses, "bg-primary text-primary-foreground ring-2 ring-primary-foreground/70 ring-offset-1 ring-offset-primary");
    } else if (isToday) {
      dayClasses = cn(dayClasses, "bg-primary text-primary-foreground");
      numberClasses = cn(numberClasses, "text-primary-foreground");
    } else if (isSelected) {
      dayClasses = cn(dayClasses, "bg-muted text-accent ring-2 ring-accent/80 ring-offset-1 ring-offset-background");
      numberClasses = cn(numberClasses, "text-accent");
    } else {
      dayClasses = cn(dayClasses, "bg-transparent"); 
      numberClasses = cn(numberClasses, "text-black"); 
      if (hasEventsOnThisDay) {
        dayClasses = cn(dayClasses, "ring-1 ring-accent ring-inset");
      }
    }
  }

  return (
    <div className={dayClasses}>
      <span className={numberClasses}>
        {format(date, "d")}
      </span>
    </div>
  );
};

interface CalendarWidgetProps {
    currentMonth: Date;
    onMonthChange: (month: Date) => void;
    events: ScheduledEvent[];
    isLoadingEvents: boolean;
    eventsError: string | null;
    clickedDate?: Date;
    onDayClick: DayClickEventHandler;
    onOpenNewEventDialog: () => void;
}

export function CalendarWidget({
    currentMonth,
    onMonthChange,
    events,
    isLoadingEvents,
    eventsError,
    clickedDate,
    onDayClick,
    onOpenNewEventDialog,
}: CalendarWidgetProps) {

  return (
    <Card className="shadow-lg flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4">
        <CardTitle className="font-headline text-lg md:text-xl flex items-center"> {/* Mobile: text-lg */}
            <CalendarDays className="mr-2 h-5 w-5 text-primary" />
            Calendar
        </CardTitle>
        <div className="flex items-center gap-x-2">
         {isLoadingEvents && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
         <Button onClick={onOpenNewEventDialog} variant="outline" size="xs" className="text-xs px-2 py-1 h-7">
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> New Event
         </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0.5 pb-4 flex flex-col">
        {eventsError && (
          <div className="text-destructive flex items-center justify-center py-1 text-xs bg-destructive/10 p-2 rounded-md mb-2 w-full">
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> {eventsError}
          </div>
        )}

        <ShadCalendar
          mode="single"
          selected={clickedDate}
          month={currentMonth}
          onMonthChange={onMonthChange}
          onDayClick={onDayClick}
          className="w-full p-0" 
          components={{
            DayContent: (childProps: DayProps) => (
              <CalendarDayContent
                {...childProps}
                events={events}
              />
            ),
          }}
          classNames={{
            table: "w-full border-collapse table-fixed",
            head_row: "", 
            head_cell: cn("text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center p-1"), 
            row: "table-row", 
            cell: cn("h-9 w-9 p-0 text-center"), 
            day: (date: Date, modifiers: DayModifiers) => {
              const baseClasses = cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal");
              
              if (modifiers.outside) {
                return cn(baseClasses, "!bg-transparent !cursor-default hover:!bg-transparent");
              }
              if (modifiers.today) {
                 return cn(baseClasses, "hover:!bg-primary/90"); 
              }
              if (modifiers.selected) {
                  return cn(baseClasses, "hover:!bg-muted/80");
              }
              return cn(baseClasses, "hover:bg-accent/20");
            },
            day_today: "", 
            day_selected: "", 
            day_outside: "text-muted-foreground opacity-50", 
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "", 
            day_hidden: "invisible",
            caption_label: "font-headline",
            nav_button: cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
          }}
        />
      </CardContent>
    </Card>
  );
}

  
