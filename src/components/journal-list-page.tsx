'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useJournal, type JournalEntry, getCurrentUserId } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from './icons';
import { ThemeToggle } from './theme-toggle';
import { ArrowLeft, ArrowRight, BookText, FilePlus, MoreVertical, Edit, Flag, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 6;

function JournalEntryCard({ entry, onSelect, onDelete }: { entry: JournalEntry; onSelect: () => void; onDelete: (id: string) => void; }) {
  const { toast } = useToast();
  const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const title = entry.content.split('\n')[0];
  const excerpt = entry.content.substring(entry.content.indexOf('\n') + 1).slice(0, 100) + '...' || title.slice(0, 100);
  const isOwner = entry.ownerId === getCurrentUserId();

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


  return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
    >
        <Card onClick={onSelect} className="cursor-pointer h-full flex flex-col hover:border-primary transition-colors duration-200 relative group">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
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

            <CardHeader>
                <CardTitle className="truncate pr-8">{title}</CardTitle>
                <CardDescription>{formattedDate}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">{excerpt}</p>
            </CardContent>
        </Card>
    </motion.div>
  );
}

function EmptyState({ onNewEntryClick }: { onNewEntryClick: () => void }) {
    return (
      <div className="text-center p-8 flex flex-col items-center justify-center h-full col-span-full">
        <div className="p-4 bg-secondary rounded-full mb-4">
          <BookText className="w-16 h-16 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Jurnal Anda kosong</h3>
        <p className="text-muted-foreground mb-4">
          Klik tombol di bawah untuk memulai entri pertama Anda.
        </p>
        <Button onClick={onNewEntryClick}>
            <FilePlus className="mr-2" />
            Buat Entri Baru
        </Button>
      </div>
    );
  }

export function JournalListPage({ onSelectEntry }: { onSelectEntry: (id: string | null) => void; }) {
  const { entries, deleteEntry, isLoaded } = useJournal();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredEntries = useMemo(() => {
    return entries
      .filter(entry => entry.content.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entries, searchTerm]);

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
                    Jurnal Saya
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-40">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Cari entri..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                 <Button onClick={() => onSelectEntry(null)}>
                    <FilePlus className="mr-2" />
                    Entri Baru
                </Button>
                <div className="hidden md:flex">
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
            <EmptyState onNewEntryClick={() => onSelectEntry(null)} />
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
