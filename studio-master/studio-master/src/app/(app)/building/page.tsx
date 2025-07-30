
"use client";

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Wrench, Home, Users, Archive, MailPlus, PackageSearch, Send, Loader2 } from 'lucide-react';

import { SupplierListClient } from '@/components/suppliers/SupplierListClient';
import { FlatListClient } from '@/components/flats/FlatListClient';
import { PeopleListClient } from '@/components/people/PeopleListClient';
import { AssetListClient } from '@/components/assets/AssetListClient';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, type Person } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


const VALID_TABS = ['people', 'flats', 'suppliers', 'assets'] as const;
type ValidTabValue = typeof VALID_TABS[number];

interface TabDetail {
  label: string;
  icon: React.ElementType;
  newLinkPath?: string;
  newLinkLabel?: string;
  action?: () => void;
}

export default function BuildingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, activeBuildingId } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<ValidTabValue>(VALID_TABS[0]);
  const [isInviteUserDialogOpen, setIsInviteUserDialogOpen] = React.useState(false);

  // State lifted from PeopleListClient
  const [peopleForBulkInvite, setPeopleForBulkInvite] = React.useState<Person[]>([]);
  const [selectedPeopleIds, setSelectedPeopleIds] = React.useState<Set<string>>(new Set());
  const [isSendingInvites, setIsSendingInvites] = React.useState(false);

  const openInviteDialog = () => setIsInviteUserDialogOpen(true);
  
  const handleBulkInvite = async () => {
    setIsSendingInvites(true);
    let invitedCount = 0;
    let skippedWithAccount = 0;
    let skippedNoEmail = 0;
  
    const peopleToInvite = peopleForBulkInvite.filter(p => selectedPeopleIds.has(p.id));
  
    for (const person of peopleToInvite) {
      if (person.uid) {
        skippedWithAccount++;
      } else if (!person.email) {
        skippedNoEmail++;
      } else {
        console.log(`[Mock Invite] Sending invite to ${person.name} at ${person.email}`);
        invitedCount++;
      }
    }
  
    await new Promise(resolve => setTimeout(resolve, 700));
  
    let description = '';
    if (invitedCount > 0) description += `Mock invitations sent to ${invitedCount} people. `;
    if (skippedWithAccount > 0) description += `${skippedWithAccount} skipped (already have an account). `;
    if (skippedNoEmail > 0) description += `${skippedNoEmail} skipped (no email address).`;
  
    toast({
      title: "Bulk Invite Processed",
      description: description.trim(),
      duration: 8000,
    });
  
    setSelectedPeopleIds(new Set());
    setIsSendingInvites(false);
  };

  const inviteablePeopleSelectedCount = React.useMemo(() => {
    return Array.from(selectedPeopleIds).filter(id => {
        const person = peopleForBulkInvite.find(p => p.id === id);
        return person && !person.uid && !!person.email;
    }).length;
  }, [selectedPeopleIds, peopleForBulkInvite]);


  const tabDetails: Record<ValidTabValue, TabDetail> = {
    people: { label: 'People', icon: Users, action: openInviteDialog },
    flats: { label: 'Flats', icon: Home, newLinkPath: '/flats/new', newLinkLabel: 'New Flat' },
    suppliers: { label: 'Suppliers', icon: Wrench, newLinkPath: '/suppliers/new', newLinkLabel: 'New Supplier' },
    assets: { label: 'Assets', icon: Archive, newLinkPath: '/assets/new', newLinkLabel: 'New Asset' },
  };

  React.useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as string | null;
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl as ValidTabValue)) {
      setActiveTab(tabFromUrl as ValidTabValue);
    } else {
      if (tabFromUrl && !VALID_TABS.includes(tabFromUrl as ValidTabValue)) {
        router.replace(`/building?tab=${VALID_TABS[0]}`, { scroll: false });
      }
      setActiveTab(VALID_TABS[0]);
    }
  }, [searchParams, router]);

  const handleTabChange = (newTabValue: string) => {
    const tab = newTabValue as ValidTabValue;
    setActiveTab(tab);
    router.push(`/building?tab=${tab}`, { scroll: false });
  };
  
  if (!activeBuildingId) {
    // This can be a loading state or a message to select/create a building
    return (
        <Card className="shadow-lg w-full">
            <CardHeader>
                <CardTitle>No Building Selected</CardTitle>
                <CardDescription>Please select a building from the header to view its details.</CardDescription>
            </CardHeader>
            <CardContent>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="font-headline text-3xl flex items-center">
          <PackageSearch className="mr-3 h-8 w-8 text-primary" />
          Building Management
        </CardTitle>
        <CardDescription>Manage people, flats, suppliers, and assets for the building.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-0 bg-transparent p-0 border-b border-border">
            {VALID_TABS.map((tabKey) => (
              <TabsTrigger
                key={tabKey}
                value={tabKey}
                className={cn(
                  "flex items-center gap-2 py-3 px-1 text-sm rounded-none data-[state=active]:shadow-none",
                  "border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent",
                  "data-[state=active]:text-primary data-[state=active]:font-semibold",
                  "data-[state=inactive]:text-muted-foreground/70 data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:border-gray-300"
                )}
              >
                {React.createElement(tabDetails[tabKey].icon, { className: "h-4 w-4" })}
                {tabDetails[tabKey].label}
              </TabsTrigger>
            ))}
          </TabsList>

          {VALID_TABS.map((tabKey) => (
            <TabsContent key={tabKey} value={tabKey} className="space-y-6 pt-6">
              <Card className="border-t-0 rounded-t-none shadow-none">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl flex items-center">
                    {React.createElement(tabDetails[tabKey].icon, { className: "mr-2 h-5 w-5 text-primary" })}
                    {tabDetails[tabKey].label}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {tabKey === 'people' && user?.role === UserRole.MANAGER && (
                      <Button onClick={handleBulkInvite} disabled={inviteablePeopleSelectedCount === 0 || isSendingInvites} size="sm" variant="outline">
                        {isSendingInvites ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Invite Selected ({inviteablePeopleSelectedCount})
                      </Button>
                    )}
                    {tabDetails[tabKey].newLinkPath && tabDetails[tabKey].newLinkLabel && (
                      <Button asChild size="sm">
                        <Link href={tabDetails[tabKey].newLinkPath!}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          {tabDetails[tabKey].newLinkLabel}
                        </Link>
                      </Button>
                    )}
                    {tabKey === 'people' && user?.role === UserRole.MANAGER && tabDetails[tabKey].action && (
                      <Button onClick={tabDetails[tabKey].action} size="sm">
                        <MailPlus className="mr-2 h-4 w-4" />
                        Invite New Person
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {tabKey === 'people' && (
                    <PeopleListClient
                      buildingId={activeBuildingId}
                      setPeopleForBulkInvite={setPeopleForBulkInvite}
                      selectedPeopleIds={selectedPeopleIds}
                      setSelectedPeopleIds={setSelectedPeopleIds}
                    />
                  )}
                  {tabKey === 'flats' && <FlatListClient buildingId={activeBuildingId} />}
                  {tabKey === 'suppliers' && <SupplierListClient buildingId={activeBuildingId} />}
                  {tabKey === 'assets' && <AssetListClient buildingId={activeBuildingId} />}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
        {user?.role === UserRole.MANAGER && (
          <InviteUserDialog
            isOpen={isInviteUserDialogOpen}
            onOpenChange={setIsInviteUserDialogOpen}
          />
        )}
      </CardContent>
    </Card>
  );
}
