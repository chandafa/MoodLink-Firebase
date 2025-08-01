
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
  Hourglass,
  Lock,
  Globe,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { useJournal, type JournalEntry, PostType, useComments, User, Visibility } from '@/hooks/use-journal';
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
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';


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
  onViewProfile: (userId: string) => void;
}

export function JournalApp({ selectedEntryId, onBack, setSelectedEntryId, newPostType, onViewProfile }: JournalAppProps) {
  const { entries, users, currentUser, addEntry, updateEntry, deleteEntry, isLoaded, toggleFollow, voteOnEntry, currentAuthUserId, getFollowersData } = useJournal();
  const [editorContent, setEditorContent] = useState('');
  const [images, setImages] = useState<(File | string)[]>([]); // Can hold File objects for new uploads or string URLs for existing
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // For displaying previews
  const [postType, setPostType] = useState<PostType>('journal');
  const [voteOptions, setVoteOptions] = useState<string[]>(['', '']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  
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
      if (currentUser && visibility === 'restricted') {
          setFollowers(getFollowersData(currentUser.followers));
      } else {
          setFollowers([]);
      }
  }, [currentUser, visibility, getFollowersData]);

  useEffect(() => {
    if (activeEntry) {
      setEditorContent(activeEntry.content);
      setImages(activeEntry.images || []);
      setImagePreviews(activeEntry.images || []);
      setPostType(activeEntry.postType);
      setVisibility(activeEntry.visibility || 'public');
      setAllowedUsers(activeEntry.allowedUserIds || []);
      if (activeEntry.postType === 'voting') {
        setVoteOptions(activeEntry.options.map(opt => opt.text));
      }
    } else {
      // It's a new entry, so clear the editor
      setPostType(newPostType);
      setEditorContent('');
      setImages([]);
      setImagePreviews([]);
      setVoteOptions(['', '']);
      setVisibility('public');
      setAllowedUsers([]);
    }
  }, [activeEntry, newPostType]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (images.length + e.target.files.length > 3) {
        toast({ title: "Batas Gambar", description: "Anda hanya bisa mengunggah maksimal 3 gambar.", variant: "destructive" });
        return;
      }
      
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);

      // Create previews for new files
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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

  const handleAllowedUserChange = (userId: string, isChecked: boolean) => {
      setAllowedUsers(prev => 
          isChecked ? [...prev, userId] : prev.filter(id => id !== userId)
      );
  };

  const handleSave = async () => {
    if (activeEntry) {
      if(isOwner) {
         await updateEntry(activeEntry.id, editorContent, images, voteOptions, visibility, allowedUsers);
      }
    } else {
       let optionsForEntry = postType === 'voting' ? voteOptions.filter(o => o.trim() !== '') : [];
       const newEntry = await addEntry(editorContent, images, postType, optionsForEntry, visibility, allowedUsers);
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
          ${imagePreviews.map(img => `<img src="${img}" />`).join('')}
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

  const handleProfileClick = () => {
    if (entryOwner && !isOwner) {
      onViewProfile(entryOwner.id);
    }
  }


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
                        <Avatar className={cn("h-12 w-12", !isOwner && "cursor-pointer")} onClick={handleProfileClick}>
                            <AvatarFallback className="text-xl">{entryOwner.avatar}</AvatarFallback>
                        </Avatar>
                     )}
                     <div>
                        <CardTitle className={cn("font-headline mb-1", !isOwner && "cursor-pointer hover:underline")} onClick={handleProfileClick}>
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
                    <Button onClick={() => toggleFollow(activeEntry.ownerId)} variant={isFollowing ? 'secondary' : 'default'} disabled={!currentUser}>
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
                     <Button variant={postType === 'capsule' ? 'default' : 'outline'} onClick={() => setPostType('capsule')}>
                       <Hourglass className="mr-2 h-4 w-4" />Kapsul
                     </Button>
                   </div>
                 )}
                <Textarea
                  placeholder={
                    postType === 'journal' ? "Mulai menulis jurnal..." :
                    postType === 'voting' ? "Tulis pertanyaan voting..." :
                    "Tulis pesan untuk masa depan..."
                  }
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
                 { (isOwner || !activeEntry) && postType === 'capsule' && (
                    <div className="mt-4 p-4 bg-accent rounded-lg text-accent-foreground">
                        <div className="flex items-center gap-2">
                           <Hourglass className="h-5 w-5" />
                           <p className="font-semibold">Ini adalah Kapsul Waktu.</p>
                        </div>
                        <p className="text-sm mt-1">Postingan ini akan disegel dan baru bisa dibuka dalam 30 hari.</p>
                    </div>
                )}
                
                { activeEntry?.postType === 'voting' && <VotingSection entry={activeEntry} onVote={voteOnEntry} /> }
                
                 {(isOwner || !activeEntry) && (
                    <div className="space-y-4 mt-6 pt-4 border-t">
                      <h3 className="text-sm font-medium">Visibilitas</h3>
                       <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as Visibility)} className="flex gap-4">
                           <div className="flex items-center space-x-2">
                               <RadioGroupItem value="public" id="v-public" />
                               <Label htmlFor="v-public" className="flex items-center gap-2"><Globe className="h-4 w-4" /> Publik</Label>
                           </div>
                           <div className="flex items-center space-x-2">
                               <RadioGroupItem value="private" id="v-private" />
                               <Label htmlFor="v-private" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Pribadi</Label>
                           </div>
                           <div className="flex items-center space-x-2">
                               <RadioGroupItem value="restricted" id="v-restricted" />
                               <Label htmlFor="v-restricted" className="flex items-center gap-2"><Users className="h-4 w-4" /> Terbatas</Label>
                           </div>
                       </RadioGroup>
                       
                       {visibility === 'restricted' && (
                         <div className="pt-4">
                           <h4 className="text-sm font-medium mb-2">Pilih siapa yang bisa melihat</h4>
                           {followers.length > 0 ? (
                               <ScrollArea className="h-40 rounded-md border p-4">
                                   <div className="space-y-2">
                                       {followers.map(follower => (
                                           <div key={follower.id} className="flex items-center space-x-2">
                                               <Checkbox
                                                   id={`user-${follower.id}`}
                                                   checked={allowedUsers.includes(follower.id)}
                                                   onCheckedChange={(checked) => handleAllowedUserChange(follower.id, !!checked)}
                                               />
                                               <Label htmlFor={`user-${follower.id}`}>{follower.displayName}</Label>
                                           </div>
                                       ))}
                                   </div>
                               </ScrollArea>
                           ) : (
                               <p className="text-xs text-muted-foreground">Anda tidak memiliki pengikut untuk dipilih.</p>
                           )}
                         </div>
                       )}
                    </div>
                 )}


                 { (isOwner || !activeEntry) && postType !== 'capsule' && (
                  <div className="pt-4 mt-auto">
                    <div className={cn("grid gap-2", imagePreviews.length > 1 ? "grid-cols-3" : "grid-cols-1")}>
                        {imagePreviews.map((img, index) => (
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
                 { (!isOwner && activeEntry && imagePreviews.length > 0) && (
                  <div className="pt-4 mt-auto">
                    <div className={cn("grid gap-2", imagePreviews.length > 1 ? "grid-cols-3" : "grid-cols-1")}>
                        {imagePreviews.map((img, index) => (
                          <div key={index} className="relative">
                              <Image src={img} alt={`Image ${index + 1}`} width={200} height={200} className="rounded-md object-cover aspect-square" />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
               {activeEntry && activeEntry.postType !== 'capsule' && (
                <>
                    <Separator className="mt-4" />
                    <CardFooter className="p-4">
                        <SupportBar entry={activeEntry} onCommentClick={() => {}} />
                    </CardFooter>
                </>
                )}
            </Card>
            {selectedEntryId && activeEntry && activeEntry.postType !== 'capsule' && <CommentSection entryId={selectedEntryId} entryOwnerId={activeEntry.ownerId} />}
            </>
          )}
        </main>
    </div>
  );
}
