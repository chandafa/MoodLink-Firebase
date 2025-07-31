'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Users, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GroupChatPage from './chat-page';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useJournal } from '@/hooks/use-journal';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';


export type Group = {
  id: string;
  name: string;
  description: string;
  members: number;
  emoji: string;
  joinedBy?: string[]; // Keep track of who joined
};

// This data could also be moved to Firestore
const dummyGroups: Group[] = [
  { id: 'semangat', name: 'Grup Semangat', description: 'Dapatkan dan bagikan motivasi setiap hari!', members: 235, emoji: '🔥', joinedBy: [] },
  { id: 'overthinking', name: 'Grup Overthinking', description: 'Ruang aman untuk berbagi pikiran yang berlebihan.', members: 489, emoji: '🧠', joinedBy: [] },
  { id: 'sedih', name: 'Grup Sedih', description: 'Tempat berbagi rasa sedih dan saling menguatkan.', members: 120, emoji: '😢', joinedBy: [] },
  { id: 'seni', name: 'Klub Seni', description: 'Ekspresikan dirimu melalui seni dan kreativitas.', members: 88, emoji: '🎨', joinedBy: [] },
  { id: 'baca', name: 'Klub Buku', description: 'Diskusikan buku favoritmu dengan para kutu buku lainnya.', members: 154, emoji: '📚', joinedBy: [] },
  { id: 'musik', name: 'Pojok Musik', description: 'Bagikan dan temukan musik baru dari berbagai genre.', members: 201, emoji: '🎵', joinedBy: [] },
];

export function GroupListPage({ onBack }: { onBack: () => void }) {
    const [groups, setGroups] = useState<Group[]>(dummyGroups);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const { currentUser } = useJournal();

    const toggleJoinGroup = async (groupId: string) => {
        if (!currentUser) return;

        setGroups(prevGroups => {
            const newGroups = prevGroups.map(group => {
                if (group.id === groupId) {
                    const isJoined = group.joinedBy?.includes(currentUser.id);
                    const newJoinedBy = isJoined
                        ? group.joinedBy?.filter(id => id !== currentUser.id)
                        : [...(group.joinedBy || []), currentUser.id];
                    return { ...group, joinedBy: newJoinedBy };
                }
                return group;
            });
            return newGroups;
        });

        // In a real app with Firestore for groups:
        /*
        const groupRef = doc(db, 'groups', groupId);
        const isJoined = groups.find(g => g.id === groupId)?.joinedBy?.includes(currentUser.id);
        await updateDoc(groupRef, {
            joinedBy: isJoined ? arrayRemove(currentUser.id) : arrayUnion(currentUser.id)
        });
        */
    }

    if (selectedGroup) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <GroupChatPage group={selectedGroup} onBack={() => setSelectedGroup(null)} />
                </motion.div>
            </AnimatePresence>
        );
    }
    
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="flex items-center mb-8">
          <Button onClick={onBack} size="icon" variant="ghost" className="mr-2">
            <ArrowLeft />
          </Button>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline text-foreground">
                Grup Mood
            </h1>
          </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => {
            const isJoined = currentUser ? group.joinedBy?.includes(currentUser.id) : false;
            return (
                <Card key={group.id} className="flex flex-col">
                    <CardHeader className="flex-row items-center gap-4">
                         <Avatar className="h-12 w-12">
                             <AvatarFallback className="text-2xl bg-secondary">{group.emoji}</AvatarFallback>
                         </Avatar>
                         <div>
                            <CardTitle>{group.name}</CardTitle>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Users className="h-4 w-4 mr-1" />
                                {group.members} anggota
                            </div>
                         </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <CardDescription>{group.description}</CardDescription>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch gap-2">
                         <Button 
                            onClick={() => setSelectedGroup(group)} 
                            disabled={!isJoined}
                            variant="default"
                         >
                            Masuk Grup
                         </Button>
                         <Button 
                            onClick={() => toggleJoinGroup(group.id)} 
                            variant={isJoined ? "secondary" : "outline"}
                            disabled={!currentUser}
                          >
                            {isJoined ? 'Keluar Grup' : 'Gabung Grup'}
                         </Button>
                    </CardFooter>
                </Card>
            )
        })}
      </div>
    </div>
  );
}
