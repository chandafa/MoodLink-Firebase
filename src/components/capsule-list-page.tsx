'use client';

import { useState, useMemo } from 'react';
import { useJournal, JournalEntry } from '@/hooks/use-journal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Icons } from './icons';
import { Hourglass, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from './ui/skeleton';
import { formatDistanceToNow, isPast } from 'date-fns';
import { id } from 'date-fns/locale';

function CapsuleCard({ entry, onSelect }: { entry: JournalEntry; onSelect: (id: string) => void }) {
    const isOpen = isPast(entry.openAt.toDate());
    
    const timeToOpen = formatDistanceToNow(entry.openAt.toDate(), { addSuffix: true, locale: id });
    const openedAt = entry.openAt.toDate().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            onClick={() => isOpen && onSelect(entry.id)}
            className={isOpen ? "cursor-pointer" : "cursor-not-allowed"}
        >
            <Card className="h-full flex flex-col hover:border-primary transition-colors duration-200">
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <CardTitle className="truncate">{entry.content.split('\n')[0]}</CardTitle>
                         {isOpen ? <Unlock className="h-5 w-5 text-green-500" /> : <Lock className="h-5 w-5 text-destructive" />}
                    </div>
                    <CardDescription>
                        {isOpen ? `Dibuka pada ${openedAt}` : `Akan terbuka ${timeToOpen}`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {isOpen ? entry.content.substring(entry.content.indexOf('\n') + 1) || entry.content : 'Konten masih disegel dalam kapsul waktu...'}
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function EmptyState() {
  return (
    <div className="text-center p-8 flex flex-col items-center justify-center h-full col-span-full">
      <div className="p-4 bg-secondary rounded-full mb-4">
        <Hourglass className="w-16 h-16 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Belum ada kapsul waktu</h3>
      <p className="text-muted-foreground">
        Kapsul waktu yang Anda buat akan muncul di sini.
      </p>
    </div>
  );
}

export function CapsuleListPage({ onSelectEntry }: { onSelectEntry: (id: string | null) => void; }) {
  const { entries, isLoaded, currentAuthUserId } = useJournal();

  const { lockedCapsules, unlockedCapsules } = useMemo(() => {
    if (!currentAuthUserId) return { lockedCapsules: [], unlockedCapsules: [] };

    const capsules = entries
      .filter(entry => entry.postType === 'capsule' && entry.ownerId === currentAuthUserId)
      .sort((a, b) => (b.openAt?.toMillis() || 0) - (a.openAt?.toMillis() || 0));
    
    return {
        lockedCapsules: capsules.filter(c => !isPast(c.openAt.toDate())),
        unlockedCapsules: capsules.filter(c => isPast(c.openAt.toDate())),
    };
  }, [entries, currentAuthUserId]);

  return (
    <div>
        <h2 className="text-2xl font-bold mb-4">Kapsul Waktu</h2>
        <Tabs defaultValue="locked">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="locked">Terkunci ({lockedCapsules.length})</TabsTrigger>
                <TabsTrigger value="unlocked">Terbuka ({unlockedCapsules.length})</TabsTrigger>
            </TabsList>
            <AnimatePresence mode="wait">
            <motion.div
                 key={isLoaded ? "loaded" : "skeleton"}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.2 }}
                 className="mt-6"
            >
            {!isLoaded ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2 mt-2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3 mt-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
              <>
                <TabsContent value="locked">
                    {lockedCapsules.length > 0 ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {lockedCapsules.map(entry => (
                                <CapsuleCard key={entry.id} entry={entry} onSelect={onSelectEntry} />
                            ))}
                         </div>
                    ) : <EmptyState />}
                </TabsContent>
                <TabsContent value="unlocked">
                    {unlockedCapsules.length > 0 ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {unlockedCapsules.map(entry => (
                                <CapsuleCard key={entry.id} entry={entry} onSelect={onSelectEntry} />
                            ))}
                         </div>
                    ) : <EmptyState />}
                </TabsContent>
              </>
            )}
            </motion.div>
            </AnimatePresence>
        </Tabs>
    </div>
  );
}
