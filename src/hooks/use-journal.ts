'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import {
  db,
  auth,
  storage,
  getDoc,
  doc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  runTransaction,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from '@/lib/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

// Types remain mostly the same, but createdAt/updatedAt will be handled by Firestore Timestamps
export type Comment = {
  id: string;
  authorId: string;
  authorName: string; // denormalized for easier display
  authorAvatar: string; // denormalized
  content: string;
  createdAt: any; // Firestore Timestamp
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
};

export type PostType = 'journal' | 'voting';

export type VoteOption = {
  text: string;
  votes: number;
};

export type JournalEntry = {
  id: string;
  ownerId: string;
  postType: PostType;
  content: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  comments: Comment[]; // This will be a subcollection, so we might not store it directly here
  likes: number;
  likedBy: string[];
  bookmarkedBy: string[];
  images: string[]; // URLs from Firebase Storage
  options: VoteOption[];
  votedBy: string[];
};

const POINTS_PER_LEVEL = 50;

export function useJournal() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAuthUser, setCurrentAuthUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- AUTHENTICATION ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in.
        setCurrentAuthUser(user);
        const userRef = doc(db, 'users', user.uid);
        
        const userDocUnsub = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const userData = { id: doc.id, ...doc.data() } as User;
                setCurrentUser(userData);
            } else {
                 // New user, create a document for them.
                const newUser: Omit<User, 'id'> = {
                    displayName: `Anonim${Math.floor(Math.random() * 1000)}`,
                    avatar: '👤',
                    bio: 'Pengguna baru MoodLink!',
                    followers: [],
                    following: [],
                    points: 0,
                    level: 1,
                };
                runTransaction(db, async (transaction) => {
                    transaction.set(userRef, newUser);
                }).then(() => {
                    setCurrentUser({ ...newUser, id: user.uid });
                });
            }
        });

        return () => userDocUnsub();

      } else {
        // User is signed out, sign them in anonymously.
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed:", error);
          if (error.code === 'auth/configuration-not-found') {
                toast({
                    title: 'Authentication Disabled',
                    description: 'Anonymous authentication is not enabled. Please enable it in your Firebase console.',
                    variant: 'destructive',
                    duration: 10000,
                });
            } else {
                toast({ title: 'Gagal Otentikasi', description: 'Tidak dapat terhubung ke layanan kami.', variant: 'destructive' });
            }
        });
      }
    });

    return () => unsubscribe();
  }, [toast]);

  // --- DATA LOADING ---
  useEffect(() => {
    if (!currentAuthUser) return;
    
    // Fetch all users
    const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
        setUsers(usersData);
    });

    // Fetch all entries
    const entriesUnsub = onSnapshot(query(collection(db, 'journals'), orderBy('createdAt', 'desc')), (snapshot) => {
        const entriesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Subcollections are not fetched here, this will need adjustment in components
                comments: [], 
            } as JournalEntry;
        });
        setEntries(entriesData);
        setIsLoaded(true);
    });

    return () => {
        usersUnsub();
        entriesUnsub();
    };
  }, [currentAuthUser]);
  
  // --- POINTS & LEVEL ---
  const addPoints = useCallback(async (userId: string, amount: number) => {
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw 'Document does not exist!';
        }
        const oldPoints = userDoc.data().points || 0;
        const oldLevel = userDoc.data().level || 1;
        const newPoints = oldPoints + amount;
        const newLevel = Math.floor(newPoints / POINTS_PER_LEVEL) + 1;
        
        transaction.update(userRef, { points: newPoints, level: newLevel });

        if (newLevel > oldLevel) {
          // This toast needs to be called outside the transaction.
          // We'll queue it up.
          setTimeout(() => {
            toast({ title: "Level Up!", description: `Selamat, Anda mencapai Level ${newLevel}!`});
          }, 0);
        }
      });
    } catch (e) {
      console.error("Transaction failed: ", e);
    }
  }, [toast]);


  // --- JOURNAL ACTIONS ---
  const addEntry = useCallback(async (content: string, images: string[], postType: PostType, options: string[]) => {
    if (!currentAuthUser) {
        toast({ title: 'Anda harus masuk untuk memposting', variant: 'destructive'});
        return null;
    }
    if (!content.trim()) {
        toast({ title: 'Konten Kosong', description: "Konten tidak boleh kosong.", variant: 'destructive' });
        return null;
    }
     if (postType === 'voting' && options.some(opt => !opt.trim())) {
      toast({ title: 'Opsi Voting Kosong', description: 'Opsi voting tidak boleh kosong.', variant: 'destructive' });
      return null;
    }

    // 1. Upload images to Firebase Storage
    const imageUrls = await Promise.all(
        images.map(async (base64Image) => {
            const storageRef = ref(storage, `journals/${currentAuthUser.uid}/${Date.now()}`);
            const uploadResult = await uploadString(storageRef, base64Image, 'data_url');
            return getDownloadURL(uploadResult.ref);
        })
    );

    // 2. Add new journal document to Firestore
    const newEntryData = {
      ownerId: currentAuthUser.uid,
      content,
      postType,
      images: imageUrls,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0,
      likedBy: [],
      bookmarkedBy: [],
      options: postType === 'voting' ? options.map(opt => ({ text: opt, votes: 0 })) : [],
      votedBy: [],
    };
    
    try {
        const docRef = await addDoc(collection(db, 'journals'), newEntryData);
        await addPoints(currentAuthUser.uid, 5); // +5 points
        toast({ title: 'Postingan Tersimpan', description: 'Postingan baru Anda telah disimpan.' });
        // The onSnapshot listener will automatically update the UI.
        return { id: docRef.id, ...newEntryData } as JournalEntry;
    } catch (error) {
        console.error("Error adding document: ", error);
        toast({ title: 'Gagal Menyimpan', description: 'Terjadi kesalahan saat menyimpan postingan.', variant: 'destructive' });
        return null;
    }
  }, [currentAuthUser, toast, addPoints]);

  const updateEntry = useCallback(async (id: string, content: string, images: string[], options: string[]) => {
     if (!currentAuthUser) return;
     
     const entryRef = doc(db, 'journals', id);

     // You might want to handle image updates (deleting old, uploading new)
     // For simplicity, this example just updates the text content.
     const updateData: any = {
        content,
        updatedAt: serverTimestamp(),
        // images: updatedImageUrls, // Handle image updates here
     };

     if (options.length > 0) {
        const entrySnap = await getDoc(entryRef);
        const entry = entrySnap.data() as JournalEntry;
        updateData.options = options.map((optText, index) => ({
            text: optText,
            votes: entry.options[index]?.votes || 0,
        }));
     }

     await updateDoc(entryRef, updateData);
     toast({ title: 'Postingan Diperbarui', description: 'Postingan Anda telah diperbarui.' });
  }, [currentAuthUser, toast]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!currentAuthUser) return;
    
    const entryRef = doc(db, 'journals', id);
    const entrySnap = await getDoc(entryRef);
    const entryData = entrySnap.data();

    // Delete images from Storage
    if (entryData?.images && entryData.images.length > 0) {
        entryData.images.forEach(async (url: string) => {
            try {
                const imageRef = ref(storage, url);
                await deleteObject(imageRef);
            } catch (error) {
                console.error("Failed to delete image from storage:", error);
            }
        });
    }

    await deleteDoc(entryRef);
    toast({ title: 'Postingan Dihapus', variant: 'destructive' });
  }, [currentAuthUser, toast]);

  const toggleLike = useCallback(async (entryId: string) => {
    if (!currentAuthUser) return;
    const entryRef = doc(db, 'journals', entryId);
    
    await runTransaction(db, async (transaction) => {
        const entryDoc = await transaction.get(entryRef);
        if (!entryDoc.exists()) throw "Document does not exist!";

        const entryData = entryDoc.data();
        const likedBy = entryData.likedBy || [];
        const ownerId = entryData.ownerId;
        
        if (likedBy.includes(currentAuthUser.uid)) {
            transaction.update(entryRef, { 
                likedBy: arrayRemove(currentAuthUser.uid),
                likes: (entryData.likes || 1) - 1
            });
        } else {
             transaction.update(entryRef, { 
                likedBy: arrayUnion(currentAuthUser.uid),
                likes: (entryData.likes || 0) + 1
            });
            // This is not transactionally safe, but a workaround for client-side logic
            if (ownerId !== currentAuthUser.uid) {
                addPoints(ownerId, 1);
            }
        }
    });
  }, [currentAuthUser, addPoints]);

  const toggleBookmark = useCallback(async (entryId: string) => {
    if (!currentAuthUser) return;
    const entryRef = doc(db, 'journals', entryId);
    let isBookmarkedCurrently = false;

    await runTransaction(db, async (transaction) => {
        const entryDoc = await transaction.get(entryRef);
        if (!entryDoc.exists()) throw "Journal does not exist!";

        const bookmarkedBy = entryDoc.data().bookmarkedBy || [];
        isBookmarkedCurrently = bookmarkedBy.includes(currentAuthUser.uid);

        if (isBookmarkedCurrently) {
            transaction.update(entryRef, { bookmarkedBy: arrayRemove(currentAuthUser.uid) });
        } else {
            transaction.update(entryRef, { bookmarkedBy: arrayUnion(currentAuthUser.uid) });
        }
    });

    toast({
        title: isBookmarkedCurrently ? 'Bookmark Dihapus' : 'Bookmark Ditambah' 
    });
  }, [currentAuthUser, toast]);

    const toggleFollow = useCallback(async (targetUserId: string) => {
        if (!currentAuthUser || currentAuthUser.uid === targetUserId) return;

        const currentUserRef = doc(db, 'users', currentAuthUser.uid);
        const targetUserRef = doc(db, 'users', targetUserId);
        
        const currentUserSnap = await getDoc(currentUserRef);
        const currentUserData = currentUserSnap.data() as User;
        
        const isFollowing = currentUserData.following.includes(targetUserId);
        
        const batch = writeBatch(db);

        if (isFollowing) {
            // Unfollow
            batch.update(currentUserRef, { following: arrayRemove(targetUserId) });
            batch.update(targetUserRef, { followers: arrayRemove(currentAuthUser.uid) });
        } else {
            // Follow
            batch.update(currentUserRef, { following: arrayUnion(targetUserId) });
            batch.update(targetUserRef, { followers: arrayUnion(currentAuthUser.uid) });
            // Add points outside of batch, as it's a separate transaction logic
            addPoints(targetUserId, 2);
        }
        
        await batch.commit();

        toast({
            title: isFollowing ? 'Berhenti Mengikuti' : 'Mulai Mengikuti',
        });
    }, [currentAuthUser, toast, addPoints]);

    const voteOnEntry = useCallback(async (entryId: string, optionIndex: number) => {
        if (!currentAuthUser) return;
        const entryRef = doc(db, 'journals', entryId);

        await runTransaction(db, async (transaction) => {
            const entryDoc = await transaction.get(entryRef);
            if (!entryDoc.exists()) throw "Document does not exist!";
            
            const data = entryDoc.data();
            if (data.postType !== 'voting' || data.votedBy.includes(currentAuthUser.uid)) {
                return; // Already voted or not a voting post
            }

            const newOptions = [...data.options];
            newOptions[optionIndex].votes += 1;

            transaction.update(entryRef, {
                options: newOptions,
                votedBy: arrayUnion(currentAuthUser.uid)
            });
        });
        addPoints(currentAuthUser.uid, 1);
    }, [currentAuthUser, addPoints]);

    const addComment = useCallback(async (entryId: string, commentContent: string, author: User, entryOwnerId: string) => {
        if (!commentContent.trim()) {
            toast({ title: 'Komentar tidak boleh kosong', variant: 'destructive' });
            return;
        }
        
        const commentData = {
            authorId: author.id,
            authorName: author.displayName,
            authorAvatar: author.avatar,
            content: commentContent,
            createdAt: serverTimestamp(),
        };

        const commentsRef = collection(db, 'journals', entryId, 'comments');
        await addDoc(commentsRef, commentData);
        
        if (author.id !== entryOwnerId) {
           await addPoints(entryOwnerId, 2);
        }

        toast({ title: 'Komentar ditambahkan' });
    }, [toast, addPoints]);


  return { entries, users, currentUser, isLoaded, addEntry, updateEntry, deleteEntry, toggleLike, toggleBookmark, toggleFollow, voteOnEntry, addComment, currentAuthUserId: currentAuthUser?.uid };
}


// --- Component-specific data hooks ---

// Hook to get comments for a specific entry
export function useComments(entryId: string) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!entryId) {
            setIsLoading(false);
            return;
        };
        const commentsRef = collection(db, 'journals', entryId, 'comments');
        const q = query(commentsRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const commentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[];
            setComments(commentsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching comments:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [entryId]);

    return { comments, isLoading };
}
