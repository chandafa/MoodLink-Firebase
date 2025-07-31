'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Printer,
  Save,
  Trash2,
  ArrowLeft,
  Send,
  LoaderCircle,
  Image as ImageIcon,
  XCircle,
  UserPlus,
  PlusCircle,
  X,
  Vote,
  Type,
} from 'lucide-react';
import Image from 'next/image';
import { useJournal, type JournalEntry, PostType, useComments, User } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from './theme-toggle';
import { Icons } from './icons';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { SupportBar } from './support-bar';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';

function VotingSection({ entry, onVote }: { entry: JournalEntry; onVote: (entryId: string, optionIndex: number) => void; }) {
  const { currentAuthUserId } = useJournal();
  const hasVoted = entry.votedBy?.includes(currentAuthUserId);
  const totalVotes = entry.options.reduce((sum, opt) => sum + opt.votes, 0);

  const handleVote = (index: number) => {
    if (!hasVoted) {
      onVote(entry.id, index);
    }
  };

  return (
    <div className="space-y-3 mt-4">
      {entry.options.map((option, index) => {
        const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
        return (
          <div key={index}>
            <Button
              variant={hasVoted ? 'secondary' : 'outline'}
              className="w-full justify-start h-auto"
              onClick={() => handleVote(index)}
              disabled={hasVoted}
            >
              <div className="flex items-center justify-between w-full">
                <span>{option.text}</span>
                {hasVoted && <span className="text-xs font-bold">{Math.round(percentage)}%</span>}
              </div>
            </Button>
            {hasVoted && <Progress value={percentage} className="h-2 mt-1" />}
          </div>
        );
      })}
    </div>
  );
}


function CommentSection({ entryId, entryOwnerId }: { entryId: string, entryOwnerId: string }) {
    const { comments, isLoading: isLoadingComments } = useComments(entryId);
    const { currentUser, addComment } = useJournal();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const sortedComments = useMemo(() => {
        return [...comments].sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis())
    }, [comments]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) {
            toast({ title: 'Komentar tidak boleh kosong', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            await addComment(entryId, newComment, currentUser, entryOwnerId);
            setNewComment('');
        } catch (error) {
            console.error("Error submitting comment:", error);
            toast({ title: 'Gagal mengirim komentar', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (isLoadingComments) return <Skeleton className="h-40 w-full mt-6" />;

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare />
                    Komentar ({sortedComments.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleCommentSubmit} className="flex flex-col gap-4 mb-6">
                     <Textarea 
                        placeholder={`Beri komentar sebagai ${currentUser?.displayName || 'Anonim'}...`}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={isSubmitting}
                     />
                     <Button type="submit" disabled={isSubmitting} className="self-end">
                        {isSubmitting ? <LoaderCircle className="animate-spin mr-2" /> : <Send className="mr-2" />}
                        Kirim
                     </Button>
                </form>
                <Separator />
                 <ScrollArea className="h-64 mt-4 pr-4">
                    <div className="space-y-4">
                        {sortedComments.length > 0 ? sortedComments.map(comment => (
                            <div key={comment.id} className="flex gap-3">
                                <Avatar>
                                    <AvatarFallback>{comment.authorAvatar}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold">{comment.authorName}</p>
                                        <p className="text-xs text-muted-foreground">{comment.createdAt?.toDate().toLocaleString()}</p>
                                    </div>
                                    <p className="text-sm mt-1">{comment.content}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Belum ada komentar. Jadilah yang pertama!</p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}


type JournalAppProps = {
  selectedEntryId: string | null;
  onBack: () => void;
  setSelectedEntryId: (id: string | null) => void;
  newPostType: PostType;
}

export function JournalApp({ selectedEntryId, onBack, setSelectedEntryId, newPostType }: JournalAppProps) {
  const { entries, users, currentUser, addEntry, updateEntry, deleteEntry, isLoaded, toggleFollow, voteOnEntry, currentAuthUserId } = useJournal();
  const [editorContent, setEditorContent] = useState('');
  const [images, setImages] = useState<string[]>([]); // stores base64 for new images, urls for existing
  const [postType, setPostType] = useState<PostType>('journal');
  const [voteOptions, setVoteOptions] = useState<string[]>(['', '']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const activeEntry = useMemo(() => {
    return entries.find(entry => entry.id === selectedEntryId) || null;
  }, [selectedEntryId, entries]);

  const entryOwner = useMemo(() => {
    if (!activeEntry || !users) return null;
    return users.find(u => u.id === activeEntry.ownerId);
  }, [activeEntry, users]);
  
  const isOwner = activeEntry?.ownerId === currentAuthUserId;
  
  const isFollowing = useMemo(() => {
      if (!currentUser || !activeEntry) return false;
      return currentUser.following.includes(activeEntry.ownerId);
  }, [currentUser, activeEntry]);

  useEffect(() => {
    if (activeEntry) {
      setEditorContent(activeEntry.content);
      setImages(activeEntry.images || []);
      setPostType(activeEntry.postType);
      if (activeEntry.postType === 'voting') {
        setVoteOptions(activeEntry.options.map(opt => opt.text));
      }
    } else {
      // It's a new entry, so clear the editor
      setPostType(newPostType);
      setEditorContent('');
      setImages([]);
      setVoteOptions(['', '']);
    }
  }, [activeEntry, newPostType]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (images.length + e.target.files.length > 3) {
        toast({ title: "Batas Gambar", description: "Anda hanya bisa mengunggah maksimal 3 gambar.", variant: "destructive" });
        return;
      }

      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prevImages => [...prevImages, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const removeImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...voteOptions];
    newOptions[index] = value;
    setVoteOptions(newOptions);
  };
  
  const addVoteOption = () => {
    if(voteOptions.length < 5) {
      setVoteOptions([...voteOptions, '']);
    } else {
      toast({ title: 'Batas Opsi', description: 'Maksimal 5 opsi voting.', variant: 'destructive'});
    }
  };

  const removeVoteOption = (index: number) => {
    if (voteOptions.length > 2) {
      const newOptions = voteOptions.filter((_, i) => i !== index);
      setVoteOptions(newOptions);
    } else {
       toast({ title: 'Opsi Minimum', description: 'Minimal harus ada 2 opsi voting.', variant: 'destructive'});
    }
  };


  const handleSave = async () => {
    const imagesToUpload = images.filter(img => img.startsWith('data:image'));
    const existingImageUrls = images.filter(img => !img.startsWith('data:image'));
    // In a real app, you'd handle deletion of images from storage if they were removed from the `existingImageUrls` array.

    if (activeEntry) {
      if(isOwner) {
         // For simplicity, we are not handling image updates in this flow, only adding new ones if needed.
         await updateEntry(activeEntry.id, editorContent, images, voteOptions);
      }
    } else {
       let optionsForEntry = postType === 'voting' ? voteOptions.filter(o => o.trim() !== '') : [];
       const newEntry = await addEntry(editorContent, imagesToUpload, postType, optionsForEntry);
      if(newEntry) {
        setSelectedEntryId(newEntry.id);
      }
    }
  };

   const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  }, [entries]);

  const handleDelete = async () => {
    if (activeEntry && isOwner) {
      const entryIndex = sortedEntries.findIndex(e => e.id === selectedEntryId);
      await deleteEntry(activeEntry.id);
      
      onBack();
    }
  };
  
  const handlePrint = () => {
    const printableContent = `
      <html>
        <head>
          <title>Entri Jurnal</title>
          <style>
            body { font-family: 'Poppins', sans-serif; line-height: 1.6; }
            h1 { color: #333; }
            p { white-space: pre-wrap; }
            img { max-width: 100%; height: auto; border-radius: 8px; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <h1>Entri Jurnal dari ${activeEntry ? activeEntry.createdAt.toDate().toLocaleDateString() : 'MoodLink'}</h1>
          <hr />
          <p>${editorContent}</p>
          ${images.map(img => `<img src="${img}" />`).join('')}
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(printableContent);
        printWindow.document.close();
        printWindow.print();
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 md:px-6 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
            <Button onClick={onBack} size="icon" variant="ghost" className="mr-2">
                <ArrowLeft />
            </Button>
          <Icons.logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">
            {activeEntry ? (isOwner ? 'Edit Post' : 'Lihat Post') : `Post ${postType} Baru`}
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 flex flex-col">
          { !isLoaded && !activeEntry ? (
             <Card className="flex-1 flex flex-col">
                <CardHeader> <Skeleton className="h-8 w-48" /> </CardHeader>
                <CardContent className="flex-1"> <Skeleton className="h-full w-full" /> </CardContent>
             </Card>
          ) : (
            <>
            <Card className="flex-1 flex flex-col shadow-lg">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                     {entryOwner && (
                        <Avatar className="h-12 w-12">
                            <AvatarFallback className="text-xl">{entryOwner.avatar}</AvatarFallback>
                        </Avatar>
                     )}
                     <div>
                        <CardTitle className="font-headline mb-1">
                          {entryOwner?.displayName || 'Anonim'}
                        </CardTitle>
                        <CardDescription>
                            {activeEntry ? `Dibuat pada ${activeEntry.createdAt?.toDate().toLocaleString()}`: 'Entri baru'}
                        </CardDescription>
                     </div>
                </div>
                <div className="flex items-center gap-2">
                  {(isOwner || !activeEntry) && (
                    <Button onClick={handleSave} size="lg">
                      <Save className="mr-2 h-5 w-5" />
                      Simpan
                    </Button>
                  )}
                  {!isOwner && activeEntry && (
                    <Button onClick={() => toggleFollow(activeEntry.ownerId)} variant={isFollowing ? 'secondary' : 'default'}>
                      <UserPlus className="mr-2 h-5 w-5" />
                      {isFollowing ? 'Diikuti' : 'Ikuti'}
                    </Button>
                  )}
                  {activeEntry && (
                    <>
                      <Button onClick={handlePrint} variant="outline" size="icon" aria-label="Print entry" className="hidden md:inline-flex">
                        <Printer className="h-5 w-5" />
                      </Button>
                      {isOwner && (
                        <Button onClick={handleDelete} variant="destructive" size="icon" aria-label="Delete entry">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-4">
                 { (isOwner || !activeEntry) && !activeEntry && (
                   <div className="flex gap-2 mb-4">
                     <Button variant={postType === 'journal' ? 'default' : 'outline'} onClick={() => setPostType('journal')}>
                       <Type className="mr-2 h-4 w-4" />Jurnal
                     </Button>
                     <Button variant={postType === 'voting' ? 'default' : 'outline'} onClick={() => setPostType('voting')}>
                       <Vote className="mr-2 h-4 w-4" />Voting
                     </Button>
                   </div>
                 )}
                <Textarea
                  placeholder={postType === 'journal' ? "Mulai menulis jurnal..." : "Tulis pertanyaan voting..."}
                  className="flex-1 text-base resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                  value={editorContent}
                  onChange={e => setEditorContent(e.target.value)}
                  readOnly={!isOwner && !!activeEntry}
                />
                 { (isOwner || !activeEntry) && postType === 'voting' && (
                    <div className="space-y-2 mt-4">
                        <h3 className="text-sm font-medium">Opsi Voting</h3>
                        {voteOptions.map((option, index) => (
                           <div key={index} className="flex items-center gap-2">
                               <Input 
                                   value={option}
                                   onChange={(e) => handleOptionChange(index, e.target.value)}
                                   placeholder={`Opsi ${index + 1}`}
                               />
                               <Button variant="ghost" size="icon" onClick={() => removeVoteOption(index)}>
                                   <X className="h-4 w-4" />
                               </Button>
                           </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addVoteOption}>
                           <PlusCircle className="mr-2 h-4 w-4" /> Tambah Opsi
                        </Button>
                    </div>
                )}
                
                { activeEntry?.postType === 'voting' && <VotingSection entry={activeEntry} onVote={voteOnEntry} /> }

                 { (isOwner || !activeEntry) && (
                  <div className="pt-4 mt-auto">
                    <div className={cn("grid gap-2", images.length > 1 ? "grid-cols-3" : "grid-cols-1")}>
                        {images.map((img, index) => (
                          <div key={index} className="relative group">
                              <Image src={img} alt={`Preview ${index + 1}`} width={200} height={200} className="rounded-md object-cover aspect-square" />
                              <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(index)}>
                                  <XCircle className="h-4 w-4" />
                              </Button>
                          </div>
                        ))}
                    </div>
                    <Separator className="my-4" />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={images.length >= 3}>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Tambah Gambar ({images.length}/3)
                    </Button>
                     <Input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        multiple 
                      />
                  </div>
                )}
                 { (!isOwner && activeEntry && images.length > 0) && (
                  <div className="pt-4 mt-auto">
                    <div className={cn("grid gap-2", images.length > 1 ? "grid-cols-3" : "grid-cols-1")}>
                        {images.map((img, index) => (
                          <div key={index} className="relative">
                              <Image src={img} alt={`Image ${index + 1}`} width={200} height={200} className="rounded-md object-cover aspect-square" />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
               {activeEntry && (
                <>
                    <Separator className="mt-4" />
                    <CardFooter className="p-4">
                        <SupportBar entry={activeEntry} onCommentClick={() => {}} />
                    </CardFooter>
                </>
                )}
            </Card>
            {selectedEntryId && activeEntry && <CommentSection entryId={selectedEntryId} entryOwnerId={activeEntry.ownerId} />}
            </>
          )}
        </main>
    </div>
  );
}
