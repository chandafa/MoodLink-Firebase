'use client';

import { useMemo } from 'react';
import { useJournal } from '@/hooks/use-journal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Icons } from './icons';
import { Trophy, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';


export function LeaderboardPage() {
    const { users, isLoaded } = useJournal();

    const sortedUsers = useMemo(() => {
        if (!users) return [];
        return [...users]
            .sort((a, b) => b.points - a.points)
            .slice(0, 10);
    }, [users]);

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 0: return 'text-yellow-500';
            case 1: return 'text-gray-400';
            case 2: return 'text-yellow-700';
            default: return 'text-muted-foreground';
        }
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold font-headline text-foreground">
                        Papan Peringkat
                    </h1>
                </div>
            </header>
            
            {!isLoaded ? (
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i} className="p-4 flex items-center gap-4">
                            <Skeleton className="h-6 w-6" />
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-1/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                            <Skeleton className="h-6 w-12" />
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedUsers.map((user, index) => (
                        <Card key={user.id} className="p-4 flex items-center gap-4 shadow-sm hover:bg-accent transition-colors">
                            <div className={cn("text-2xl font-bold w-8 text-center", getRankColor(index))}>
                                {index < 3 ? <Trophy className="mx-auto" /> : index + 1}
                            </div>
                            <Avatar className="h-12 w-12">
                                <AvatarFallback className="text-xl bg-secondary">{user.avatar}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-bold text-lg">{user.displayName}</p>
                                <p className="text-sm text-muted-foreground">{user.points} poin</p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                    <p className="font-bold text-lg">Level {user.level}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
