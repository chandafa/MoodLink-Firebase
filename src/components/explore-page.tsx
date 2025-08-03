'use client';

import { Compass, Hash } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { useTrendingHashtags } from '@/hooks/use-hashtags';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export function ExplorePage({ onViewHashtag }: { onViewHashtag: (tag: string) => void }) {
  const { hashtags, isLoading } = useTrendingHashtags(15);

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="flex items-center gap-3 mb-8">
        <Compass className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Jelajahi
        </h1>
      </header>
      
      <Card>
        <CardHeader>
            <CardTitle>Topik Populer</CardTitle>
            <CardDescription>Lihat tagar yang sedang tren saat ini.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({length: 7}).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
            ) : (
                <ul className="divide-y divide-border">
                    {hashtags.map((tag) => (
                        <li 
                            key={tag.name} 
                            className="p-3 hover:bg-accent cursor-pointer flex justify-between items-center"
                            onClick={() => onViewHashtag(tag.name)}
                        >
                            <div>
                                <p className="font-bold flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground"/>{tag.name}</p>
                                <p className="text-sm text-muted-foreground">{tag.count} postingan</p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(tag.updatedAt.toDate(), { locale: id, addSuffix: true })}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
