
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, CircleUserRound, CornerDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Timestamp } from 'firebase/firestore';

interface MinimalMessage {
  id: string;
  senderUid: string;
  text: string;
  senderDisplayName?: string | null;
  senderEmail?: string | null;
  createdAt?: Timestamp | Date | null;
}

interface ChatMessageAreaProps {
  sessionId: string;
  currentUserId: string;
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


export function ChatMessageArea({ sessionId, currentUserId }: ChatMessageAreaProps) {
  const { user: currentUserProfile } = useAuth();
  const [messages, setMessages] = React.useState<MinimalMessage[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsLoading(true);
    setMessages([]); // Chat is reverted, so no messages will be loaded
    setIsLoading(false);
    console.log("[ChatMessageArea] Chat reverted. No messages will be loaded for session:", sessionId);
  }, [sessionId]);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUserProfile) return;
    setIsSending(true);
    try {
      console.warn("[ChatMessageArea] Attempted to send message, but sendMessage function is removed (Chat Reverted).");
      toast({ title: "Chat Reverted", description: "Sending messages has been disabled.", variant: "default" });
      setNewMessage(''); 
    } catch (error) {
      console.error("[ChatMessageArea] Error in handleSendMessage (chat reverted):", error);
      toast({ title: "Error", description: "Could not send message (functionality reverted).", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex-grow space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex items-end space-x-2 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
              <Skeleton className="h-10 w-3/5 rounded-lg" />
              {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            </div>
          ))}
        </div>
        <div className="mt-4 flex space-x-2">
          <Skeleton className="h-10 flex-grow rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <ScrollArea className="flex-grow p-4" viewportRef={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => {
            const isSender = msg.senderUid === currentUserId;
            let createdAtDate: Date | null = null;
            if (msg.createdAt) {
                if (msg.createdAt instanceof Date) {
                    createdAtDate = msg.createdAt;
                } else if ((msg.createdAt as Timestamp).toDate) {
                    createdAtDate = (msg.createdAt as Timestamp).toDate();
                }
            }
            return (
              <div
                key={msg.id}
                className={cn('flex items-end space-x-2', isSender ? 'justify-end' : 'justify-start')}
              >
                {!isSender && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                        {getInitials(msg.senderDisplayName || msg.senderEmail)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[70%] rounded-lg px-3 py-2 break-words',
                    isSender ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'
                  )}
                >
                  <p className="text-sm">{msg.text}</p>
                  {createdAtDate && (
                     <p className={cn(
                        "text-xs mt-1",
                        isSender ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
                      )}>
                       {format(createdAtDate, 'p')}
                    </p>
                  )}
                </div>
                {isSender && (
                  <Avatar className="h-8 w-8">
                     <AvatarImage src={currentUserProfile?.photoURL || undefined} />
                     <AvatarFallback>
                        {currentUserProfile?.photoURL ? null : (currentUserProfile?.displayName ? getInitials(currentUserProfile.displayName) : (currentUserProfile?.email ? getInitials(currentUserProfile.email) : <CircleUserRound className="h-5 w-5" />) )}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
           {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">Chat functionality is currently disabled. No messages to display.</p>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="border-t p-3 bg-background flex items-center space-x-2">
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Chat functionality is disabled..."
          className="flex-grow"
          disabled={true}
        />
        <Button type="submit" size="icon" disabled={true}> 
          {isSending ? <CornerDownLeft className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
