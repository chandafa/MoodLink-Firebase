
'use client';

import { useState, useEffect } from 'react';
import { db, collection, query, where, orderBy, onSnapshot } from '@/lib/firebase';
import type { ChatMessage, Conversation } from '@/lib/types';

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
