"use client";

import { useState, useRef, useEffect } from 'react';
import { HelpCircle, Send, LoaderCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { interactiveHelpChatbot } from '@/ai/flows/interactive-help-chatbot';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
};

export function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your friendly assistant. How can I help you use MoodLink today?",
      sender: 'bot',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
        const response = await interactiveHelpChatbot({ query: inputValue });
        const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: response.response,
            sender: 'bot',
        };
        setMessages(prev => [...prev, botMessage]);
    } catch (error) {
        console.error("Error with chatbot:", error);
        const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: "I'm sorry, I seem to be having trouble connecting. Please try again later.",
            sender: 'bot',
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-24 right-6 h-16 w-16 rounded-full shadow-lg hidden md:flex"
          size="icon"
          aria-label="Open help chat"
        >
          <HelpCircle className="h-8 w-8" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Help Assistant</SheetTitle>
          <SheetDescription>
            Ask me anything about using the MoodLink app.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="p-4 space-y-4">
                {messages.map(message => (
                    <div
                    key={message.id}
                    className={cn(
                        'flex items-end gap-2',
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                    >
                    {message.sender === 'bot' && (
                        <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">B</AvatarFallback>
                        </Avatar>
                    )}
                    <div
                        className={cn(
                        'max-w-xs rounded-lg p-3 text-sm',
                        message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                    >
                        {message.text}
                    </div>
                     {message.sender === 'user' && (
                        <Avatar className="h-8 w-8">
                        <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                    )}
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-end gap-2 justify-start">
                         <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground">B</AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-lg p-3">
                            <LoaderCircle className="h-5 w-5 animate-spin" />
                        </div>
                    </div>
                )}
                </div>
            </ScrollArea>
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="relative">
            <Input
              placeholder="Type your question..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              disabled={isLoading}
              className="pr-12"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              disabled={isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
