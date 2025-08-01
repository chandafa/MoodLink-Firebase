
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
import { JournalListPage } from './journal-list-page'; // Re-use for listing user's journals
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { SupportBar } from './support-bar';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';


const POINTS_PER_LEVEL = 50;

const VisibilityIcon = ({ visibility }: { visibility: Visibility }) => {
    switch (visibility) {
        case 'public':
            return <Globe className="h-3 w-3" />;
        case 'private':
            return <Lock className="h-3 w-3" />;
        case 'restricted':
            return <UsersIcon className="h-3 w-3" />;
        default:
            return <Globe className="h-3 w-3" />;
    }
};

function ProfileJournalEntryCard({ entry, onSelect }: { entry: JournalEntry; onSelect: (id: string) => void; }) {
  const { toggleBookmark, currentAuthUserId } = useJournal();
  const { toast } = useToast();
  const isBookmarked = entry.bookmarkedBy.includes(currentAuthUserId);

  const formattedDate = entry.createdAt?.toDate().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) || 'Just now';

  const title = entry.content.split('\n')[0];
  const excerpt = entry.content.substring(entry.content.indexOf('\n') + 1).slice(0, 100) + '...' || title.slice(0, 100);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(entry.id);
  }

  const handleReport = () => {
    toast({
        title: "Entri Dilaporkan",
        description: "Terima kasih atas laporan Anda. Kami akan meninjaunya."
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="cursor-pointer h-full flex flex-col hover:border-primary transition-colors duration-200 relative group" onClick={() => onSelect(entry.id)}>
        <div className="absolute top-2 right-2 z-10 flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleBookmarkClick}>
                <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current text-primary")} />
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={handleReport}>
                        <Flag className="mr-2 h-4 w-4" />
                        <span>Laporkan</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        {entry.images && entry.images.length > 0 && (
          <div className="relative w-full h-40">
            <Image
              src={entry.images[0]}
              alt={title}
              layout="fill"
              objectFit="cover"
              className="rounded-t-lg"
            />
          </div>
        )}
        <CardHeader className={cn(entry.images && entry.images.length > 0 && "pt-4")}>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                {entry.postType === 'voting' ? <Vote className="h-4 w-4" /> : <BookText className="h-4 w-4" />}
                <span className="text-xs font-medium uppercase">{entry.postType}</span>
                 <Separator orientation="vertical" className="h-4" />
                <VisibilityIcon visibility={entry.visibility} />
                <span className="text-xs font-medium capitalize">{entry.visibility}</span>
            </div>
            <CardTitle className="truncate pr-8">{title}</CardTitle>
            <CardDescription>{formattedDate}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3">{excerpt}</p>
        </CardContent>
        <Separator className="my-2" />
        <CardFooter className="p-2 pt-0">
          <SupportBar entry={entry} onCommentClick={() => onSelect(entry.id)} />
        </CardFooter>
      </Card>
    </motion.div>
  );
}


export default function PublicProfilePage({
  userId,
  onBack,
  onSelectEntry,
  onStartChat,
}: {
  userId: string;
  onBack: () => void;
  onSelectEntry: (id: string | null) => void;
  onStartChat: (user: User) => void;
}) {
  const { users, isLoaded, currentUser, toggleFollow, getUserEntries } = useJournal();

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
            <CardHeader>
              <div className="flex flex-col items-center sm:flex-row gap-6">
                <Avatar style={{ height: '8rem', width: '8rem' }}>
                  <AvatarFallback style={{ fontSize: '4rem' }} className="bg-secondary text-secondary-foreground">
                    {userProfile.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left w-full">
                    <CardTitle>{userProfile.displayName}</CardTitle>
                    <CardDescription>{userProfile.bio}</CardDescription>
                     <div className="flex justify-center sm:justify-start gap-6 mt-4">
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
                     <div className="mt-4">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-semibold">Level {userProfile.level}</p>
                            <p className="text-xs text-muted-foreground">{pointsToNextLevel} poin ke level berikutnya</p>
                        </div>
                        <Progress value={progressToNextLevel} className="h-2" />
                    </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {userEntries.map(entry => (
                       <ProfileJournalEntryCard key={entry.id} entry={entry} onSelect={onSelectEntry} />
                   ))}
                </div>
             ) : (
                <p className="text-muted-foreground text-center py-8">Pengguna ini belum memiliki postingan publik.</p>
             )}
        </div>
    </motion.div>
  );
}
