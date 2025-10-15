
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
  orderBy,
  Timestamp,
  setDoc,
  increment
} from '@/lib/firebase';
import { onAuthStateChanged, signInAnonymously, GoogleAuthProvider, linkWithCredential, signInWithPopup, signOut } from 'firebase/auth';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { addDays } from 'date-fns';
import { Notification, NotificationType } from './use-notifications';
import { Hashtag } from './use-hashtags';

export type Visibility = 'public' | 'private' | 'restricted';

export type Comment = {
  id: string;
  authorId: string;
  authorName: string; // denormalized for easier display
  authorAvatar: string; // denormalized
  content: string;
  createdAt: any; // Firestore Timestamp
  parentId: string | null; // For threading
  likes: number;
  likedBy: string[];
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
  bannerUrl?: string;
};

export type PostType = 'journal' | 'voting' | 'capsule';

export type VoteOption = {
  text: string;
  votes: number;
};

export type JournalEntry = {
  id:string;
  ownerId: string;
  postType: PostType;
  content: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  openAt: any; // Firestore Timestamp, for capsules
  commentCount: number;
  likes: number;
  likedBy: string[];
  bookmarkedBy: string[];
  images: string[]; // URLs from Firebase Storage or cPanel hosting
  options: VoteOption[];
  votedBy: string[];
  visibility: Visibility;
  allowedUserIds: string[];
  hashtags: string[];
};

export type ChatMessage = {
    id: string;
    senderId: string;
    text: string;
    createdAt: any;
};

export type Conversation = {
    id: string; // roomId
    lastMessage: string;
    lastMessageTimestamp: any;
    participantIds: string[];
    participantDetails: {
        [key: string]: {
            displayName: string;
            avatar: string;
        }
    };
};


const POINTS_PER_LEVEL = 50;

// Utility to extract hashtags from text
const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];
  // Return unique, lowercase hashtags without the '#' prefix
  return Array.from(new Set(matches.map(tag => tag.substring(1).toLowerCase())));
};

async function getCommentCount(journalId: string): Promise<number> {
    const commentsRef = collection(db, 'journals', journalId, 'comments');
    const snapshot = await getDocs(query(commentsRef));
    return snapshot.size;
}

async function createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) {
    // Prevent self-notification
    if (notification.userId === notification.actorId) {
        console.log("Skipping notification for user's own action.");
        return;
    }
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
        ...notification,
        createdAt: serverTimestamp(),
        isRead: false,
    });
}

export function useJournal() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAuthUser, setCurrentAuthUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);

  // --- AUTHENTICATION ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in.
        setCurrentAuthUser(user);
        setIsAnonymous(user.isAnonymous);
        const userRef = doc(db, 'users', user.uid);
        
        const userDocUnsub = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const userData = { id: doc.id, ...doc.data() } as User;
                setCurrentUser(userData);
            } else if (!user.isAnonymous) { // Only create doc for non-anonymous new users
                 // New user, create a document for them.
                const newUser: Omit<User, 'id'> = {
                    displayName: user.displayName || `Anonim${Math.floor(Math.random() * 1000)}`,
                    avatar: user.photoURL || '👤',
                    bio: 'Pengguna baru MoodLink!',
                    followers: [],
                    following: [],
                    points: 0,
                    level: 1,
                    bannerUrl: '',
                };
                setDoc(userRef, newUser).then(() => {
                    setCurrentUser({ ...newUser, id: user.uid });
                });
            } else if (user.isAnonymous) {
                // Handle case for new anonymous user if needed, or just let them be null
                setCurrentUser(null);
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
  
  const linkWithGoogle = async () => {
    if (!currentAuthUser || !currentAuthUser.isAnonymous) {
      toast({ title: 'Anda sudah masuk' });
      return false;
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // This will automatically link the anonymous account to the Google account
      // and trigger the onAuthStateChanged listener, which will update the user state.
      toast({ title: 'Berhasil Masuk', description: 'Akun Anda telah ditautkan dengan Google.' });
      return true;
    } catch (error: any) {
      console.error("Error linking with Google:", error);
      if (error.code === 'auth/credential-already-in-use') {
        toast({ title: 'Gagal Menautkan Akun', description: 'Akun Google ini sudah digunakan.', variant: 'destructive'});
      } else {
        toast({ title: 'Gagal Masuk', description: 'Terjadi kesalahan saat masuk dengan Google.', variant: 'destructive'});
      }
      return false;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will handle signing in anonymously again.
      toast({ title: 'Berhasil Keluar' });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({ title: 'Gagal Keluar', variant: 'destructive' });
    }
  };


  // --- DATA LOADING ---
  useEffect(() => {
    // We only start loading data once we have an authenticated user (even an anonymous one)
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
                commentCount: 0, 
            } as JournalEntry;
        });
        
        setEntries(entriesData);
        
        // Asynchronously fetch comment counts
        entriesData.forEach(async (entry) => {
            if (entry.postType === 'capsule') return;
            const count = await getCommentCount(entry.id);
            setEntries(prevEntries => 
                prevEntries.map(e => e.id === entry.id ? { ...e, commentCount: count } : e)
            );
        });
        
        // Mark as loaded only after the first batch of data is set
        if (!isLoaded) setIsLoaded(true);

    });

    return () => {
        usersUnsub();
        entriesUnsub();
    };
  }, [currentAuthUser, isLoaded]); // Rerun when auth user changes
  
  // --- POINTS & LEVEL ---
  const addPoints = useCallback(async (userId: string, amount: number) => {
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          // If the user doc doesn't exist, we can't add points.
          console.warn(`User document ${userId} does not exist. Cannot add points.`);
          return;
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

  // --- IMAGE UPLOAD TO HOSTING ---
  const uploadImageToHosting = useCallback(async (file: File): Promise<string | null> => {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadUrl = 'https://beruangrasa.academychan.my.id/upload.php';

      try {
          const response = await fetch(uploadUrl, {
              method: 'POST',
              body: formData,
          });

          const result = await response.json();

          if (result.status === 'success' && result.url) {
              console.log('Upload success, URL:', result.url);
              toast({ title: 'Gambar Berhasil Diunggah', description: 'Gambar Anda telah diunggah ke hosting.' });
              return result.url;
          } else {
              console.error('Upload failed:', result.message);
              toast({ title: 'Gagal Mengunggah Gambar', description: result.message || 'Terjadi kesalahan di server.', variant: 'destructive' });
              return null;
          }
      } catch (error) {
          console.error('Error uploading image:', error);
          toast({ title: 'Error Jaringan', description: 'Tidak dapat terhubung ke server upload.', variant: 'destructive' });
          return null;
      }
  }, [toast]);

  // --- HASHTAG ACTIONS ---
  const updateHashtagCounts = useCallback(async (tags: string[], operation: 'increment' | 'decrement') => {
    const batch = writeBatch(db);
    const amount = operation === 'increment' ? 1 : -1;

    tags.forEach(tag => {
        const tagRef = doc(db, 'hashtags', tag);
        batch.set(tagRef, { 
            name: tag, 
            count: increment(amount),
            updatedAt: serverTimestamp() 
        }, { merge: true });
    });

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error updating hashtag counts:", error);
    }
  }, []);

  // --- JOURNAL ACTIONS ---
  const addEntry = useCallback(async (content: string, images: (File | string)[], postType: PostType, options: string[], visibility: Visibility, allowedUserIds: string[]) => {
    if (!currentAuthUser) {
        toast({ title: 'Anda harus masuk untuk memposting', variant: 'destructive'});
        return null;
    }
    if (isAnonymous) {
        toast({ title: 'Masuk untuk Memposting', description: 'Silakan masuk dengan Google untuk membuat postingan.', variant: 'destructive'});
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

    try {
      // 1. Upload new images (File objects) to cPanel hosting
      const imageUrls = postType !== 'capsule' ? await Promise.all(
          images.map(async (image) => {
              if (typeof image === 'string') return image; // It's already a URL
              return await uploadImageToHosting(image);
          })
      ) : [];

      const validImageUrls = imageUrls.filter((url): url is string => url !== null);
      
      const hashtags = extractHashtags(content);
      if (hashtags.length > 0) {
          await updateHashtagCounts(hashtags, 'increment');
      }

      // 2. Add new journal document to Firestore
      const newEntryData: any = {
        ownerId: currentAuthUser.uid,
        content,
        postType,
        images: validImageUrls,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        bookmarkedBy: [],
        options: postType === 'voting' ? options.map(opt => ({ text: opt, votes: 0 })) : [],
        votedBy: [],
        visibility,
        allowedUserIds: visibility === 'restricted' ? allowedUserIds : [],
        hashtags,
      };

      if (postType === 'capsule') {
          const openDate = addDays(new Date(), 30);
          newEntryData.openAt = Timestamp.fromDate(openDate);
          toast({ title: 'Kapsul Waktu Disegel', description: 'Kapsul Anda akan terbuka dalam 30 hari.' });
      } else {
          toast({ title: 'Postingan Tersimpan', description: 'Postingan baru Anda telah disimpan.' });
      }
      
      const docRef = await addDoc(collection(db, 'journals'), newEntryData);
      await addPoints(currentAuthUser.uid, 5); // +5 points for any post
      // The onSnapshot listener will automatically update the UI.
      return { id: docRef.id, ...newEntryData, commentCount: 0 } as JournalEntry;

    } catch (error) {
        console.error("Error adding document: ", error);
        toast({ title: 'Gagal Menyimpan', description: 'Terjadi kesalahan saat menyimpan postingan.', variant: 'destructive' });
        return null;
    }
  }, [currentAuthUser, isAnonymous, toast, addPoints, uploadImageToHosting, updateHashtagCounts]);

  const updateEntry = useCallback(async (id: string, content: string, images: (File | string)[], options: string[], visibility: Visibility, allowedUserIds: string[]) => {
    if (!currentAuthUser) return;

    const entryRef = doc(db, 'journals', id);
    const docSnap = await getDoc(entryRef);
    if (!docSnap.exists()) {
        toast({ title: 'Error', description: 'Postingan tidak ditemukan.', variant: 'destructive'});
        return;
    }
    const oldEntryData = docSnap.data() as JournalEntry;
    const postType = oldEntryData.postType;

    // Handle hashtag count updates
    const oldHashtags = oldEntryData.hashtags || [];
    const newHashtags = extractHashtags(content);
    
    const tagsToAdd = newHashtags.filter(tag => !oldHashtags.includes(tag));
    const tagsToRemove = oldHashtags.filter(tag => !newHashtags.includes(tag));

    if (tagsToAdd.length > 0) await updateHashtagCounts(tagsToAdd, 'increment');
    if (tagsToRemove.length > 0) await updateHashtagCounts(tagsToRemove, 'decrement');


    const newImageFiles = images.filter((img): img is File => img instanceof File);
    const existingImageUrls = images.filter((img): img is string => typeof img === 'string');

    // Upload new images to cPanel hosting
    const newImageUrls = postType !== 'capsule' ? await Promise.all(
        newImageFiles.map(file => uploadImageToHosting(file))
    ) : [];
    
    const validNewImageUrls = newImageUrls.filter((url): url is string => url !== null);
    const allImageUrls = [...existingImageUrls, ...validNewImageUrls];
    
    const updateData: any = {
      content,
      images: allImageUrls,
      updatedAt: serverTimestamp(),
      visibility,
      allowedUserIds: visibility === 'restricted' ? allowedUserIds : [],
      hashtags: newHashtags,
    };

    if (postType === 'voting' && options.length > 0) {
      updateData.options = options.map((optText, index) => ({
        text: optText,
        votes: oldEntryData.options[index]?.votes || 0,
      }));
    }

    await updateDoc(entryRef, updateData);
    toast({ title: 'Postingan Diperbarui', description: 'Postingan Anda telah diperbarui.' });
  }, [currentAuthUser, toast, uploadImageToHosting, updateHashtagCounts]);


  const deleteEntry = useCallback(async (id: string) => {
    if (!currentAuthUser) return;
    
    const entryRef = doc(db, 'journals', id);
    const entrySnap = await getDoc(entryRef);
    const entryData = entrySnap.data() as JournalEntry | undefined;

    if (!entryData) return;
    
    // Decrement hashtag counts
    if (entryData.hashtags && entryData.hashtags.length > 0) {
        await updateHashtagCounts(entryData.hashtags, 'decrement');
    }

    // Note: Deleting images from cPanel hosting would require another PHP script or API endpoint.
    // This implementation does not delete the image files from the hosting server.
    if (entryData.images && entryData.images.length > 0) {
        entryData.images.forEach(async (url: string) => {
            if (url.includes('firebasestorage')) {
              try {
                  const imageRef = ref(storage, url);
                  await deleteObject(imageRef);
              } catch (error) {
                  console.error("Failed to delete image from storage:", error);
              }
            }
        });
    }

    await deleteDoc(entryRef);
    toast({ title: 'Postingan Dihapus', variant: 'destructive' });
  }, [currentAuthUser, toast, updateHashtagCounts]);

  const toggleLike = useCallback(async (entryId: string) => {
    if (!currentAuthUser || isAnonymous || !currentUser) {
        toast({ title: 'Harus Masuk', description: 'Masuk dengan Google untuk menyukai postingan.', variant: 'destructive'});
        return;
    }
    const entryRef = doc(db, 'journals', entryId);
    
    try {
        const notificationData = await runTransaction(db, async (transaction) => {
            const entryDoc = await transaction.get(entryRef);
            if (!entryDoc.exists()) throw "Document does not exist!";

            const entryData = entryDoc.data();
            const isLiked = entryData.likedBy?.includes(currentAuthUser.uid);
            
            if (isLiked) {
                // Unlike
                transaction.update(entryRef, { 
                    likedBy: arrayRemove(currentAuthUser.uid),
                    likes: (entryData.likes || 1) - 1
                });
            } else {
                 // Like
                 transaction.update(entryRef, { 
                    likedBy: arrayUnion(currentAuthUser.uid),
                    likes: (entryData.likes || 0) + 1
                });
                
                // Prepare data for notification after transaction
                return {
                    ownerId: entryData.ownerId,
                    content: entryData.content
                };
            }
            return null;
        });

        // Post-transaction logic
        if (notificationData && currentUser) {
            await addPoints(notificationData.ownerId, 1);
            await createNotification({
                userId: notificationData.ownerId,
                actorId: currentAuthUser.uid,
                actorName: currentUser.displayName,
                type: 'like',
                journalId: entryId,
                journalContent: notificationData.content,
            });
        }
    } catch (error) {
        console.error("Like transaction failed: ", error);
    }
  }, [currentAuthUser, currentUser, isAnonymous, toast, addPoints]);

  const toggleBookmark = useCallback(async (entryId: string) => {
    if (!currentAuthUser || isAnonymous) {
        toast({ title: 'Harus Masuk', description: 'Masuk dengan Google untuk menyimpan postingan.', variant: 'destructive'});
        return;
    }
    const entryRef = doc(db, 'journals', entryId);
    
    try {
        await runTransaction(db, async (transaction) => {
            const entryDoc = await transaction.get(entryRef);
            if (!entryDoc.exists()) {
                throw "Document does not exist!";
            }
    
            const entryData = entryDoc.data();
            const bookmarkedBy = entryData.bookmarkedBy || [];
            const isBookmarked = bookmarkedBy.includes(currentAuthUser.uid);
    
            if (isBookmarked) {
                // Unbookmark
                transaction.update(entryRef, { 
                    bookmarkedBy: arrayRemove(currentAuthUser.uid)
                });
                toast({ title: 'Bookmark Dihapus' });
            } else {
                // Bookmark
                transaction.update(entryRef, { 
                    bookmarkedBy: arrayUnion(currentAuthUser.uid)
                });
                toast({ title: 'Berhasil ditambahkan ke bookmark' });
            }
        });
    } catch (error) {
        console.error("Error toggling bookmark:", error);
        toast({ title: 'Gagal memproses bookmark', variant: 'destructive' });
    }
  }, [currentAuthUser, isAnonymous, toast]);

    const toggleFollow = useCallback(async (targetUserId: string) => {
        if (!currentAuthUser || isAnonymous || !currentUser || currentAuthUser.uid === targetUserId) return;

        const currentUserRef = doc(db, 'users', currentAuthUser.uid);
        const targetUserRef = doc(db, 'users', targetUserId);
        
        const isFollowing = currentUser.following.includes(targetUserId);
        
        const batch = writeBatch(db);

        if (isFollowing) {
            // Unfollow
            batch.update(currentUserRef, { following: arrayRemove(targetUserId) });
            batch.update(targetUserRef, { followers: arrayRemove(currentAuthUser.uid) });
            toast({ title: 'Berhenti Mengikuti' });
        } else {
            // Follow
            batch.update(currentUserRef, { following: arrayUnion(targetUserId) });
            batch.update(targetUserRef, { followers: arrayUnion(currentAuthUser.uid) });
            addPoints(targetUserId, 2);
            toast({ title: 'Mulai Mengikuti' });
             createNotification({
                userId: targetUserId,
                actorId: currentAuthUser.uid,
                actorName: currentUser.displayName,
                type: 'follow',
            });
        }
        
        await batch.commit();
    }, [currentAuthUser, isAnonymous, currentUser, toast, addPoints]);

    const voteOnEntry = useCallback(async (entryId: string, optionIndex: number) => {
        if (!currentAuthUser || isAnonymous) {
            toast({ title: 'Harus Masuk', description: 'Masuk dengan Google untuk memberi suara.', variant: 'destructive'});
            return;
        }
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
    }, [currentAuthUser, isAnonymous, toast, addPoints]);

    const addComment = useCallback(async (entryId: string, commentContent: string, author: User, entryOwnerId: string, parentId: string | null = null) => {
        if (!commentContent.trim() || !currentUser || isAnonymous) {
            toast({ title: 'Harus Masuk', description: 'Masuk untuk berkomentar', variant: 'destructive' });
            return;
        }
        
        const commentData = {
            authorId: author.id,
            authorName: author.displayName,
            authorAvatar: author.avatar,
            content: commentContent,
            createdAt: serverTimestamp(),
            parentId,
            likes: 0,
            likedBy: [],
        };

        const commentsRef = collection(db, 'journals', entryId, 'comments');
        await addDoc(commentsRef, commentData);
        
        const entryRef = doc(db, 'journals', entryId);
        const entryDoc = await getDoc(entryRef);
        await updateDoc(entryRef, { commentCount: increment(1) });


        if (author.id !== entryOwnerId) {
           await addPoints(entryOwnerId, 2);
            if(entryDoc.exists()) {
                await createNotification({
                    userId: entryOwnerId,
                    actorId: currentUser.id,
                    actorName: currentUser.displayName,
                    type: 'comment',
                    journalId: entryId,
                    journalContent: entryDoc.data().content,
                });
            }
        }
        
        toast({ title: 'Komentar ditambahkan' });
    }, [toast, addPoints, currentUser, isAnonymous]);
    
    const toggleCommentLike = useCallback(async (entryId: string, commentId: string) => {
        if (!currentAuthUser || isAnonymous) {
            toast({ title: 'Harus Masuk', description: 'Masuk untuk menyukai komentar.', variant: 'destructive'});
            return;
        }
        const commentRef = doc(db, 'journals', entryId, 'comments', commentId);

        await runTransaction(db, async (transaction) => {
            const commentDoc = await transaction.get(commentRef);
            if (!commentDoc.exists()) throw "Comment does not exist!";

            const data = commentDoc.data();
            const isLiked = (data.likedBy || []).includes(currentAuthUser.uid);

            if (isLiked) {
                transaction.update(commentRef, {
                    likedBy: arrayRemove(currentAuthUser.uid),
                    likes: (data.likes || 1) - 1,
                });
            } else {
                transaction.update(commentRef, {
                    likedBy: arrayUnion(currentAuthUser.uid),
                    likes: (data.likes || 0) + 1,
                });
            }
        });
    }, [currentAuthUser, isAnonymous, toast]);

    const updateComment = useCallback(async (entryId: string, commentId: string, newContent: string) => {
        if (!currentAuthUser) return;
        const commentRef = doc(db, 'journals', entryId, 'comments', commentId);
        await updateDoc(commentRef, {
            content: newContent
        });
        toast({ title: 'Komentar diperbarui' });
    }, [currentAuthUser, toast]);

    const deleteComment = useCallback(async (entryId: string, commentId: string) => {
        if (!currentAuthUser) return;

        // Recursive function to delete a comment and all its replies
        const recursiveDelete = async (id: string) => {
            const batch = writeBatch(db);
            const repliesQuery = query(collection(db, `journals/${entryId}/comments`), where('parentId', '==', id));
            const repliesSnapshot = await getDocs(repliesQuery);
            
            // Recursively delete all replies first
            for (const replyDoc of repliesSnapshot.docs) {
                await recursiveDelete(replyDoc.id);
            }
            
            // After all children are deleted, delete the parent comment
            batch.delete(doc(db, `journals/${entryId}/comments`, id));
            await batch.commit();

            // Decrement the main entry's comment count
            const entryRef = doc(db, 'journals', entryId);
            await updateDoc(entryRef, { commentCount: increment(-1) });
        };
        
        await recursiveDelete(commentId);
        
    }, [currentAuthUser]);
    
    const getFollowersData = useCallback((followerIds: string[]): User[] => {
        return users.filter(user => followerIds.includes(user.id));
    }, [users]);
    
    const getUserEntries = useCallback((userId: string) => {
        return entries.filter(entry => {
            if (entry.ownerId !== userId) return false;
            // A user can always see their own private/restricted posts
            if (entry.ownerId === currentAuthUser?.uid) return true;
            
            // Others can see public posts
            if (entry.visibility === 'public') return true;
            
            // Others can see restricted posts if they are allowed
            if (entry.visibility === 'restricted' && entry.allowedUserIds.includes(currentAuthUser?.uid || '')) return true;

            return false;
        });
    }, [entries, currentAuthUser]);


    // --- CHAT ACTIONS ---
    const getChatRoomId = (user1Id: string, user2Id: string) => {
        return [user1Id, user2Id].sort().join('_');
    };

    const sendMessage = useCallback(async (targetUserId: string, text: string) => {
        if (!currentUser || !currentAuthUser || !text.trim() || isAnonymous) {
             toast({ title: 'Harus Masuk', description: 'Masuk untuk mengirim pesan.', variant: 'destructive'});
             return;
        }
        
        const targetUser = users.find(u => u.id === targetUserId);
        if (!targetUser) {
            toast({ title: 'Pengguna tidak ditemukan', variant: 'destructive' });
            return;
        }

        const roomId = getChatRoomId(currentAuthUser.uid, targetUserId);
        const messagesCol = collection(db, 'chats', roomId, 'messages');
        const chatDocRef = doc(db, 'chats', roomId);

        // Add the message
        await addDoc(messagesCol, {
            text,
            senderId: currentAuthUser.uid,
            createdAt: serverTimestamp()
        });
        
        // Update the conversation summary document
        const conversationData: Conversation = {
            id: roomId,
            lastMessage: text,
            lastMessageTimestamp: serverTimestamp(),
            participantIds: [currentAuthUser.uid, targetUserId],
            participantDetails: {
                [currentAuthUser.uid]: {
                    displayName: currentUser.displayName,
                    avatar: currentUser.avatar
                },
                [targetUserId]: {
                    displayName: targetUser.displayName,
                    avatar: targetUser.avatar,
                }
            }
        };

        await setDoc(chatDocRef, conversationData, { merge: true });

    }, [currentAuthUser, currentUser, isAnonymous, users, toast]);


  return { entries, users, currentUser, isLoaded, isAnonymous, linkWithGoogle, signOutUser, addEntry, updateEntry, deleteEntry, toggleLike, toggleBookmark, toggleFollow, voteOnEntry, addComment, getUserEntries, currentAuthUserId: currentAuthUser?.uid, getChatRoomId, sendMessage, uploadImageToHosting, getFollowersData, toggleCommentLike, updateComment, deleteComment };
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
        const q = query(commentsRef, orderBy("createdAt", "asc"));

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

// Hook to get chat messages for a specific room
export function useChatMessages(roomId: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!roomId) {
            setIsLoading(false);
            return;
        };
        const messagesRef = collection(db, 'chats', roomId, 'messages');
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const messagesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatMessage[];
            setMessages(messagesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching chat messages:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [roomId]);

    return { messages, isLoading };
}

// Hook to get a user's conversations
export function useConversations(userId: string | null) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        const conversationsRef = collection(db, 'chats');
        const q = query(
            conversationsRef, 
            where('participantIds', 'array-contains', userId),
            orderBy('lastMessageTimestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convos = snapshot.docs.map(doc => doc.data() as Conversation);
            setConversations(convos);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching conversations:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { conversations, isLoading };
}

    
