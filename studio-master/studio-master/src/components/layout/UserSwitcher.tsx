
"use client";

import * as React from 'react';
import { useAuth } from "@/hooks/useAuth"; 
import { ChevronsUpDown, Check, Users } from "lucide-react";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

export const UserSwitcher = () => {
    const { user: activeUser, allPeople, setActiveUser } = useAuth();
    const [open, setOpen] = React.useState(false);

    // Add a guard to handle the initial loading state where allPeople might be undefined.
    if (!allPeople) {
        return null; 
    }

    return (
       <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-[200px] justify-between" disabled={allPeople.length <= 1}>
            <div className="flex items-center truncate">
              <Users className="mr-2 h-4 w-4" />
              {activeUser ? activeUser.name : "Select user..."}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search user..." />
            <CommandList>
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandGroup>
                {allPeople.map((person) => (
                    <CommandItem
                        key={person.id}
                        value={person.name || person.id}
                        onSelect={() => {
                            setActiveUser(person.id);
                            setOpen(false);
                        }}
                    >
                        <Check className={cn("mr-2 h-4 w-4", activeUser?.id === person.id ? "opacity-100" : "opacity-0")} />
                        <div className="flex flex-col">
                            <span>{person.name}</span>
                            <span className="text-xs text-muted-foreground">{person.role}</span>
                        </div>
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
       </Popover>
    );
};
