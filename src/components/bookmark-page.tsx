
'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useJournal, type JournalEntry, User } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from './icons';
import { Bookmark, ArrowLeft } from 'lucide-react';
import { JournalEntryCard } from './journal-list-card';

function EmptyState() {
  return (
    <div className="text-center p-8 flex flex-col items-center justify-center h-full col-span-full">
      <div className="p-4 bg-secondary rounded-full mb-4">
        <Bookmark className="w-16 h-16 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Tidak ada jurnal yang disimpan</h3>
      <p className="text-muted-foreground mb-4">
        Anda dapat menyimpan jurnal dengan menekan ikon bookmark.
      </p>
    </div>
  );
}

export function BookmarkPage({ onSelectEntry, onBack, onViewHashtag, onViewImage }: { onSelectEntry: (id: string | null) => void; onBack: () => void; onViewHashtag: (tag: string) => void; onViewImage: (url: string) => void; }) {
  const { entries, users, isLoaded, currentAuthUserId, deleteEntry } = useJournal();

  const bookmarkedEntries = useMemo(() => {
    if (!currentAuthUserId) return [];
    return entries
      .filter(entry => (entry.bookmarkedBy || []).includes(currentAuthUserId))
      .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  }, [entries, currentAuthUserId]);
  
  const getUserForEntry = (ownerId: string): User | undefined => users.find(u => u.id === ownerId);

  return (
    <div>
      {!isLoaded ? (
         <div className="space-y-4 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
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
      ) : bookmarkedEntries.length === 0 ? (
        <EmptyState />
      ) : (
        <AnimatePresence>
          <motion.div
            layout
            className="space-y-4 mt-6"
          >
            {bookmarkedEntries.map(entry => (
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
        </AnimatePresence>
      )}
    </div>
  );
}
