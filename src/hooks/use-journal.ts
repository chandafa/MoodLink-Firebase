"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

export type Comment = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

export type JournalEntry = {
  id: string;
  ownerId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  likes: number;
  likedBy: string[];
  bookmarkedBy: string[];
};

const initialEntries: JournalEntry[] = [
    {
      id: '1',
      ownerId: 'user-123', // This entry belongs to the "current user"
      content: "This is my first journal entry. It's a beautiful day to start reflecting on my thoughts. I'm excited to see where this journey takes me.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      comments: [
        { id: 'c1', author: 'KindStranger', content: 'What a wonderful start!', createdAt: new Date().toISOString() }
      ],
      likes: 10,
      likedBy: ['another-user-456'],
      bookmarkedBy: ['user-123'],
    },
    {
      id: '2',
      ownerId: 'another-user-456', // This entry belongs to another user
      content: 'I had a great idea today for a new project. It involves combining my passion for painting and technology. I need to flesh out the details, but the initial concept feels very promising.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      comments: [],
      likes: 5,
      likedBy: ['user-123'],
      bookmarkedBy: [],
    },
     {
      id: '3',
      ownerId: 'user-123',
      content: 'Feeling a bit nostalgic today, thinking about past travels and adventures. Every memory is a treasure.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      comments: [],
      likes: 2,
      likedBy: [],
      bookmarkedBy: ['user-123'],
    },
];

// Mock current user ID. In a real app, this would come from an auth context.
export const getCurrentUserId = () => {
    let userId = localStorage.getItem('moodlink-user-id');
    if (!userId) {
        userId = 'user-123'; // Default user for demo
        localStorage.setItem('moodlink-user-id', userId);
    }
    return userId;
}

export function useJournal() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedEntries = localStorage.getItem('moodlink-entries');
      if (storedEntries) {
        const parsedEntries = JSON.parse(storedEntries);
        // Ensure all entries have the new properties
        const migratedEntries = parsedEntries.map((e: Partial<JournalEntry>) => ({
          ...e,
          likes: e.likes ?? 0,
          likedBy: e.likedBy ?? [],
          comments: e.comments ?? [],
          bookmarkedBy: e.bookmarkedBy ?? [],
        }));
        setEntries(migratedEntries);
      } else {
        setEntries(initialEntries);
      }
    } catch (error) {
      console.error('Failed to load journal entries from localStorage', error);
      setEntries(initialEntries);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('moodlink-entries', JSON.stringify(entries));
      } catch (error) {
        console.error('Failed to save journal entries to localStorage', error);
      }
    }
  }, [entries, isLoaded]);

  const addEntry = useCallback((content: string) => {
    if (!content.trim()) {
        toast({
            title: 'Entri Kosong',
            description: "Anda tidak bisa menyimpan entri jurnal yang kosong.",
            variant: 'destructive',
        });
        return null;
    }
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      ownerId: getCurrentUserId(),
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      likes: 0,
      likedBy: [],
      bookmarkedBy: [],
    };
    setEntries(prev => [newEntry, ...prev]);
    toast({
        title: 'Entri Tersimpan',
        description: 'Entri jurnal baru Anda telah disimpan.',
    });
    return newEntry;
  }, [toast]);

  const updateEntry = useCallback((id: string, content: string) => {
    setEntries(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, content, updatedAt: new Date().toISOString() } : entry
      )
    );
    toast({
        title: 'Entri Diperbarui',
        description: 'Entri jurnal Anda telah diperbarui.',
    });
  }, [toast]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
    toast({
        title: 'Entri Dihapus',
        description: 'Entri jurnal Anda telah dihapus.',
        variant: 'destructive',
    });
  }, [toast]);

  const addComment = useCallback((entryId: string, commentContent: string, author: string) => {
    if (!commentContent.trim()) {
      toast({
        title: 'Komentar Kosong',
        description: 'Komentar tidak boleh kosong.',
        variant: 'destructive'
      });
      return;
    }
    
    const newComment: Comment = {
      id: Date.now().toString(),
      author: author || 'Anonim',
      content: commentContent,
      createdAt: new Date().toISOString()
    };

    setEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { ...entry, comments: [...(entry.comments || []), newComment] }
        : entry
    ));

    toast({
        title: 'Komentar Ditambahkan',
        description: 'Komentar Anda telah dipublikasikan.'
    });

  }, [toast]);

  const toggleLike = useCallback((entryId: string) => {
    const currentUserId = getCurrentUserId();
    setEntries(prev => prev.map(entry => {
        if (entry.id === entryId) {
            const isLiked = entry.likedBy.includes(currentUserId);
            if (isLiked) {
                return {
                    ...entry,
                    likes: entry.likes - 1,
                    likedBy: entry.likedBy.filter(id => id !== currentUserId)
                };
            } else {
                return {
                    ...entry,
                    likes: entry.likes + 1,
                    likedBy: [...entry.likedBy, currentUserId]
                };
            }
        }
        return entry;
    }));
  }, []);

  const toggleBookmark = useCallback((entryId: string) => {
    const currentUserId = getCurrentUserId();
    let isBookmarkedCurrently = false;

    setEntries(prev => {
        const newEntries = prev.map(entry => {
            if (entry.id === entryId) {
                const isBookmarked = entry.bookmarkedBy.includes(currentUserId);
                isBookmarkedCurrently = isBookmarked;
                if (isBookmarked) {
                    return {
                        ...entry,
                        bookmarkedBy: entry.bookmarkedBy.filter(id => id !== currentUserId)
                    };
                } else {
                    return {
                        ...entry,
                        bookmarkedBy: [...entry.bookmarkedBy, currentUserId]
                    };
                }
            }
            return entry;
        });
        return newEntries;
    });

    if (isBookmarkedCurrently) {
        toast({ title: 'Bookmark dihapus' });
    } else {
        toast({ title: 'Bookmark ditambah' });
    }
  }, [toast]);

  return { entries, addEntry, updateEntry, deleteEntry, addComment, toggleLike, toggleBookmark, isLoaded };
}
