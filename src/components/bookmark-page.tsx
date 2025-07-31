'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useJournal, type JournalEntry } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from './icons';
import { Edit, Flag, Trash2, MoreVertical, Bookmark } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { SupportBar } from './support-bar';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import Image from 'next/image';

function JournalEntryCard({ entry, onSelect }: { entry: JournalEntry; onSelect: () => void; }) {
  const { toast } = useToast();
  const { toggleBookmark, currentAuthUserId, deleteEntry } = useJournal();
  const isBookmarked = entry.bookmarkedBy.includes(currentAuthUserId);

  const formattedDate = entry.createdAt?.toDate().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) || 'Just now';

  const title = entry.content.split('\n')[0];
  const excerpt = entry.content.substring(entry.content.indexOf('\n') + 1).slice(0, 100) + '...' || title.slice(0, 100);
  const isOwner = entry.ownerId === currentAuthUserId;

  const handleReport = () => {
    toast({
      title: "Entri Dilaporkan",
      description: "Terima kasih atas laporan Anda. Kami akan meninjaunya."
    });
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEntry(entry.id);
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
        <CardHeader>
          <CardTitle className="truncate pr-8">{title}</CardTitle>
          <CardDescription>{formattedDate}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3">{excerpt}</p>
        </CardContent>
        <Separator className="my-2" />
        <CardFooter className="p-2 pt-0">
          <SupportBar entry={entry} onCommentClick={onSelect} />
        </CardFooter>
      </Card>
    </motion.div>
  );
}

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

export function BookmarkPage({ onSelectEntry }: { onSelectEntry: (id: string | null) => void; }) {
  const { entries, isLoaded, currentAuthUserId } = useJournal();

  const bookmarkedEntries = useMemo(() => {
    if (!currentAuthUserId) return [];
    return entries
      .filter(entry => entry.bookmarkedBy.includes(currentAuthUserId))
      .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  }, [entries, currentAuthUserId]);

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Icons.logo className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline text-foreground">
            Jurnal Tersimpan
          </h1>
        </div>
      </header>

      {!isLoaded ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
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
      ) : bookmarkedEntries.length === 0 ? (
        <EmptyState />
      ) : (
        <AnimatePresence>
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {bookmarkedEntries.map(entry => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onSelect={() => onSelectEntry(entry.id)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
