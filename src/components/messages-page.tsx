'use client'

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Shuffle, Users, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GroupListPage } from './group-list-page';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useJournal } from '@/hooks/use-journal';
import { Separator } from './ui/separator';

export function MessagesPage() {
  const [view, setView] = useState<'main' | 'groups'>('main');
  const { currentUser } = useJournal();

  // Dummy data for active conversations
  const conversations = [
    { id: 1, name: 'Grup Semangat', lastMessage: 'Ayo, pasti bisa!', type: 'group', emoji: '🔥' },
    { id: 2, name: 'Anonim 302', lastMessage: 'Terima kasih bantuannya ya', type: 'private', avatar: '🐧' },
    { id: 3, name: 'Klub Buku', lastMessage: 'Ada rekomendasi buku baru?', type: 'group', emoji: '📚' },
  ];

  if (view === 'groups') {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
            >
                <GroupListPage onBack={() => setView('main')} />
            </motion.div>
        </AnimatePresence>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline text-foreground">
            Pesan
          </h1>
        </div>
      </header>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Cari pengguna anonim..." className="pl-10" />
            </div>
            <Button className="w-full sm:w-auto">
                <Shuffle className="mr-2 h-4 w-4" />
                Obrolan Acak
            </Button>
        </div>

        <Card>
            <CardContent className="p-0">
                <div className="p-4">
                    <h2 className="text-lg font-semibold">Percakapan</h2>
                </div>
                 <Separator />
                <ul className="divide-y">
                    <li 
                        className="p-4 hover:bg-accent cursor-pointer flex items-center justify-between"
                        onClick={() => setView('groups')}
                    >
                         <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-primary text-primary-foreground"><Users /></AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">Grup Mood</p>
                                <p className="text-sm text-muted-foreground">Lihat semua grup yang ada</p>
                            </div>
                        </div>
                    </li>
                    {conversations.map(convo => (
                        <li key={convo.id} className="p-4 hover:bg-accent cursor-pointer">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xl">
                                        {convo.type === 'group' ? convo.emoji : convo.avatar}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{convo.name}</p>
                                    <p className="text-sm text-muted-foreground truncate max-w-xs">{convo.lastMessage}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
