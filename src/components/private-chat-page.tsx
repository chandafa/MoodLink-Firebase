
'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, useJournal, useChatMessages } from '@/hooks/use-journal';
import { Skeleton } from './ui/skeleton';

type PrivateChatPageProps = {
    targetUser: User;
    onBack: () => void;
};


export default function PrivateChatPage({ targetUser, onBack }: PrivateChatPageProps) {
  const [inputValue, setInputValue] = useState('');
  const { currentUser, currentAuthUserId, getChatRoomId, sendMessage, markConversationAsRead } = useJournal();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const roomId = currentAuthUserId ? getChatRoomId(currentAuthUserId, targetUser.id) : '';
  const { messages, isLoading } = useChatMessages(roomId);

  useEffect(() => {
    if (roomId) {
        markConversationAsRead(roomId);
    }
  }, [roomId, markConversationAsRead, messages]);


  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentUser) return;
    
    await sendMessage(targetUser.id, inputValue);

    setInputValue('');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 md:px-6 border-b bg-background/80 backdrop-blur-sm">
         <div className="flex items-center gap-3">
          <Button onClick={onBack} size="icon" variant="ghost">
            <ArrowLeft />
          </Button>
           <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">{targetUser.avatar}</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-xl font-bold font-headline text-foreground">
                    {targetUser.displayName}
                </h1>
                 <p className="text-xs text-muted-foreground">Level {targetUser.level}</p>
            </div>
           </div>
        </div>
      </header>
        <div className="flex-1 overflow-hidden p-4 md:p-6">
            <Card className="h-full flex flex-col">
                <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full" ref={scrollAreaRef}>
                        <div className="p-4 space-y-4">
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-2/3" />
                                <Skeleton className="h-12 w-1/2 self-end" />
                                <Skeleton className="h-8 w-1/3" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10">
                                <p>Belum ada pesan.</p>
                                <p>Mulai percakapan dengan {targetUser.displayName}!</p>
                            </div>
                        ) : (
                            messages.map(message => (
                                <div
                                key={message.id}
                                className={cn(
                                    'flex items-end gap-2',
                                    message.senderId === currentAuthUserId ? 'justify-end' : 'justify-start'
                                )}
                                >
                                {message.senderId !== currentAuthUserId && (
                                    <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">{targetUser.avatar}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={cn(
                                    'max-w-xs rounded-lg p-3 text-sm',
                                    message.senderId === currentAuthUserId
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    )}
                                >
                                    <p>{message.text}</p>
                                </div>
                                {message.senderId === currentAuthUserId && currentUser && (
                                    <Avatar className="h-8 w-8">
                                    <AvatarFallback>{currentUser.avatar}</AvatarFallback>
                                    </Avatar>
                                )}
                                </div>
                            ))
                        )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="relative">
                        <Input
                        placeholder="Ketik pesan..."
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        className="pr-12"
                        />
                        <Button
                        type="submit"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        disabled={!inputValue.trim()}
                        >
                        <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    </div>
  );
}
