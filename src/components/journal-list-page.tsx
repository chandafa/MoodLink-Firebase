
'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useJournal, type JournalEntry, PostType, Visibility } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from './theme-toggle';
import { ArrowLeft, ArrowRight, BookText, FilePlus, Search, Hourglass, Vote } from 'lucide-react';
import { JournalEntryCard } from './journal-list-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ITEMS_PER_PAGE = 12;

function EmptyState() {
    return (
      <div className="text-center p-8 flex flex-col items-center justify-center h-full col-span-full">
        <div className="p-4 bg-secondary rounded-full mb-4">
          <BookText className="w-16 h-16 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Belum ada postingan</h3>
        <p className="text-muted-foreground mb-4">
          Klik tombol di bawah untuk membuat postingan pertama Anda.
        </p>
      </div>
    );
  }
  
function Feed({ entries, onSelectEntry, onViewHashtag, onViewImage, deleteEntry, getUserForEntry }: { entries: JournalEntry[], onSelectEntry: (id: string | null) => void; onViewHashtag: (tag: string) => void; onViewImage: (url: string) => void, deleteEntry: (id: string) => void, getUserForEntry: (ownerId: string) => any }) {
    const [currentPage, setCurrentPage] = useState(1);
    
    const totalPages = Math.ceil(entries.length / ITEMS_PER_PAGE);
    const paginatedEntries = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return entries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [entries, currentPage]);

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
    
    if (entries.length === 0) {
        return <p className="text-muted-foreground text-center py-10 col-span-full">Tidak ada postingan untuk ditampilkan.</p>
    }

    return (
        <>
            <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
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
                <div className="flex justify-center items-center gap-4 mt-8 col-span-full">
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
    )
}

export function JournalListPage({ onSelectEntry, onViewHashtag, onViewImage }: { onSelectEntry: (id: string | null) => void; onViewHashtag: (tag: string) => void; onViewImage: (url: string) => void; }) {
  const { entries, users, deleteEntry, isLoaded, currentAuthUserId, currentUser } = useJournal();
  const [searchTerm, setSearchTerm] = useState('');

  const forYouEntries = useMemo(() => {
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

  const followingEntries = useMemo(() => {
    if (!currentUser) return [];
    return entries
      .filter(entry => {
          const isFollowing = currentUser.following.includes(entry.ownerId);
          if (!isFollowing) return false;

          const isMatch = (entry.content.toLowerCase().includes(searchTerm.toLowerCase()) || entry.hashtags?.some(h => h.includes(searchTerm.toLowerCase()))) && entry.postType !== 'capsule';
          if (!isMatch) return false;
          
          const isOwner = entry.ownerId === currentAuthUserId;
          if (entry.visibility === 'public') return true;
          if (isOwner) return true;
          if (entry.visibility === 'restricted' && entry.allowedUserIds?.includes(currentAuthUserId || '')) return true;

          return false;
      })
      .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

  }, [entries, searchTerm, currentUser, currentAuthUserId]);

  const getUserForEntry = (ownerId: string) => users.find(u => u.id === ownerId);

  return (
    <div className="container mx-auto py-8 px-4">
        <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
                <BookText className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline text-foreground">
                    MoodLink
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
                <div className="hidden md:flex items-center gap-2">
                    <ThemeToggle />
                </div>
            </div>
        </header>

        <Tabs defaultValue="for-you" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="for-you">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
          <div className="mt-6">
            {!isLoaded ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            ) : forYouEntries.length === 0 && searchTerm === '' ? (
                <EmptyState />
            ) : (
                <>
                  <TabsContent value="for-you">
                    <Feed 
                      entries={forYouEntries}
                      onSelectEntry={onSelectEntry}
                      onViewHashtag={onViewHashtag}
                      onViewImage={onViewImage}
                      deleteEntry={deleteEntry}
                      getUserForEntry={getUserForEntry}
                    />
                  </TabsContent>
                  <TabsContent value="following">
                    <Feed 
                      entries={followingEntries}
                      onSelectEntry={onSelectEntry}
                      onViewHashtag={onViewHashtag}
                      onViewImage={onViewImage}
                      deleteEntry={deleteEntry}
                      getUserForEntry={getUserForEntry}
                    />
                  </TabsContent>
                </>
            )}
          </div>
        </Tabs>
    </div>
  );
}
