
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
} from '@/lib/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { addDays } from 'date-fns';
import { Notification, NotificationType } from './use-notifications';

export type Visibility = 'public' | 'private' | 'restricted';

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

export type PostType = 'journal' | 'voting' | 'capsule';

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
                commentCount: 0, 
            } as JournalEntry;
        });
        
        setEntries(entriesData);
        setIsLoaded(true);
        
        // Asynchronously fetch comment counts
        entriesData.forEach(async (entry) => {
            if (entry.postType === 'capsule') return;
            const count = await getCommentCount(entry.id);
            setEntries(prevEntries => 
                prevEntries.map(e => e.id === entry.id ? { ...e, commentCount: count } : e)
            );
        });
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


  // --- JOURNAL ACTIONS ---
  const addEntry = useCallback(async (content: string, images: (File | string)[], postType: PostType, options: string[], visibility: Visibility, allowedUserIds: string[]) => {
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

    try {
      // 1. Upload new images (File objects) to cPanel hosting
      const imageUrls = postType !== 'capsule' ? await Promise.all(
          images.map(async (image) => {
              if (typeof image === 'string') return image; // It's already a URL
              return await uploadImageToHosting(image);
          })
      ) : [];

      const validImageUrls = imageUrls.filter((url): url is string => url !== null);


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
  }, [currentAuthUser, toast, addPoints, uploadImageToHosting]);

  const updateEntry = useCallback(async (id: string, content: string, images: (File | string)[], options: string[], visibility: Visibility, allowedUserIds: string[]) => {
    if (!currentAuthUser) return;

    const entryRef = doc(db, 'journals', id);
    const docSnap = await getDoc(entryRef);
    if (!docSnap.exists()) {
        toast({ title: 'Error', description: 'Postingan tidak ditemukan.', variant: 'destructive'});
        return;
    }
    const postType = docSnap.data().postType;

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
    };

    if (postType === 'voting' && options.length > 0) {
      const entry = docSnap.data() as JournalEntry;
      updateData.options = options.map((optText, index) => ({
        text: optText,
        votes: entry.options[index]?.votes || 0,
      }));
    }

    await updateDoc(entryRef, updateData);
    toast({ title: 'Postingan Diperbarui', description: 'Postingan Anda telah diperbarui.' });
  }, [currentAuthUser, toast, uploadImageToHosting]);


  const deleteEntry = useCallback(async (id: string) => {
    if (!currentAuthUser) return;
    
    const entryRef = doc(db, 'journals', id);
    const entrySnap = await getDoc(entryRef);
    const entryData = entrySnap.data();

    // Note: Deleting images from cPanel hosting would require another PHP script or API endpoint.
    // This implementation does not delete the image files from the hosting server.
    if (entryData?.images && entryData.images.length > 0) {
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
  }, [currentAuthUser, toast]);

  const toggleLike = useCallback(async (entryId: string) => {
    if (!currentAuthUser || !currentUser) return;
    const entryRef = doc(db, 'journals', entryId);
    
    try {
        const entryDoc = await getDoc(entryRef);
        if (!entryDoc.exists()) throw "Document does not exist!";

        const entryData = entryDoc.data();
        const likedBy = entryData.likedBy || [];
        const ownerId = entryData.ownerId;
        
        if (likedBy.includes(currentAuthUser.uid)) {
            // Unlike
            await updateDoc(entryRef, { 
                likedBy: arrayRemove(currentAuthUser.uid),
                likes: (entryData.likes || 1) - 1
            });
        } else {
             // Like
             await updateDoc(entryRef, { 
                likedBy: arrayUnion(currentAuthUser.uid),
                likes: (entryData.likes || 0) + 1
            });
             // Post-transaction logic
            if (ownerId !== currentAuthUser.uid) {
                addPoints(ownerId, 1);
                createNotification({
                    userId: ownerId,
                    actorId: currentAuthUser.uid,
                    actorName: currentUser.displayName,
                    type: 'like',
                    journalId: entryId,
                    journalContent: entryData.content,
                });
            }
        }
    } catch (error) {
        console.error("Like transaction failed: ", error);
    }
  }, [currentAuthUser, currentUser, addPoints]);

  const toggleBookmark = useCallback(async (entryId: string) => {
    if (!currentAuthUser) return;
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
  }, [currentAuthUser, toast]);

    const toggleFollow = useCallback(async (targetUserId: string) => {
        if (!currentAuthUser || !currentUser || currentAuthUser.uid === targetUserId) return;

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
    }, [currentAuthUser, currentUser, toast, addPoints]);

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
        if (!commentContent.trim() || !currentUser) {
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
        
        const entryRef = doc(db, 'journals', entryId);
        const entryDoc = await getDoc(entryRef);

        if (author.id !== entryOwnerId) {
           await addPoints(entryOwnerId, 2);
            if(entryDoc.exists()) {
                createNotification({
                    userId: entryOwnerId,
                    actorId: currentUser.id,
                    actorName: currentUser.displayName,
                    type: 'comment',
                    journalId: entryId,
                    journalContent: entryDoc.data().content,
                });
            }
        }
        
        setEntries(prevEntries =>
            prevEntries.map(e =>
                e.id === entryId ? { ...e, commentCount: e.commentCount + 1 } : e
            )
        );

        toast({ title: 'Komentar ditambahkan' });
    }, [toast, addPoints, currentUser]);
    
    const getFollowersData = useCallback((followerIds: string[]): User[] => {
        return users.filter(user => followerIds.includes(user.id));
    }, [users]);
    
    const getUserEntries = useCallback((userId: string) => {
        return entries.filter(entry => {
            if (entry.ownerId !== userId) return false;
            if (entry.visibility === 'public') return true;
            if (entry.ownerId === currentAuthUser?.uid) return true;
            if (entry.visibility === 'restricted' && entry.allowedUserIds.includes(currentAuthUser?.uid || '')) return true;
            return false;
        });
    }, [entries, currentAuthUser]);

    // --- CHAT ACTIONS ---
    const getChatRoomId = (user1Id: string, user2Id: string) => {
        return [user1Id, user2Id].sort().join('_');
    };

    const sendMessage = useCallback(async (targetUserId: string, text: string) => {
        if (!currentUser || !currentAuthUser || !text.trim()) return;
        
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

    }, [currentAuthUser, currentUser, users, toast]);


  return { entries, users, currentUser, isLoaded, addEntry, updateEntry, deleteEntry, toggleLike, toggleBookmark, toggleFollow, voteOnEntry, addComment, getUserEntries, currentAuthUserId: currentAuthUser?.uid, getChatRoomId, sendMessage, uploadImageToHosting, getFollowersData };
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
