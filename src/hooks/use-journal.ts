"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

export type JournalEntry = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const initialEntries: JournalEntry[] = [
    {
      id: '1',
      content: "This is my first journal entry. It's a beautiful day to start reflecting on my thoughts. I'm excited to see where this journey takes me.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      content: 'I had a great idea today for a new project. It involves combining my passion for painting and technology. I need to flesh out the details, but the initial concept feels very promising.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
];


export function useJournal() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedEntries = localStorage.getItem('anonjournal-entries');
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
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
        localStorage.setItem('anonjournal-entries', JSON.stringify(entries));
      } catch (error) {
        console.error('Failed to save journal entries to localStorage', error);
      }
    }
  }, [entries, isLoaded]);

  const addEntry = useCallback((content: string) => {
    if (!content.trim()) {
        toast({
            title: 'Empty Entry',
            description: "You can't save an empty journal entry.",
            variant: 'destructive',
        });
        return null;
    }
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEntries(prev => [newEntry, ...prev]);
    toast({
        title: 'Entry Saved',
        description: 'Your new journal entry has been saved.',
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
        title: 'Entry Updated',
        description: 'Your journal entry has been updated.',
    });
  }, [toast]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
    toast({
        title: 'Entry Deleted',
        description: 'Your journal entry has been deleted.',
        variant: 'destructive',
    });
  }, [toast]);

  return { entries, addEntry, updateEntry, deleteEntry, isLoaded };
}
