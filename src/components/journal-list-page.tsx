
'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useJournal, type JournalEntry, PostType, Visibility } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from './icons';
import { ThemeToggle } from './theme-toggle';
import { ArrowLeft, ArrowRight, BookText, FilePlus, MoreVertical, Edit, Flag, Trash2, Search, Bookmark, Vote, Hourglass, Globe, Lock, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { SupportBar } from './support-bar';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import HashtagRenderer from './hashtag-renderer';


const ITEMS_PER_PAGE = 6;

const VisibilityIcon = ({ visibility }: { visibility: Visibility }) => {
    switch (visibility) {
        case 'public':
            return <Globe className="h-3 w-3" />;
        case 'private':
            return <Lock className="h-3 w-3" />;
        case 'restricted':
            return <Users className="h-3 w-3" />;
        default:
            return <Globe className="h-3 w-3" />;
    }
};

function VotingSection({ entry, onVote }: { entry: JournalEntry; onVote: (entryId: string, optionIndex: number) => void; }) {
  const { currentAuthUserId } = useJournal();
  const hasVoted = entry.votedBy?.includes(currentAuthUserId);
  const totalVotes = entry.options.reduce((sum, opt) => sum + opt.votes, 0);

  const handleVote = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!hasVoted) {
      onVote(entry.id, index);
    }
  };
  
  if (hasVoted) {
      return (
          <div className="space-y-2 mt-4">
              {entry.options.map((option, index) => {
                  const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                  return (
                      <div key={index}>
                           <div className="flex items-center justify-between text-sm mb-1">
                              <span>{option.text}</span>
                              <span className="font-bold">{Math.round(percentage)}%</span>
                           </div>
                           <Progress value={percentage} className="h-2" />
                      </div>
                  )
              })}
          </div>
      )
  }

  return (
    <div className="flex flex-col space-y-2 mt-4">
      {entry.options.map((option, index) => (
        <Button
          key={index}
          variant="outline"
          className="w-full justify-center"
          onClick={(e) => handleVote(e, index)}
        >
          {option.text}
        </Button>
      ))}
    </div>
  );
}


function JournalEntryCard({ entry, onSelect, onDelete, onViewHashtag }: { entry: JournalEntry; onSelect: () => void; onDelete: (id: string) => void; onViewHashtag: (tag: string) => void; }) {
  const { toast } = useToast();
  const { toggleBookmark, voteOnEntry, currentAuthUserId } = useJournal();
  const isBookmarked = entry.bookmarkedBy.includes(currentAuthUserId);
  
  const formattedDate = entry.createdAt?.toDate().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) || 'Just now';

  const title = entry.content.split('\n')[0];
  const isOwner = entry.ownerId === currentAuthUserId;

  const handleReport = () => {
    toast({
        title: "Entri Dilaporkan",
        description: "Terima kasih atas laporan Anda. Kami akan meninjaunya."
    });
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click
      onDelete(entry.id);
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  }

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(entry.id);
  }


  return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
    >
        <Card className="cursor-pointer h-full flex flex-col hover:border-primary transition-colors duration-200 relative group" onClick={onSelect}>
            <div className="absolute top-2 right-2 z-10 flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleBookmarkClick}>
                    <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current text-primary")} />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        {isOwner && (
                            <DropdownMenuItem onClick={handleEditClick}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={handleReport}>
                            <Flag className="mr-2 h-4 w-4" />
                            <span>Laporkan</span>
                        </DropdownMenuItem>
                        {isOwner && (
                            <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={handleDeleteClick}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Hapus</span>
                            </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {entry.images && entry.images.length > 0 && (
              <div className="relative w-full h-40">
                <Image
                  src={entry.images[0]}
                  alt={title}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-t-lg"
                />
              </div>
            )}

            <CardHeader className={cn(entry.images && entry.images.length > 0 && "pt-4")}>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    {entry.postType === 'voting' ? <Vote className="h-4 w-4" /> : <BookText className="h-4 w-4" />}
                    <span className="text-xs font-medium uppercase">{entry.postType}</span>
                     <Separator orientation="vertical" className="h-4" />
                    <VisibilityIcon visibility={entry.visibility} />
                    <span className="text-xs font-medium capitalize">{entry.visibility}</span>
                </div>
                <CardTitle className="truncate pr-8">{title}</CardTitle>
                <CardDescription>{formattedDate}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                {entry.postType === 'journal' ? (
                  <HashtagRenderer text={entry.content} onViewHashtag={onViewHashtag} isExcerpt />
                ) : (
                  <VotingSection entry={entry} onVote={voteOnEntry} />
                )}
            </CardContent>
            <Separator className="my-2" />
            <CardFooter className="p-2 pt-0">
                <SupportBar entry={entry} onCommentClick={onSelect} />
            </CardFooter>
        </Card>
    </motion.div>
  );
}

function EmptyState({ onNewPost }: { onNewPost: (type: PostType) => void }) {
    return (
      <div className="text-center p-8 flex flex-col items-center justify-center h-full col-span-full">
        <div className="p-4 bg-secondary rounded-full mb-4">
          <BookText className="w-16 h-16 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Belum ada postingan</h3>
        <p className="text-muted-foreground mb-4">
          Klik tombol di bawah untuk membuat postingan pertama Anda.
        </p>
        <Button onClick={() => onNewPost('journal')}>
            <FilePlus className="mr-2" />
            Buat Entri Baru
        </Button>
      </div>
    );
  }

export function JournalListPage({ onSelectEntry, onNewPost, onViewHashtag }: { onSelectEntry: (id: string | null) => void; onNewPost: (type: PostType) => void; onViewHashtag: (tag: string) => void; }) {
  const { entries, deleteEntry, isLoaded, currentAuthUserId } = useJournal();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredEntries = useMemo(() => {
    return entries
      .filter(entry => {
        const isMatch = (entry.content.toLowerCase().includes(searchTerm.toLowerCase()) || entry.hashtags?.some(h => h.includes(searchTerm.toLowerCase()))) && entry.postType !== 'capsule';
        if (!isMatch) return false;

        const isOwner = entry.ownerId === currentAuthUserId;
        if (entry.visibility === 'public') return true;
        if (isOwner) return true;
        if (entry.visibility === 'restricted' && entry.allowedUserIds.includes(currentAuthUserId || '')) return true;

        return false;
      })
      .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  }, [entries, searchTerm, currentAuthUserId]);

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEntries, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
        <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
                <Icons.logo className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline text-foreground">
                    Linimasa
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-40">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Cari postingan atau #tag..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <FilePlus className="mr-2" />
                        Postingan Baru
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuGroup>
                           <DropdownMenuItem onClick={() => onNewPost('journal')}>
                               <BookText className="mr-2 h-4 w-4" />
                               <span>Jurnal</span>
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => onNewPost('voting')}>
                               <Vote className="mr-2 h-4 w-4" />
                               <span>Voting</span>
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => onNewPost('capsule')}>
                               <Hourglass className="mr-2 h-4 w-4" />
                               <span>Kapsul Waktu</span>
                           </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                 </DropdownMenu>
                <div className="hidden md:flex items-center gap-2">
                    <ThemeToggle />
                </div>
            </div>
        </header>

        {!isLoaded ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-full mt-2" />
                             <Skeleton className="h-4 w-2/3 mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : filteredEntries.length === 0 ? (
            <EmptyState onNewPost={onNewPost} />
        ) : (
            <>
                <AnimatePresence>
                    <motion.div 
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {paginatedEntries.map(entry => (
                            <JournalEntryCard 
                                key={entry.id} 
                                entry={entry} 
                                onSelect={() => onSelectEntry(entry.id)}
                                onDelete={deleteEntry}
                                onViewHashtag={onViewHashtag}
                            />
                        ))}
                    </motion.div>
                </AnimatePresence>
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <Button onClick={handlePrevPage} disabled={currentPage === 1} variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Sebelumnya
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Halaman {currentPage} dari {totalPages}
                        </span>
                        <Button onClick={handleNextPage} disabled={currentPage === totalPages} variant="outline">
                            Berikutnya
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}
            </>
        )}
    </div>
  );
}
