
'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useHashtagEntries } from '@/hooks/use-hashtags';
import { useJournal, type JournalEntry, User } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Hash } from 'lucide-react';
import { JournalEntryCard } from './journal-list-card'; 

export default function HashtagPage({
  hashtag,
  onBack,
  onSelectEntry,
  onViewImage,
}: {
  hashtag: string;
  onBack: () => void;
  onSelectEntry: (id: string | null) => void;
  onViewImage: (url: string) => void;
}) {
  const { currentAuthUserId, deleteEntry, users } = useJournal();
  const { entries, isLoading } = useHashtagEntries(hashtag, currentAuthUserId);

  const getUserForEntry = (ownerId: string): User | undefined => users.find(u => u.id === ownerId);

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="flex items-center gap-3 mb-8">
        <Button onClick={onBack} size="icon" variant="ghost">
          <ArrowLeft />
        </Button>
        <div className="flex items-center gap-2 text-primary">
            <Hash className="h-8 w-8" />
            <h1 className="text-3xl font-bold font-headline text-foreground">
                {hashtag}
            </h1>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
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
      ) : entries.length === 0 ? (
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold">Tidak ada postingan</h3>
          <p className="text-muted-foreground">
            Belum ada postingan publik dengan tagar ini.
          </p>
        </div>
      ) : (
          <motion.div
            layout
            className="space-y-4"
          >
            {entries.map(entry => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                author={getUserForEntry(entry.ownerId)}
                onSelect={() => onSelectEntry(entry.id)}
                onDelete={deleteEntry}
                onViewHashtag={() => {}} // We are already on a hashtag page
                onViewImage={onViewImage}
              />
            ))}
          </motion.div>
      )}
    </div>
  );
}
