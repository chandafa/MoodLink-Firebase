
'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useJournal, type JournalEntry, PostType, Visibility } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from './icons';
import { ThemeToggle } from './theme-toggle';
import { ArrowLeft, ArrowRight, BookText, FilePlus, Search, Hourglass, Vote } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { JournalEntryCard } from './journal-list-card';

const ITEMS_PER_PAGE = 6;

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

export function JournalListPage({ onSelectEntry, onNewPost, onViewHashtag, onViewImage }: { onSelectEntry: (id: string | null) => void; onNewPost: (type: PostType) => void; onViewHashtag: (tag: string) => void; onViewImage: (url: string) => void; }) {
  const { entries, users, deleteEntry, isLoaded, currentAuthUserId } = useJournal();
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
        if (entry.visibility === 'restricted' && entry.allowedUserIds?.includes(currentAuthUserId || '')) return true;

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

  const getUserForEntry = (ownerId: string) => users.find(u => u.id === ownerId);

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
            <div className="space-y-4">
                 {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                    <Card key={i} className="p-4">
                      <div className="flex gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </div>
                    </Card>
                ))}
            </div>
        ) : filteredEntries.length === 0 ? (
            <EmptyState onNewPost={onNewPost} />
        ) : (
            <>
                <motion.div 
                    layout
                    className="space-y-4"
                >
                    {paginatedEntries.map(entry => (
                        <JournalEntryCard 
                            key={entry.id} 
                            entry={entry}
                            author={getUserForEntry(entry.ownerId)}
                            onSelect={() => onSelectEntry(entry.id)}
                            onDelete={deleteEntry}
                            onViewHashtag={onViewHashtag}
                            onViewImage={onViewImage}
                        />
                    ))}
                </motion.div>
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
