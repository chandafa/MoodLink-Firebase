
'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Image as ImageIcon, X, Mic, MoreVertical, Edit, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useJournal } from '@/hooks/use-journal';
import { useChatMessages } from '@/hooks/use-chat';
import type { User, ChatMessage } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useShopItems } from '@/hooks/use-shop';


export default function PrivateChatPage({ targetUser, onBack }: { targetUser: User; onBack: () => void; }) {
  const [inputValue, setInputValue] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { currentUser, currentAuthUserId, getChatRoomId, sendMessage, markConversationAsRead, updateChatMessage } = useJournal();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { titleMap } = useShopItems();

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const roomId = currentAuthUserId ? getChatRoomId(currentAuthUserId, targetUser.id) : '';
  const { messages, isLoading } = useChatMessages(roomId);
  const activeTitle = targetUser.activeTitle && titleMap.get(targetUser.activeTitle);

  useEffect(() => {
    if (roomId && messages) { // Check for messages to ensure it runs on new messages
        markConversationAsRead(roomId);
    }
  }, [roomId, markConversationAsRead, messages]); // Add messages to dependency array


  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
      setImageFile(null);
      setImagePreview(null);
      if (imageInputRef.current) {
          imageInputRef.current.value = '';
      }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && !imageFile) return;
    
    await sendMessage(targetUser.id, inputValue, imageFile || undefined);

    setInputValue('');
    removeImage();
  };
  
    const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            await sendMessage(targetUser.id, '', undefined, audioBlob);
        }
        audioChunksRef.current = [];
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Izin mikrofon diperlukan untuk mengirim pesan suara.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleStartEditing = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };

  const handleCancelEditing = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMessageId || !editingText.trim()) {
        handleCancelEditing();
        return;
    }
    setIsSubmittingEdit(true);
    await updateChatMessage(roomId, editingMessageId, editingText);
    setIsSubmittingEdit(false);
    setEditingMessageId(null);
    setEditingText('');
  };
  
  return (
    <div className="flex flex-col h-screen bg-background">
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 md:px-6 border-b bg-background/80 backdrop-blur-sm shrink-0">
         <div className="flex items-center gap-3">
          <Button onClick={onBack} size="icon" variant="ghost">
            <ArrowLeft />
          </Button>
           <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">{targetUser.avatar}</AvatarFallback>
            </Avatar>
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold font-headline text-foreground">
                        {targetUser.displayName}
                    </h1>
                    {activeTitle && (
                        <span className="text-xs font-semibold text-primary">{activeTitle.icon} {activeTitle.name}</span>
                    )}
                </div>
                 <p className="text-xs text-muted-foreground">Level {targetUser.level}</p>
            </div>
           </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-2/3" />
                    <Skeleton className="h-12 w-1/2 ml-auto" />
                    <Skeleton className="h-8 w-1/3" />
                </div>
            ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                    <p>Belum ada pesan.</p>
                    <p>Mulai percakapan dengan {targetUser.displayName}!</p>
                </div>
            ) : (
                messages.map(message => {
                    const isOwner = message.senderId === currentAuthUserId;
                    const isEditingThisMessage = editingMessageId === message.id;
                    
                    return (
                        <div key={message.id} className={cn(
                            'flex items-end gap-2',
                            isOwner ? 'justify-end' : 'justify-start'
                        )}>
                            {!isOwner && (
                                <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">{targetUser.avatar}</AvatarFallback>
                                </Avatar>
                            )}

                             {isOwner && !isEditingThisMessage && !message.imageUrl && !message.audioUrl && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 self-center">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleStartEditing(message)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            <span>Edit</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            <div className="max-w-xs w-full">
                               {isEditingThisMessage ? (
                                    <form onSubmit={handleSaveEdit} className="space-y-2">
                                        <Textarea 
                                            value={editingText}
                                            onChange={e => setEditingText(e.target.value)}
                                            className="text-sm"
                                            rows={3}
                                            disabled={isSubmittingEdit}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="ghost" size="sm" onClick={handleCancelEditing} disabled={isSubmittingEdit}>Batal</Button>
                                            <Button type="submit" size="sm" disabled={isSubmittingEdit}>
                                                {isSubmittingEdit ? <LoaderCircle className="animate-spin" /> : 'Simpan'}
                                            </Button>
                                        </div>
                                    </form>
                               ) : (
                                   <div className={cn(
                                        'rounded-lg p-3 text-sm w-fit',
                                        isOwner ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'
                                    )}>
                                        {message.imageUrl && (
                                            <Image
                                                src={message.imageUrl}
                                                alt="Chat image"
                                                width={200}
                                                height={200}
                                                className="rounded-md mb-2 object-cover"
                                            />
                                        )}
                                        {message.audioUrl && (
                                            <audio controls src={message.audioUrl} className="w-full h-10">
                                                Browser Anda tidak mendukung elemen audio.
                                            </audio>
                                        )}
                                        {message.text && <p>{message.text}</p>}
                                    </div>
                               )}
                            </div>
                            
                            {isOwner && currentUser && (
                                <Avatar className="h-8 w-8">
                                <AvatarFallback>{currentUser.avatar}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    )
                })
            )}
            </div>
        </ScrollArea>
      </div>

      <div className="p-4 border-t shrink-0 bg-background">
        <form onSubmit={handleSendMessage} className="space-y-2">
            {imagePreview && (
                <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                    <Image src={imagePreview} alt="Pratinjau gambar" fill className="object-cover" />
                    <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={removeImage}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            {isRecording && (
                <div className="flex items-center gap-2 text-destructive animate-pulse">
                    <Mic className="h-5 w-5" />
                    <p>Merekam...</p>
                </div>
            )}
            <div className="relative flex items-center gap-2">
                 <Button type="button" variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()}>
                    <ImageIcon className="h-5 w-5" />
                </Button>
                <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                <Input
                placeholder="Ketik pesan..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                className="flex-1"
                />
                {inputValue.trim() || imageFile ? (
                     <Button
                        type="submit"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                ) : (
                     <Button
                        type="button"
                        size="icon"
                        className={cn("h-10 w-10 shrink-0", isRecording && "bg-destructive")}
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                    >
                        <Mic className="h-5 w-5" />
                    </Button>
                )}
            </div>
        </form>
      </div>
    </div>
  );
}
