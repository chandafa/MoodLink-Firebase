

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
  Heart,
  MoreVertical,
  Edit,
  Music,
} from 'lucide-react';
import Image from 'next/image';
import { useJournal, type JournalEntry, PostType, useComments, User, Visibility, Comment } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
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
import { AnimatePresence, motion } from 'framer-motion';
import HashtagRenderer from './hashtag-renderer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

// --- START: Threaded Comment Section ---

type CommentWithReplies = Comment & { replies: CommentWithReplies[] };

function buildCommentTree(comments: Comment[]): CommentWithReplies[] {
    const commentMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
    });

    commentMap.forEach(comment => {
        if (comment.parentId && commentMap.has(comment.parentId)) {
            commentMap.get(comment.parentId)!.replies.push(comment);
        } else {
            rootComments.push(comment);
        }
    });

    // Sort replies by creation date as well
    commentMap.forEach(comment => {
        comment.replies.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
    });
    
    // Sort root comments
    return rootComments.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
}


function CommentThread({
  comment,
  entryId,
  entryOwnerId,
  onViewHashtag,
  onViewProfile,
  parentAuthorName,
  level = 0,
}: {
  comment: CommentWithReplies;
  entryId: string;
  entryOwnerId: string;
  onViewHashtag: (tag: string) => void;
  onViewProfile: (userId: string) => void;
  parentAuthorName?: string;
  level?: number;
}) {
  const { currentUser, addComment, toggleCommentLike, currentAuthUserId, updateComment, deleteComment } = useJournal();
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isLiked = (comment.likedBy || []).includes(currentAuthUserId || '');
  const isOwner = comment.authorId === currentAuthUserId;

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !currentUser) {
      toast({ title: 'Komentar tidak boleh kosong', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await addComment(entryId, replyContent, currentUser, entryOwnerId, comment.id);
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast({ title: 'Gagal mengirim balasan', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLikeClick = async () => {
    if (!currentAuthUserId) return;
    await toggleCommentLike(entryId, comment.id);
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) {
      toast({ title: 'Komentar tidak boleh kosong', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
        await updateComment(entryId, comment.id, editContent);
        setIsEditing(false);
    } catch (error) {
        console.error("Error updating comment:", error);
        toast({ title: 'Gagal memperbarui komentar', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleDelete = async () => {
      try {
          await deleteComment(entryId, comment.id);
          toast({ title: 'Komentar dihapus' });
      } catch (error) {
          console.error("Error deleting comment:", error);
          toast({ title: 'Gagal menghapus komentar', variant: 'destructive' });
      }
  }
  
  const displayContent = level >= 1 && parentAuthorName 
    ? `@${parentAuthorName} ${comment.content}` 
    : comment.content;

  return (
    <div className={cn("flex gap-3", level > 0 && "ml-2 md:ml-4 mt-3 pt-3 border-l")}>
      <Avatar className="cursor-pointer h-8 w-8" onClick={() => onViewProfile(comment.authorId)}>
        <AvatarFallback>{comment.authorAvatar}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <p className="font-bold cursor-pointer hover:underline" onClick={() => onViewProfile(comment.authorId)}>{comment.authorName}</p>
                <p className="text-xs text-muted-foreground">
                    {comment.createdAt ? `· ${formatDistanceToNow(comment.createdAt.toDate(), { locale: id, addSuffix: true })}` : ''}
                </p>
            </div>
            {isOwner && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setIsEditing(true); setEditContent(comment.content); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                        </DropdownMenuItem>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Hapus</span>
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Anda yakin ingin menghapus komentar ini?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tindakan ini tidak dapat diurungkan. Ini akan menghapus komentar secara permanen beserta semua balasannya.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
          </div>
        
          {isEditing ? (
               <form onSubmit={handleEditSubmit} className="mt-2">
                  <Textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      disabled={isSubmitting}
                      className="text-sm"
                      rows={2}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Batal</Button>
                      <Button type="submit" size="sm" disabled={isSubmitting}>
                          {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Simpan'}
                      </Button>
                  </div>
              </form>
          ) : (
            <HashtagRenderer
              text={displayContent}
              onViewHashtag={onViewHashtag}
              mentionTarget={parentAuthorName}
            />
          )}

        {!isEditing && (
          <div className="flex items-center gap-2 mt-1 -ml-2">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsReplying(!isReplying)}>
                Balas
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={handleLikeClick} disabled={!currentAuthUserId}>
                <Heart className={cn("h-3 w-3 mr-1", isLiked && "fill-red-500 text-red-500")} />
                {comment.likes || 0}
              </Button>
          </div>
        )}
      
          <AnimatePresence>
            {isReplying && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 overflow-hidden"
              >
                <form onSubmit={handleReplySubmit} className="flex flex-col gap-2">
                  <Textarea
                    placeholder={`Membalas ${comment.authorName}...`}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    disabled={isSubmitting}
                    className="text-sm"
                    rows={2}
                  />
                  <div className="flex justify-end gap-2">
                     <Button type="button" variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Batal</Button>
                     <Button type="submit" size="sm" disabled={isSubmitting}>
                       {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Kirim'}
                     </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map(reply => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  entryId={entryId}
                  entryOwnerId={entryOwnerId}
                  onViewHashtag={onViewHashtag}
                  onViewProfile={onViewProfile}
                  parentAuthorName={comment.authorName}
                  level={level + 1}
                />
              ))}
            </div>
          )}
      </div>
    </div>
  );
}


function CommentSection({ entryId, entryOwnerId, onViewHashtag, onViewProfile }: { entryId: string, entryOwnerId: string, onViewHashtag: (tag: string) => void, onViewProfile: (userId: string) => void }) {
    const { comments, isLoading: isLoadingComments } = useComments(entryId);
    const { currentUser, addComment } = useJournal();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const commentTree = useMemo(() => {
        return buildCommentTree(comments);
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
    
    return (
        <div className="mt-6 border-t pt-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MessageSquare />
                Komentar ({comments.length})
            </h2>
            
            <form onSubmit={handleCommentSubmit} className="flex gap-4 mb-6">
                 <Avatar><AvatarFallback>{currentUser?.avatar}</AvatarFallback></Avatar>
                 <Textarea 
                    placeholder={`Beri komentar sebagai ${currentUser?.displayName || 'Anonim'}...`}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isSubmitting || !currentUser}
                    rows={1}
                    className="flex-1"
                 />
                 <Button type="submit" disabled={isSubmitting || !currentUser}>
                    {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Kirim'}
                 </Button>
            </form>
            
            <div className="space-y-4">
              {isLoadingComments ? (
                 <Skeleton className="h-40 w-full" />
              ) : commentTree.length > 0 ? commentTree.map(comment => (
                    <CommentThread key={comment.id} comment={comment} entryId={entryId} entryOwnerId={entryOwnerId} onViewHashtag={onViewHashtag} onViewProfile={onViewProfile} />
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Belum ada komentar. Jadilah yang pertama!</p>
                )}
            </div>
        </div>
    )
}

// --- END: Threaded Comment Section ---

function VotingSection({ entry, onVote }: { entry: JournalEntry; onVote: (entryId: string, optionIndex: number) => void; }) {
  const { currentAuthUserId } = useJournal();
  const hasVoted = entry.votedBy?.includes(currentAuthUserId || '');
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

type JournalAppProps = {
  selectedEntryId: string | null;
  onBack: () => void;
  setSelectedEntryId: (id: string | null) => void;
  newPostType: PostType;
  onViewProfile: (userId: string) => void;
  onViewHashtag: (tag: string) => void;
  onViewImage: (url: string) => void;
}

export function JournalApp({ selectedEntryId, onBack, setSelectedEntryId, newPostType, onViewProfile, onViewHashtag, onViewImage }: JournalAppProps) {
  const { entries, users, currentUser, addEntry, updateEntry, deleteEntry, isLoaded, toggleFollow, voteOnEntry, currentAuthUserId, getFollowersData } = useJournal();
  const [editorContent, setEditorContent] = useState('');
  const [images, setImages] = useState<(File | string)[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [postType, setPostType] = useState<PostType>('journal');
  const [voteOptions, setVoteOptions] = useState<string[]>(['', '']);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
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
  
  const isOwner = activeEntry ? activeEntry.ownerId === currentAuthUserId : true;
  
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
      setMusicUrl(activeEntry.musicUrl || null);
      setMusicFile(null);
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
      setMusicFile(null);
      setMusicUrl(null);
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
  
  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
          toast({ title: 'Ukuran Musik Terlalu Besar', description: 'Ukuran file musik maksimal 10MB.', variant: 'destructive' });
          return;
      }
      setMusicFile(file);
      setMusicUrl(URL.createObjectURL(file)); // Create a temporary URL for preview
    }
  };

  const removeMusic = () => {
      setMusicFile(null);
      setMusicUrl(null);
      if (musicInputRef.current) {
          musicInputRef.current.value = '';
      }
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
         await updateEntry(activeEntry.id, editorContent, images, musicFile, musicUrl, voteOptions, visibility, allowedUsers);
      }
    } else {
       let optionsForEntry = postType === 'voting' ? voteOptions.filter(o => o.trim() !== '') : [];
       const newEntry = await addEntry(editorContent, images, musicFile, postType, optionsForEntry, visibility, allowedUsers);
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

  const handleProfileClick = (id: string) => {
    if (id !== currentAuthUserId) {
      onViewProfile(id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 md:px-6 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
            <Button onClick={onBack} size="icon" variant="ghost" className="mr-2">
                <ArrowLeft />
            </Button>
          <h1 className="text-2xl font-bold font-headline text-foreground">
            Postingan
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 flex flex-col">
          { !isLoaded && selectedEntryId ? (
             <Card className="flex-1 flex flex-col p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-20 mt-4" />
             </Card>
          ) : (
            <>
            <Card className="shadow-lg p-4 md:p-6">
              <div className="flex gap-4 items-start">
                  { (entryOwner || isOwner) && (
                      <Avatar className={cn("h-12 w-12", !isOwner && "cursor-pointer")} onClick={() => entryOwner && handleProfileClick(entryOwner!.id)}>
                          <AvatarFallback className="text-xl">{isOwner ? currentUser?.avatar : entryOwner?.avatar}</AvatarFallback>
                      </Avatar>
                   )}
                   <div className="flex-1">
                      <div className="flex items-center justify-between">
                         <div>
                            <p className={cn("font-bold", !isOwner && "cursor-pointer hover:underline")} onClick={() => entryOwner && handleProfileClick(entryOwner!.id)}>
                              {isOwner ? currentUser?.displayName : entryOwner?.displayName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {activeEntry ? `Dibuat pada ${activeEntry.createdAt?.toDate().toLocaleString('id-ID', {day: 'numeric', month:'long', year:'numeric'})}`: 'Membuat postingan baru'}
                            </p>
                         </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {isOwner && (
                                   <DropdownMenuItem onClick={() => {}}>
                                      <Edit className="mr-2"/> Edit
                                   </DropdownMenuItem>
                                )}
                                {!isOwner && entryOwner && (
                                    <DropdownMenuItem onClick={() => toggleFollow(entryOwner!.id)}>
                                        <UserPlus className="mr-2"/> {isFollowing ? 'Berhenti Ikuti' : 'Ikuti'}
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={handlePrint}>
                                    <Printer className="mr-2"/> Cetak
                                </DropdownMenuItem>
                                {isOwner && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">
                                                <Trash2 className="mr-2"/> Hapus
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
                                                <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </DropdownMenuContent>
                         </DropdownMenu>
                      </div>

                      <div className="mt-4">
                        {isOwner ? (
                            <Textarea
                                placeholder={
                                    postType === 'journal' ? "Mulai menulis jurnal... Gunakan # untuk topik." :
                                    postType === 'voting' ? "Tulis pertanyaan voting... Gunakan # untuk topik." :
                                    "Tulis pesan untuk masa depan... Gunakan # untuk topik."
                                }
                                className="text-base resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                                value={editorContent}
                                onChange={e => setEditorContent(e.target.value)}
                            />
                        ) : (
                            <div className="flex-1 text-base py-2">
                               <HashtagRenderer text={editorContent} onViewHashtag={onViewHashtag} />
                            </div>
                        )}
                      </div>
                      
                       {musicUrl && (
                        <div className="mt-4">
                          <audio controls src={musicUrl} className="w-full">
                            Browser Anda tidak mendukung elemen audio.
                          </audio>
                           {isOwner && (
                               <Button variant="link" size="sm" className="text-destructive" onClick={removeMusic}>Hapus musik</Button>
                           )}
                        </div>
                      )}

                      { imagePreviews.length > 0 && (
                        <div className={cn("grid gap-2 mt-4", imagePreviews.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                            {imagePreviews.map((img, index) => (
                              <div key={index} className="relative group rounded-lg overflow-hidden">
                                  <Image src={img} alt={`Preview ${index + 1}`} width={400} height={400} className="object-cover aspect-video cursor-pointer" onClick={() => onViewImage(img)} />
                                  {isOwner && (
                                    <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); removeImage(index);}}>
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                              </div>
                            ))}
                        </div>
                      )}
                      
                       {isOwner && postType !== 'capsule' && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={images.length >= 3}>
                                <ImageIcon className="mr-2 h-4 w-4" />
                                Gambar ({images.length}/3)
                            </Button>
                             <Input 
                                type="file" 
                                ref={imageInputRef} 
                                className="hidden" 
                                onChange={handleImageUpload} 
                                accept="image/*" 
                                multiple 
                              />
                            <Button variant="outline" size="sm" onClick={() => musicInputRef.current?.click()} disabled={!!musicFile || !!musicUrl}>
                                <Music className="mr-2 h-4 w-4" />
                                Musik
                            </Button>
                            <Input
                                type="file"
                                ref={musicInputRef}
                                className="hidden"
                                onChange={handleMusicUpload}
                                accept="audio/*"
                            />
                          </div>
                        )}
                        {musicFile && isOwner && (
                             <div className="text-sm text-muted-foreground mt-2">File musik dipilih: {musicFile.name}</div>
                        )}


                        { activeEntry?.postType === 'voting' && <VotingSection entry={activeEntry} onVote={voteOnEntry} /> }
                        
                         {isOwner && (
                            <div className="space-y-4 mt-6 pt-4 border-t">
                              <h3 className="text-sm font-medium">Pengaturan Postingan</h3>
                               { !activeEntry && (
                               <div className="flex flex-wrap gap-2 mb-4">
                                 <Button size="sm" variant={postType === 'journal' ? 'default' : 'outline'} onClick={() => setPostType('journal')}>
                                   <Type className="mr-2 h-4 w-4" />Jurnal
                                 </Button>
                                 <Button size="sm" variant={postType === 'voting' ? 'default' : 'outline'} onClick={() => setPostType('voting')}>
                                   <Vote className="mr-2 h-4 w-4" />Voting
                                 </Button>
                                 <Button size="sm" variant={postType === 'capsule' ? 'default' : 'outline'} onClick={() => setPostType('capsule')}>
                                   <Hourglass className="mr-2 h-4 w-4" />Kapsul
                                 </Button>
                               </div>
                             )}
                               {postType === 'voting' && (
                                    <div className="space-y-2">
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
                               {postType === 'capsule' && (
                                    <div className="mt-4 p-4 bg-accent rounded-lg text-accent-foreground">
                                        <div className="flex items-center gap-2">
                                           <Hourglass className="h-5 w-5" />
                                           <p className="font-semibold">Ini adalah Kapsul Waktu.</p>
                                        </div>
                                        <p className="text-sm mt-1">Postingan ini akan disegel dan baru bisa dibuka dalam 30 hari.</p>
                                    </div>
                                )}
                               <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as Visibility)} className="flex flex-wrap gap-x-4 gap-y-2">
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
                               <div className="flex justify-end mt-4">
                                <Button onClick={handleSave} size="lg">
                                  <Save className="mr-2 h-5 w-5" />
                                  Simpan
                                </Button>
                               </div>
                            </div>
                         )}
                         
                       <div className="mt-4 pt-4 border-t">
                         {activeEntry && <SupportBar entry={activeEntry} onCommentClick={() => {}} />}
                       </div>
                   </div>
              </div>
            </Card>
            {selectedEntryId && activeEntry && activeEntry.postType !== 'capsule' && <CommentSection entryId={selectedEntryId} entryOwnerId={activeEntry.ownerId} onViewHashtag={onViewHashtag} onViewProfile={onViewProfile}/>}
            </>
          )}
        </main>
    </div>
  );
}
