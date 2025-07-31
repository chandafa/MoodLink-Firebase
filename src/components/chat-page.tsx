'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Smile, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Group } from './group-list-page';


type Message = {
  id: string;
  text: string;
  sender: {
    name: string;
    avatar: string;
  };
};

const randomNames = ['CyberPanda', 'NeonTiger', 'Blueberry', 'QuantumLeap', 'ShadowCat'];
const randomAvatars = ['🐼', '🐯', '🫐', '🚀', '🐱'];

const getRandomUser = () => {
  const randIndex = Math.floor(Math.random() * randomNames.length);
  return {
    name: randomNames[randIndex],
    avatar: randomAvatars[randIndex],
  };
};

type GroupChatPageProps = {
    group: Group;
    onBack: () => void;
};


export default function GroupChatPage({ group, onBack }: GroupChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: `Selamat datang di grup ${group.name}!`, sender: { name: 'AdminBot', avatar: '🤖' } },
    { id: '2', text: 'Senang bertemu kalian semua.', sender: getRandomUser() },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [currentUser, setCurrentUser] = useState({ name: 'User', avatar: '👤' });
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('moodlink-chat-user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      const newUser = getRandomUser();
      setCurrentUser(newUser);
      localStorage.setItem('moodlink-chat-user', JSON.stringify(newUser));
    }
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: currentUser,
    };

    setMessages(prev => [...prev, newMessage]);
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
            <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">{group.emoji}</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-xl font-bold font-headline text-foreground">
                    {group.name}
                </h1>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{group.members} anggota</span>
                </div>
            </div>
           </div>
        </div>
      </header>
        <div className="flex-1 overflow-hidden p-4 md:p-6">
            <Card className="h-full flex flex-col">
                <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full" ref={scrollAreaRef}>
                        <div className="p-4 space-y-4">
                        {messages.map(message => (
                            <div
                            key={message.id}
                            className={cn(
                                'flex items-end gap-2',
                                message.sender.name === currentUser.name ? 'justify-end' : 'justify-start'
                            )}
                            >
                            {message.sender.name !== currentUser.name && (
                                <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">{message.sender.avatar}</AvatarFallback>
                                </Avatar>
                            )}
                            <div
                                className={cn(
                                'max-w-xs rounded-lg p-3 text-sm',
                                message.sender.name === currentUser.name
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                )}
                            >
                                <p className="font-bold mb-1">{message.sender.name}</p>
                                <p>{message.text}</p>
                            </div>
                            {message.sender.name === currentUser.name && (
                                <Avatar className="h-8 w-8">
                                <AvatarFallback>{currentUser.avatar}</AvatarFallback>
                                </Avatar>
                            )}
                            </div>
                        ))}
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
