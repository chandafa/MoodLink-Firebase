'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useHashtagEntries } from '@/hooks/use-hashtags';
import { useJournal, type JournalEntry } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Hash } from 'lucide-react';
import { JournalListPage } from './journal-list-page'; // A bit of a circular dependency, but let's reuse the card
import { JournalEntryCard } from './journal-list-card'; // Let's extract the card to its own component

export default function HashtagPage({
  hashtag,
  onBack,
  onSelectEntry,
}: {
  hashtag: string;
  onBack: () => void;
  onSelectEntry: (id: string | null) => void;
}) {
  const { currentAuthUserId, deleteEntry } = useJournal();
  const { entries, isLoading } = useHashtagEntries(hashtag, currentAuthUserId);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-40 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
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
        <AnimatePresence>
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {entries.map(entry => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onSelect={() => onSelectEntry(entry.id)}
                onDelete={deleteEntry}
                onViewHashtag={() => {}} // We are already on a hashtag page
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
