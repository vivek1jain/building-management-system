
"use client";

import * as React from 'react';
import type { UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';
import { CircleUserRound } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

interface MinimalChatSession {
  id: string;
  participantUids: string[];
  participantDetails?: { [key: string]: { displayName?: string | null; photoURL?: string | null; role?: string } };
  isGroupChat?: boolean;
  groupName?: string | null;
  groupAvatarUrl?: string | null;
  lastMessageText?: string | null;
  lastMessageSenderUid?: string | null;
  lastMessageAt?: Timestamp | Date | null;
}

interface ChatSessionListProps {
  userId: string;
  onSessionSelect: (sessionId: string, sessionData: MinimalChatSession) => void;
  currentSessionId: string | null;
}

const getInitials = (nameOrEmail: string | null | undefined) => {
    if (!nameOrEmail) return "U";
    const nameParts = nameOrEmail.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    if (nameParts[0] && nameParts[0].length >=2) {
        return nameParts[0].substring(0,2).toUpperCase();
    }
    if (nameOrEmail.includes('@')) {
         return nameOrEmail.substring(0, 2).toUpperCase();
    }
    return nameOrEmail[0] ? nameOrEmail[0].toUpperCase() : "U";
};

export function ChatSessionList({ userId, onSessionSelect, currentSessionId }: ChatSessionListProps) {
  const [sessions, setSessions] = React.useState<MinimalChatSession[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    setSessions([]); // Chat is reverted, so no sessions will be loaded.
    setIsLoading(false);
    console.log("[ChatSessionList] Chat reverted. No sessions will be loaded for user:", userId);
  }, [userId]);

  const getPartnerDetails = (session: MinimalChatSession): Partial<UserProfile> => {
    if (session.isGroupChat) {
      return { displayName: session.groupName || "Group Chat", photoURL: session.groupAvatarUrl };
    }
    const partnerUid = session.participantUids.find(uid => uid !== userId);
    if (partnerUid && session.participantDetails && session.participantDetails[partnerUid]) {
      return {
        uid: partnerUid,
        displayName: session.participantDetails[partnerUid].displayName,
      };
    }
    return { displayName: "Unknown User" };
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground text-center">No active conversations (Chat Disabled).</p>;
  }

  return (
    <ScrollArea className="flex-grow">
      <div className="p-2 space-y-1">
        {sessions.map((session) => {
          const partner = getPartnerDetails(session);
          let lastMessageAtDate: Date | null = null;
          if (session.lastMessageAt) {
            if (session.lastMessageAt instanceof Date) {
              lastMessageAtDate = session.lastMessageAt;
            } else if ((session.lastMessageAt as Timestamp).toDate) {
              lastMessageAtDate = (session.lastMessageAt as Timestamp).toDate();
            }
          }

          return (
            <button
              key={session.id}
              onClick={() => onSessionSelect(session.id, session)}
              className={cn(
                "flex items-center w-full p-2 space-x-3 rounded-md hover:bg-muted transition-colors text-left",
                currentSessionId === session.id && "bg-muted"
              )}
              disabled
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={partner.photoURL || undefined} alt={partner.displayName || "User"} />
                <AvatarFallback>
                    {partner.photoURL ? null : (partner.displayName ? getInitials(partner.displayName) : <CircleUserRound className="h-5 w-5" />)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-foreground truncate">
                    {partner.displayName || 'Chat'}
                    </p>
                    {lastMessageAtDate && (
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNowStrict(lastMessageAtDate, { addSuffix: true })}
                    </p>
                    )}
                </div>
                <p className={cn(
                    "text-xs text-muted-foreground truncate",
                )}>
                  {session.lastMessageSenderUid === userId ? "You: " : ""}{session.lastMessageText || 'No messages yet...'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
