'use client';

import { useState, useEffect } from 'react';
import { db, collection, query, orderBy, onSnapshot, where, getDocs, limit } from '@/lib/firebase';
import { JournalEntry, PostType, Visibility } from './use-journal';

export type Hashtag = {
  name: string;
  count: number;
  updatedAt: any;
};

// Hook to get trending hashtags
export function useTrendingHashtags(countLimit: number = 10) {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hashtagsRef = collection(db, 'hashtags');
    const q = query(
      hashtagsRef,
      orderBy('count', 'desc'),
      orderBy('updatedAt', 'desc'),
      limit(countLimit)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tags = snapshot.docs.map(doc => doc.data() as Hashtag);
      setHashtags(tags);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching trending hashtags: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [countLimit]);

  return { hashtags, isLoading };
}

// Hook to get entries for a specific hashtag
export function useHashtagEntries(hashtag: string, currentAuthUserId: string | null | undefined) {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!hashtag) {
            setIsLoading(false);
            return;
        };

        const entriesRef = collection(db, 'journals');
        const q = query(
            entriesRef, 
            where('hashtags', 'array-contains', hashtag.toLowerCase()),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
            
            // Client-side filtering for visibility
            const visibleEntries = fetchedEntries.filter(entry => {
                const isOwner = entry.ownerId === currentAuthUserId;
                if (entry.visibility === 'public') return true;
                if (isOwner) return true;
                if (entry.visibility === 'restricted' && entry.allowedUserIds?.includes(currentAuthUserId || '')) return true;
                return false;
            });

            setEntries(visibleEntries);
            setIsLoading(false);
        }, (error) => {
            console.error(`Error fetching entries for #${hashtag}:`, error);
            setIsLoading(false);
        });

        return () => unsubscribe();

    }, [hashtag, currentAuthUserId]);

    return { entries, isLoading };
}
