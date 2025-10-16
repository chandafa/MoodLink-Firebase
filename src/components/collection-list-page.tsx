
'use client';

import { useJournal, type JournalCollection } from '@/hooks/use-journal';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BookCopy, PlusCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from './ui/skeleton';

function CollectionCard({ collection, onBuild }: { collection: JournalCollection; onBuild: (id: string) => void; }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>{collection.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{collection.description || 'Tidak ada deskripsi.'}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">{collection.entryIds.length} postingan</p>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={() => onBuild(collection.id)}>
                        Edit Koleksi <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}

function EmptyState({ onBuild }: { onBuild: (id: null) => void; }) {
  return (
    <div className="text-center p-8 flex flex-col items-center justify-center h-full col-span-full border-2 border-dashed rounded-lg">
      <div className="p-4 bg-secondary rounded-full mb-4">
        <BookCopy className="w-16 h-16 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Belum ada koleksi jurnal</h3>
      <p className="text-muted-foreground mb-4">
        Buat koleksi untuk mengelompokkan jurnal Anda berdasarkan tema atau cerita.
      </p>
      <Button onClick={() => onBuild(null)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Buat Koleksi Baru
      </Button>
    </div>
  );
}

export function CollectionListPage({ onBuildCollection }: { onBuildCollection: (id: string | null) => void; }) {
  const { collections, isLoaded } = useJournal();

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Koleksi Jurnal Saya</h2>
            <Button onClick={() => onBuildCollection(null)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Buat Baru
            </Button>
        </div>

        {!isLoaded ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-1/4" />
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-10 w-1/2" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        ) : collections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map(collection => (
                    <CollectionCard key={collection.id} collection={collection} onBuild={onBuildCollection} />
                ))}
            </div>
        ) : (
            <EmptyState onBuild={onBuildCollection} />
        )}
    </div>
  );
}
