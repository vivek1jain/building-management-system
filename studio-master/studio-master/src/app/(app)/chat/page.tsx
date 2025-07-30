
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquareText, Users, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ChatSessionList } from '@/components/chat/ChatSessionList';
import { ChatMessageArea } from '@/components/chat/ChatMessageArea';
import { ChatUserList } from '@/components/chat/ChatUserList';
import { getAllUserProfiles, getPersonByUid } from '@/lib/firebase/firestore'; 
import type { UserProfile } from '@/types'; 
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null);
  const [showUserList, setShowUserList] = React.useState(false);
  const [allUsers, setAllUsers] = React.useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);
  const [activeChatPartner, setActiveChatPartner] = React.useState<UserProfile | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (showUserList && !authLoading && user) { 
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
          const profiles = await getAllUserProfiles();
          setAllUsers(profiles.filter(p => p.uid !== user?.uid));
        } catch (error) {
          console.error("Failed to fetch users:", error);
          toast({ title: "Error", description: "Could not load users.", variant: "destructive" });
        } finally {
          setIsLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [showUserList, user, authLoading, toast]);

  const handleUserSelect = async (selectedUser: UserProfile) => {
    if (!user) return;
    try {
      // Logic for finding or creating a chat session would go here.
      // Since it's removed, we'll just show a toast.
      toast({ title: "Chat Reverted", description: "Chat functionality is currently being reverted.", variant: "default" });
      console.warn("Attempted to start a chat, which has been removed during the auth revert.");
    } catch (error) {
      console.error("Error in handleUserSelect (chat reverted):", error);
      toast({ title: "Chat Error", description: "Could not start chat (functionality reverted).", variant: "destructive" });
    }
  };

  const handleSessionSelect = async (sessionId: string, sessionData?: any) => {
    setSelectedSessionId(sessionId);
    setShowUserList(false);
    if (user && sessionData && sessionData.participantUids) {
        const partnerUid = sessionData.participantUids.find((uid: string) => uid !== user.uid);
        if (partnerUid && sessionData.participantDetails && sessionData.participantDetails[partnerUid]) {
            setActiveChatPartner({
                uid: partnerUid,
                displayName: sessionData.participantDetails[partnerUid].displayName,
                email: null, 
                role: sessionData.participantDetails[partnerUid].role,
            } as UserProfile);
        } else if (partnerUid) {
            try {
                 const partnerProfile = await getPersonByUid(partnerUid);
                 if(partnerProfile) setActiveChatPartner(partnerProfile as UserProfile);
            } catch (e) {
                console.warn("Could not fetch partner profile for chat session:", e);
                setActiveChatPartner({uid: partnerUid, displayName: "User " + partnerUid.substring(0,4), email:null, role:undefined} as UserProfile);
            }
        } else {
             setActiveChatPartner(null);
        }
    } else {
        setActiveChatPartner(null);
    }
  };


  const getChatTitle = () => {
    if (selectedSessionId && activeChatPartner) {
        return `Chat with ${activeChatPartner.displayName || activeChatPartner.email || 'User'}`;
    }
    if (showUserList) {
        return "Start New Chat";
    }
    return "Chat";
  }

  if (authLoading) { 
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) { 
    return <p className="text-center text-muted-foreground p-4">Error: User not available.</p>;
  }

  return (
    <Card className="shadow-lg h-[calc(100vh-10rem)] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline text-2xl flex items-center">
            <MessageSquareText className="mr-3 h-7 w-7 text-primary" />
            {getChatTitle()}
          </CardTitle>
          {selectedSessionId && activeChatPartner && (
            <CardDescription className="text-xs">
              Session ID: {selectedSessionId.substring(0,8)}... (Chat Disabled)
            </CardDescription>
          )}
          {!selectedSessionId && !showUserList && (
             <CardDescription>Your recent conversations or start a new one. (Chat Disabled)</CardDescription>
          )}
           {showUserList && (
             <CardDescription>Select a user to start a conversation. (Chat Disabled)</CardDescription>
          )}
        </div>
        { (selectedSessionId || showUserList) && (
            <Button variant="ghost" size="icon" onClick={() => { setSelectedSessionId(null); setShowUserList(false); setActiveChatPartner(null); }}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close Chat/User List</span>
            </Button>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="flex-grow p-0 flex overflow-hidden">
        <div className={`
            w-full sm:w-1/3 border-r 
            ${(selectedSessionId && !showUserList) ? 'hidden sm:flex sm:flex-col' : 'flex flex-col'}
            transition-all duration-300 ease-in-out
        `}>
          {showUserList ? (
            <ChatUserList users={allUsers} onUserSelect={handleUserSelect} isLoading={isLoadingUsers} />
          ) : (
            <ChatSessionList userId={user.uid} onSessionSelect={handleSessionSelect} currentSessionId={selectedSessionId} />
          )}
          {!showUserList && (
             <div className="p-2 border-t">
                <Button className="w-full" variant="outline" onClick={() => { setShowUserList(true); setSelectedSessionId(null); setActiveChatPartner(null);}} disabled>
                    <Users className="mr-2 h-4 w-4" /> Start New Chat (Disabled)
                </Button>
             </div>
          )}
        </div>

        <div className={`
            flex-grow flex flex-col
            ${(!selectedSessionId && !showUserList) ? 'hidden sm:flex sm:items-center sm:justify-center' : ''}
            ${(selectedSessionId && !showUserList) ? 'flex' : 'hidden sm:flex'}
        `}>
          {selectedSessionId && !showUserList && user ? (
            <ChatMessageArea sessionId={selectedSessionId} currentUserId={user.uid} />
          ) : (
            <div className="flex-col items-center justify-center text-center p-10 hidden sm:flex">
              <MessageSquareText className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground">
                {showUserList ? "Select a user to begin chatting" : "Select a conversation"}
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                {showUserList ? "Choose someone from the list on the left." : "Chat functionality is currently disabled."}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
