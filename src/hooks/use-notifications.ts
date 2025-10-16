
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, collection, query, where, orderBy, onSnapshot, writeBatch, getDocs, doc } from '@/lib/firebase';
import type { Timestamp } from '@/lib/firebase';

export type NotificationType = 'like' | 'comment' | 'follow' | 'reply';

export type Notification = {
  id: string;
  userId: string;         // The user who receives the notification
  actorId: string;        // The user who performed the action
  actorName: string;      // The display name of the actor
  type: NotificationType;
  journalId?: string;     // The ID of the journal related to the action
  journalContent?: string; // A snippet of the journal content
  isRead: boolean;
  createdAt: Timestamp;
};

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notifs);

      const unread = notifs.filter(n => !n.isRead).length;
      setUnreadCount(unread);
      
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching notifications: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const markNotificationsAsRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('isRead', '==', false)
    );
    
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return;

        const batch = writeBatch(db);
        querySnapshot.forEach(docSnapshot => {
            batch.update(doc(db, 'notifications', docSnapshot.id), { isRead: true });
        });

        await batch.commit();
        // The onSnapshot listener will update the state, including the unreadCount.
    } catch (error) {
        console.error("Error marking notifications as read: ", error);
    }
  }, [userId, unreadCount]);

  return { notifications, isLoading, unreadCount, markNotificationsAsRead };
}
