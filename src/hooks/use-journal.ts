"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

export type Comment = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

export type User = {
    id: string;
    displayName: string;
    avatar: string;
    bio: string;
    followers: string[];
    following: string[];
    points: number;
    level: number;
}

export type PostType = 'journal' | 'voting';

export type VoteOption = {
  text: string;
  votes: number;
};

export type JournalEntry = {
  id: string;
  ownerId: string;
  postType: PostType;
  content: string; // For journal: content, for voting: question
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  likes: number;
  likedBy: string[];
  bookmarkedBy: string[];
  images: string[];
  // Voting specific
  options: VoteOption[];
  votedBy: string[];
};

const initialUsers: User[] = [
    { id: 'user-123', displayName: 'Creator', avatar: '✍️', bio: 'The original author.', followers: ['another-user-456'], following: ['another-user-456'], points: 15, level: 1 },
    { id: 'another-user-456', displayName: 'KindStranger', avatar: '😊', bio: 'Just a friendly stranger on the web.', followers: ['user-123'], following: ['user-123'], points: 5, level: 1 },
];


const initialEntries: JournalEntry[] = [
    {
      id: '1',
      ownerId: 'user-123', // This entry belongs to the "current user"
      postType: 'journal',
      content: "This is my first journal entry. It's a beautiful day to start reflecting on my thoughts. I'm excited to see where this journey takes me.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      comments: [
        { id: 'c1', author: 'KindStranger', content: 'What a wonderful start!', createdAt: new Date().toISOString() }
      ],
      likes: 10,
      likedBy: ['another-user-456'],
      bookmarkedBy: ['user-123'],
      images: ['https://placehold.co/600x400.png?text=Reflection'],
      options: [],
      votedBy: [],
    },
    {
      id: '2',
      ownerId: 'another-user-456', // This entry belongs to another user
      postType: 'journal',
      content: 'I had a great idea today for a new project. It involves combining my passion for painting and technology. I need to flesh out the details, but the initial concept feels very promising.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      comments: [],
      likes: 5,
      likedBy: ['user-123'],
      bookmarkedBy: [],
      images: [],
      options: [],
      votedBy: [],
    },
     {
      id: '3',
      ownerId: 'user-123',
      postType: 'voting',
      content: 'What should I learn next?',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      comments: [],
      likes: 2,
      likedBy: [],
      bookmarkedBy: ['user-123'],
      images: [],
      options: [
          { text: 'React Native', votes: 12 },
          { text: 'Go (Golang)', votes: 8 },
          { text: 'Rust', votes: 5 },
      ],
      votedBy: ['another-user-456'],
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

const POINTS_PER_LEVEL = 50;

export function useJournal() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

   const addPoints = useCallback((userId: string, amount: number) => {
    setUsers(prevUsers => {
      const newUsers = prevUsers.map(user => {
        if (user.id === userId) {
          const newPoints = user.points + amount;
          const newLevel = Math.floor(newPoints / POINTS_PER_LEVEL) + 1;
          if (newLevel > user.level) {
             toast({ title: "Level Up!", description: `Selamat, Anda mencapai Level ${newLevel}!`});
          }
          return { ...user, points: newPoints, level: newLevel };
        }
        return user;
      });
      return newUsers;
    });
  }, [toast]);

  useEffect(() => {
    // Load Users
    try {
        const storedUsers = localStorage.getItem('moodlink-users');
        if (storedUsers) {
            const parsedUsers = JSON.parse(storedUsers);
            const migratedUsers = parsedUsers.map((u: Partial<User>) => ({
              ...u,
              points: u.points ?? 0,
              level: u.level ?? 1,
              followers: u.followers ?? [],
              following: u.following ?? [],
            }));
            setUsers(migratedUsers);
        } else {
            setUsers(initialUsers);
        }
    } catch(error) {
        console.error("Failed to load users", error);
        setUsers(initialUsers);
    }

    // Load Entries
    try {
      const storedEntries = localStorage.getItem('moodlink-entries');
      if (storedEntries) {
        const parsedEntries = JSON.parse(storedEntries);
        // Ensure all entries have the new properties
        const migratedEntries = parsedEntries.map((e: Partial<JournalEntry>): JournalEntry => ({
          id: e.id || '',
          ownerId: e.ownerId || '',
          postType: e.postType ?? 'journal',
          content: e.content || '',
          createdAt: e.createdAt || new Date().toISOString(),
          updatedAt: e.updatedAt || new Date().toISOString(),
          likes: e.likes ?? 0,
          likedBy: e.likedBy ?? [],
          comments: e.comments ?? [],
          bookmarkedBy: e.bookmarkedBy ?? [],
          images: e.images ?? [],
          options: e.options ?? [],
          votedBy: e.votedBy ?? [],
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
        localStorage.setItem('moodlink-users', JSON.stringify(users));
      } catch (error) {
        console.error('Failed to save data to localStorage', error);
      }
    }
  }, [entries, users, isLoaded]);

  const addEntry = useCallback((content: string, images: string[], postType: PostType, options: string[]) => {
    if (!content.trim()) {
        toast({
            title: 'Konten Kosong',
            description: "Konten postingan tidak boleh kosong.",
            variant: 'destructive',
        });
        return null;
    }
    if (postType === 'voting' && options.some(opt => !opt.trim())) {
      toast({
        title: 'Opsi Voting Kosong',
        description: 'Opsi voting tidak boleh kosong.',
        variant: 'destructive'
      });
      return null;
    }

    const currentUserId = getCurrentUserId();
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      ownerId: currentUserId,
      content,
      postType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      likes: 0,
      likedBy: [],
      bookmarkedBy: [],
      images,
      options: postType === 'voting' ? options.map(opt => ({ text: opt, votes: 0 })) : [],
      votedBy: [],
    };
    setEntries(prev => [newEntry, ...prev]);
    addPoints(currentUserId, 5); // +5 points for new entry
    toast({
        title: 'Postingan Tersimpan',
        description: 'Postingan baru Anda telah disimpan.',
    });
    return newEntry;
  }, [toast, addPoints]);

  const updateEntry = useCallback((id: string, content: string, images: string[], options: string[]) => {
    setEntries(prev =>
      prev.map(entry => {
        if (entry.id === id) {
          const updatedEntry = { ...entry, content, images, updatedAt: new Date().toISOString() };
          if (updatedEntry.postType === 'voting') {
            updatedEntry.options = options.map((optText, index) => ({
              text: optText,
              votes: entry.options[index]?.votes || 0, // Keep existing votes
            }));
          }
          return updatedEntry;
        }
        return entry;
      })
    );
    toast({
        title: 'Postingan Diperbarui',
        description: 'Postingan Anda telah diperbarui.',
    });
  }, [toast]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
    toast({
        title: 'Postingan Dihapus',
        description: 'Postingan Anda telah dihapus.',
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

    let entryOwnerId: string | null = null;
    setEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        entryOwnerId = entry.ownerId;
        return { ...entry, comments: [...(entry.comments || []), newComment] };
      }
      return entry;
    }));

    if (entryOwnerId) {
      addPoints(entryOwnerId, 2); // +2 points for receiving a comment
    }

    toast({
        title: 'Komentar Ditambahkan',
        description: 'Komentar Anda telah dipublikasikan.'
    });

  }, [toast, addPoints]);

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
                addPoints(entry.ownerId, 1); // +1 point for entry owner
                return {
                    ...entry,
                    likes: entry.likes + 1,
                    likedBy: [...entry.likedBy, currentUserId]
                };
            }
        }
        return entry;
    }));
  }, [addPoints]);

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

    toast({
        title: isBookmarkedCurrently ? 'Bookmark Dihapus' : 'Bookmark Ditambah' 
    });
    
  }, [toast]);

  const toggleFollow = useCallback((targetUserId: string) => {
    const currentUserId = getCurrentUserId();
    if (currentUserId === targetUserId) return;

    let isFollowingCurrently = false;
    
    setUsers(prevUsers => {
        const currentUser = prevUsers.find(u => u.id === currentUserId);
        if (currentUser) {
            isFollowingCurrently = currentUser.following.includes(targetUserId);
        }

        return prevUsers.map(user => {
            // Update current user's following list
            if (user.id === currentUserId) {
                if (isFollowingCurrently) {
                    return { ...user, following: user.following.filter(id => id !== targetUserId) };
                } else {
                    return { ...user, following: [...user.following, targetUserId] };
                }
            }
            // Update target user's followers list
            if (user.id === targetUserId) {
                if (user.followers.includes(currentUserId)) {
                    return { ...user, followers: user.followers.filter(id => id !== currentUserId) };
                } else {
                    addPoints(targetUserId, 2); // +2 points for getting a follower
                    return { ...user, followers: [...user.followers, currentUserId] };
                }
            }
            return user;
        });
    });

    toast({
        title: isFollowingCurrently ? 'Berhenti Mengikuti' : 'Mulai Mengikuti',
        description: `Anda sekarang ${isFollowingCurrently ? 'tidak lagi' : ''} mengikuti pengguna ini.`,
    });
}, [toast, addPoints]);

  const voteOnEntry = useCallback((entryId: string, optionIndex: number) => {
    const currentUserId = getCurrentUserId();
    setEntries(prevEntries => 
      prevEntries.map(entry => {
        if (entry.id === entryId && entry.postType === 'voting' && !entry.votedBy.includes(currentUserId)) {
          const newOptions = [...entry.options];
          newOptions[optionIndex] = { ...newOptions[optionIndex], votes: newOptions[optionIndex].votes + 1 };
          
          addPoints(currentUserId, 1); // +1 point for voting
          
          return {
            ...entry,
            options: newOptions,
            votedBy: [...entry.votedBy, currentUserId],
          };
        }
        return entry;
      })
    );
  }, [addPoints]);


  return { entries, users, addEntry, updateEntry, deleteEntry, addComment, toggleLike, toggleBookmark, toggleFollow, voteOnEntry, isLoaded };
}
