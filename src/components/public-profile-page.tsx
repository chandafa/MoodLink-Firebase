
'use client';
import { useMemo, useState } from 'react';
import { useJournal, User, JournalEntry, PostType, Visibility } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { ArrowLeft, UserPlus, MessageSquare, Edit, Flag, Trash2, MoreVertical, Bookmark, Vote, BookText, Globe, Lock, Users as UsersIcon } from 'lucide-react';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { JournalEntryCard } from './journal-list-card'; // Re-use for listing user's journals
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import HashtagRenderer from './hashtag-renderer';
import { SupportBar } from './support-bar';

const POINTS_PER_LEVEL = 50;


export default function PublicProfilePage({
  userId,
  onBack,
  onSelectEntry,
  onStartChat,
  onViewHashtag,
  onViewImage,
}: {
  userId: string;
  onBack: () => void;
  onSelectEntry: (id: string | null) => void;
  onStartChat: (user: User) => void;
  onViewHashtag: (tag: string) => void;
  onViewImage: (url: string) => void;
}) {
  const { users, isLoaded, currentUser, toggleFollow, getUserEntries, deleteEntry } = useJournal();

  const userProfile = useMemo(() => {
    return users.find(u => u.id === userId);
  }, [users, userId]);
  
  const userEntries = useMemo(() => {
      if(!userProfile) return [];
      return getUserEntries(userProfile.id);
  }, [userProfile, getUserEntries]);

  const isFollowing = useMemo(() => {
    if (!currentUser || !userProfile) return false;
    return currentUser.following.includes(userProfile.id);
  }, [currentUser, userProfile]);

  const handleFollowToggle = () => {
    if (userProfile) {
      toggleFollow(userProfile.id);
    }
  };
  
  const handleStartChat = () => {
      if (userProfile) {
          onStartChat(userProfile);
      }
  }

  const pointsToNextLevel = userProfile ? POINTS_PER_LEVEL - (userProfile.points % POINTS_PER_LEVEL) : POINTS_PER_LEVEL;
  const progressToNextLevel = userProfile ? (userProfile.points % POINTS_PER_LEVEL) / POINTS_PER_LEVEL * 100 : 0;
  
  if (!isLoaded) {
    return (
        <div className="container mx-auto max-w-4xl py-8 px-4">
            <Skeleton className="h-10 w-48 mb-8" />
            <Card>
                <CardHeader>
                    <div className="flex flex-col items-center sm:flex-row gap-6">
                        <Skeleton className="h-32 w-32 rounded-full" />
                        <div className="flex-1 space-y-3 w-full">
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-10 w-full" />
                             <Skeleton className="h-4 w-full" />
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 text-center">
        <h2 className="text-2xl font-bold">User Not Found</h2>
        <p className="text-muted-foreground">The requested user profile could not be found.</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="container mx-auto max-w-4xl py-8 px-4"
    >
        <header className="flex items-center gap-3 mb-8">
            <Button onClick={onBack} size="icon" variant="ghost">
                <ArrowLeft />
            </Button>
            <h1 className="text-3xl font-bold font-headline text-foreground">
              Profil Anonim
            </h1>
        </header>

        <Card>
            <CardHeader className="p-0">
               <div className="relative h-48 bg-secondary flex items-center justify-center rounded-t-lg">
                 {userProfile.bannerUrl && (
                    <Image
                        src={userProfile.bannerUrl}
                        alt="User Banner"
                        layout="fill"
                        objectFit="cover"
                        className="rounded-t-lg"
                    />
                 )}
                 <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                    <Avatar style={{ height: '8rem', width: '8rem' }} className="border-4 border-background">
                      <AvatarFallback style={{ fontSize: '4rem' }} className="bg-secondary text-secondary-foreground">
                        {userProfile.avatar}
                      </AvatarFallback>
                    </Avatar>
                 </div>
              </div>
              <div className="pt-20 p-6 flex flex-col items-center">
                 <CardTitle className="text-2xl">{userProfile.displayName}</CardTitle>
                 <CardDescription className="mt-1 text-center">{userProfile.bio}</CardDescription>
                 <div className="flex justify-center gap-6 mt-4 w-full">
                    <div>
                        <p className="text-lg font-bold">{userProfile.followers.length}</p>
                        <p className="text-sm text-muted-foreground">Followers</p>
                    </div>
                    <div>
                        <p className="text-lg font-bold">{userProfile.following.length}</p>
                        <p className="text-sm text-muted-foreground">Following</p>
                    </div>
                     <div>
                        <p className="text-lg font-bold">{userProfile.points}</p>
                        <p className="text-sm text-muted-foreground">Poin</p>
                    </div>
                </div>
                 <div className="mt-4 w-full max-w-sm">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-semibold">Level {userProfile.level}</p>
                        <p className="text-xs text-muted-foreground">{pointsToNextLevel} poin ke level berikutnya</p>
                    </div>
                    <Progress value={progressToNextLevel} className="h-2" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button onClick={handleFollowToggle} variant={isFollowing ? 'secondary' : 'default'} className="w-full sm:w-auto">
                    <UserPlus className="mr-2 h-4 w-4" />
                    {isFollowing ? 'Diikuti' : 'Ikuti'}
                </Button>
                 <Button variant="outline" className="w-full sm:w-auto" onClick={handleStartChat}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Kirim Pesan
                </Button>
            </CardContent>
        </Card>

        <Separator className="my-8" />

        <div>
            <h2 className="text-2xl font-bold mb-4">Postingan dari {userProfile.displayName}</h2>
             {userEntries.length > 0 ? (
                <div className="space-y-4">
                   {userEntries.map(entry => (
                       <JournalEntryCard 
                        key={entry.id} 
                        entry={entry}
                        author={userProfile}
                        onSelect={() => onSelectEntry(entry.id)} 
                        onDelete={deleteEntry}
                        onViewHashtag={onViewHashtag} 
                        onViewImage={onViewImage} />
                   ))}
                </div>
             ) : (
                <p className="text-muted-foreground text-center py-8">Pengguna ini belum memiliki postingan publik.</p>
             )}
        </div>
    </motion.div>
  );
}
