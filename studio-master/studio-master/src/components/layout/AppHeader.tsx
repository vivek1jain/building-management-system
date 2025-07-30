
"use client";

import * as React from 'react';
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth"; 
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Hexagon, CircleUserRound, LayoutDashboard, ClipboardList, Banknote, Settings, PackageSearch, Menu, ChevronsUpDown, Building, Check } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { UserSwitcher } from './UserSwitcher';


const AppLogo = () => (
    <Link href="/dashboard" className="flex items-center gap-2">
    <Hexagon className="h-7 w-7 text-primary" />
    <span className="font-headline text-xl font-semibold text-primary hidden sm:inline-block">Proper</span>
    </Link>
);

const NavLink = ({ href, icon: Icon, label, className, onClick }: { href: string; icon: React.ElementType; label: string, className?: string, onClick?: () => void }) => (
    <Link href={href} className={cn("flex items-center px-3 py-2 text-base md:text-sm text-foreground/80 transition-colors hover:text-foreground hover:bg-muted rounded-md", className)} onClick={onClick}>
    <Icon className="mr-3 h-5 w-5 md:mr-2 md:h-4 md:w-4"/>{label}
    </Link>
);

const navLinksContent = (closeMenu?: () => void) => (
    <>
      <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={closeMenu}/>
      <NavLink href="/work-orders" icon={ClipboardList} label="Ticketing" onClick={closeMenu}/>
      <NavLink href="/finances" icon={Banknote} label="Finances" onClick={closeMenu}/>
      <NavLink href="/building" icon={PackageSearch} label="Building" onClick={closeMenu}/>
      <NavLink href="/settings" icon={Settings} label="Settings" onClick={closeMenu}/>
    </>
);

const BuildingSwitcher = () => {
    const { buildings, activeBuildingId, setActiveBuilding } = useAuth();
    const [open, setOpen] = React.useState(false);

    const activeBuilding = buildings && buildings.length > 0
      ? buildings.find(b => b.id === activeBuildingId)
      : null;

    return (
       <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-[200px] justify-between">
            {activeBuilding ? activeBuilding.name : "Select building..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search building..." />
            <CommandList>
                <CommandEmpty>No building found.</CommandEmpty>
                <CommandGroup>
                {buildings && buildings.map((building) => (
                    <CommandItem
                        key={building.id}
                        value={building.name}
                        onSelect={() => {
                            setActiveBuilding(building.id);
                            setOpen(false);
                        }}
                    >
                        <Check className={cn("mr-2 h-4 w-4", activeBuildingId === building.id ? "opacity-100" : "opacity-0")} />
                        {building.name}
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
       </Popover>
    );
};

const UserActions = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <>
              <Skeleton className="h-9 w-9 rounded-full" />
            </>
        );
    }
    
    if (!user) {
        return null;
    }

    return (
        <TooltipProvider>
            <Tooltip>
            <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" aria-label="My Profile"
                className="rounded-full p-0 h-8 w-8 md:h-9 md:w-9"
                >
                <Link href="/profile">
                    <CircleUserRound className="h-5 w-5 text-foreground" />
                </Link>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>My Profile {user?.role ? `(${user.role})` : ''}</p>
            </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export function AppHeader() {
    const { user, loading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between max-w-screen-2xl px-4">
            <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                <div className="md:hidden">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Open menu">
                        <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0 pt-8 bg-background">
                        <div className="flex flex-col h-full">
                            <div className="px-4 pb-4">
                            <AppLogo />
                            <p className="text-xs text-muted-foreground mt-1">Property Management</p>
                            </div>
                            <Separator />
                        <nav className="flex flex-col gap-1 p-4 flex-grow">
                            {navLinksContent(() => setIsMobileMenuOpen(false))}
                        </nav>
                        </div>
                    </SheetContent>
                    </Sheet>
                </div>
        
                <div className="hidden md:flex items-center gap-4">
                    <AppLogo />
                    <Separator orientation="vertical" className="h-8" />
                    {loading ? <Skeleton className="h-10 w-48" /> : <BuildingSwitcher />}
                    {loading ? <Skeleton className="h-10 w-48" /> : <UserSwitcher />}
                </div>
                </div>
        
                <nav className="hidden md:flex flex-wrap items-center justify-center gap-x-1 lg:gap-x-2 mx-4">
                {navLinksContent()}
                </nav>
        
                <div className="flex items-center gap-2 md:gap-3">
                    <UserActions />
                </div>
            </div>
        </div>
        </header>
    );
}
