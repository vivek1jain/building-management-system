"use client";

import type { UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CircleUserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatUserListProps {
  users: UserProfile[];
  onUserSelect: (user: UserProfile) => void;
  isLoading: boolean;
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

export function ChatUserList({ users, onUserSelect, isLoading }: ChatUserListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground text-center">No other users found.</p>;
  }

  return (
    <ScrollArea className="flex-grow">
      <div className="p-2 space-y-1">
        {users.map((user) => (
          <button
            key={user.uid}
            onClick={() => onUserSelect(user)}
            className="flex items-center w-full p-2 space-x-3 rounded-md hover:bg-muted transition-colors text-left"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
              <AvatarFallback>
                 {user.photoURL ? null : (user.displayName ? getInitials(user.displayName) : (user.email ? getInitials(user.email) : <CircleUserRound className="h-5 w-5" />) )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.displayName || user.email || 'Unnamed User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.role || 'User'}
              </p>
            </div>
            {user.status && <Badge variant="outline" className="text-xs hidden sm:inline-flex">{user.status}</Badge>}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
