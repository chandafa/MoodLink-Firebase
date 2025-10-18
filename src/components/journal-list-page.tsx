

'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useJournal, type JournalEntry, PostType, Visibility } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from './theme-toggle';
import { ArrowLeft, ArrowRight, BookText, FilePlus, Search, Hourglass, Vote, CheckCircle2 } from 'lucide-react';
import { JournalEntryCard } from './journal-list-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";


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
  
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function Feed({ entries, onSelectEntry, onViewHashtag, onViewImage, deleteEntry, getUserForEntry }: { entries: JournalEntry[], onSelectEntry: (id: string | null) => void; onViewHashtag: (tag: string) => void; onViewImage: (url: string) => void, deleteEntry: (id: string) => void, getUserForEntry: (ownerId: string) => any }) {
    
    if (entries.length === 0) {
        return <p className="text-muted-foreground text-center py-10 col-span-full">Tidak ada postingan untuk ditampilkan.</p>
    }

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            {entries.map(entry => (
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
    )
}

export function JournalListPage({ onSelectEntry, onViewHashtag, onViewImage }: { onSelectEntry: (id: string | null) => void; onViewHashtag: (tag: string) => void; onViewImage: (url: string) => void; }) {
  const { entries, users, deleteEntry, isLoaded, currentAuthUserId, currentUser } = useJournal();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
    <div className="container mx-auto px-4">
        <header className="sticky top-0 z-10 flex items-center justify-between py-4 bg-background/80 backdrop-blur-sm -mx-4 px-4 mb-4">
            <div className="flex items-center gap-3">
                <BookText className="h-7 w-7 text-primary" />
            </div>
            <div className="flex flex-1 justify-end items-center gap-2">
                 <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
                    <Search className="h-5 w-5" />
                </Button>
                <ThemeToggle />
            </div>
        </header>

        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cari Postingan</DialogTitle>
              <DialogDescription>
                Cari berdasarkan konten atau tagar.
              </DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Cari postingan atau #tag..."
                className="pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="for-you" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="for-you">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
          <div className="mt-6">
            {!isLoaded ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {Array.from({ length: 9 }).map((_, i) => (
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
