

'use client'

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useJournal, type JournalEntry, PostType, Visibility, User } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MoreVertical, Edit, Flag, Trash2, Bookmark, Vote, BookText, Globe, Lock, Users as UsersIcon, Flame, Wind, Snowflake } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { SupportBar } from './support-bar';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import HashtagRenderer from './hashtag-renderer';
import { Avatar, AvatarFallback } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

type ReactionType = 'fire' | 'wind' | 'snow';
type Reaction = {
    id: number;
    type: ReactionType;
    x: string;
};


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

function VotingSection({ entry, onVote }: { entry: JournalEntry; onVote: (entryId: string, optionIndex: number) => void; }) {
  const { currentAuthUserId } = useJournal();
  const hasVoted = useMemo(() => 
    entry.votedBy?.includes(currentAuthUserId || '')
  , [entry.votedBy, currentAuthUserId]);
  
  const totalVotes = useMemo(() => 
    entry.options.reduce((sum, opt) => sum + opt.votes, 0)
  , [entry.options]);

  const handleVote = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!hasVoted) {
      onVote(entry.id, index);
    }
  };
  
  if (hasVoted) {
      return (
          <div className="space-y-2 mt-4">
              {entry.options.map((option, index) => {
                  const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                  return (
                      <div key={index}>
                           <div className="flex items-center justify-between text-sm mb-1">
                              <span>{option.text}</span>
                              <span className="font-bold">{Math.round(percentage)}%</span>
                           </div>
                           <Progress value={percentage} className="h-2" />
                      </div>
                  )
              })}
          </div>
      )
  }

  return (
    <div className="flex flex-col space-y-2 mt-4">
      {entry.options.map((option, index) => (
        <Button
          key={index}
          variant="outline"
          className="w-full justify-center"
          onClick={(e) => handleVote(e, index)}
        >
          {option.text}
        </Button>
      ))}
    </div>
  );
}


export function JournalEntryCard({ entry, author, onSelect, onDelete, onViewHashtag, onViewImage }: { entry: JournalEntry; author?: User; onSelect: () => void; onDelete: (id: string) => void; onViewHashtag: (tag: string) => void; onViewImage: (url: string) => void; }) {
  const { toast } = useToast();
  const { toggleBookmark, voteOnEntry, currentAuthUserId } = useJournal();
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const isBookmarked = useMemo(() => 
    entry.bookmarkedBy?.includes(currentAuthUserId || '')
  , [entry.bookmarkedBy, currentAuthUserId]);
  
  const timeAgo = entry.createdAt ? formatDistanceToNow(entry.createdAt.toDate(), { addSuffix: true, locale: id }) : 'baru saja';
  
  const isOwner = entry.ownerId === currentAuthUserId;

  const handleReport = () => {
    toast({
        title: "Entri Dilaporkan",
        description: "Terima kasih atas laporan Anda. Kami akan meninjaunya."
    });
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(entry.id);
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  }

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(entry.id);
  }
  
  const handleReaction = (reactionType: ReactionType) => {
      const newReaction: Reaction = {
          id: Date.now(),
          type: reactionType,
          x: `${Math.random() * 80 + 10}%`,
      };
      setReactions(prev => [...prev, newReaction]);
      setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== newReaction.id));
      }, 1200);
  };

  const cardStyle = entry.cardColor ? { ["--card-theme-bg" as any]: `var(--${entry.cardColor}-bg)`, ["--card-theme-fg" as any]: `var(--${entry.cardColor}-fg)` } : {};
  
  const animationVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0 },
    focus: {
        opacity: 1,
        transition: { duration: 0.5 }
    },
    energetic: {
        scale: [1, 1.01, 1],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    classic: {
        opacity: 1
    }
  };

  const getAnimationForTheme = (theme?: string) => {
    switch(theme) {
        case 'dusk':
        case 'sky':
            return 'focus';
        case 'rose':
        case 'sand':
            return 'energetic';
        default:
            return 'classic';
    }
  }


  const ReactionIcon = ({ type }: { type: ReactionType }) => {
    switch (type) {
        case 'fire': return <Flame className="text-orange-500 fill-orange-400" />;
        case 'wind': return <Wind className="text-blue-400" />;
        case 'snow': return <Snowflake className="text-sky-300" />;
        default: return null;
    }
  };

  return (
    <motion.div
        layout
        variants={animationVariants}
        initial="initial"
        animate={getAnimationForTheme(entry.cardColor)}
        exit="exit"
        className="h-full"
    >
        <Card 
            className="p-4 cursor-pointer hover:bg-accent/50 transition-colors duration-200 h-full flex flex-col relative overflow-hidden bg-[var(--card-theme-bg)] text-[var(--card-theme-fg)]"
            onClick={onSelect}
            style={cardStyle}
            data-theme={entry.cardColor || 'default'}
        >
            <AnimatePresence>
                {reactions.map(reaction => (
                    <motion.div
                        key={reaction.id}
                        initial={{ y: 0, opacity: 1, scale: 0.5 }}
                        animate={{ y: -100, opacity: 0, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="absolute text-2xl pointer-events-none z-30"
                        style={{
                            left: reaction.x,
                            bottom: '10%',
                        }}
                    >
                       <ReactionIcon type={reaction.type} />
                    </motion.div>
                ))}
            </AnimatePresence>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>{author?.avatar || 'A'}</AvatarFallback>
                        </Avatar>
                        <div className="text-[var(--card-theme-fg)]">
                            <p className="font-bold leading-tight">{author?.displayName || 'Anonim'}</p>
                            <span className="text-xs text-[var(--card-theme-fg)] opacity-80">{timeAgo}</span>
                        </div>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 flex-shrink-0 text-[var(--card-theme-fg)] hover:bg-black/10 dark:hover:bg-white/10" onClick={(e) => e.stopPropagation()}>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            {isOwner && (
                                <DropdownMenuItem onClick={handleEditClick}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={handleReport}>
                                <Flag className="mr-2 h-4 w-4" />
                                <span>Laporkan</span>
                            </DropdownMenuItem>
                            {isOwner && (
                                <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={handleDeleteClick}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Hapus</span>
                                </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="mt-3 text-[var(--card-theme-fg)]">
                    {entry.postType === 'journal' ? (
                      <HashtagRenderer text={entry.content} onViewHashtag={onViewHashtag} isExcerpt />
                    ) : (
                      <>
                        <p className="font-semibold text-sm line-clamp-2">{entry.content.split('\n')[0]}</p>
                        <VotingSection entry={entry} onVote={voteOnEntry} />
                      </>
                    )}
                </div>

                {entry.musicUrl && (
                  <div className="mt-4">
                      <audio controls src={entry.musicUrl} className="w-full h-10">
                          Browser Anda tidak mendukung elemen audio.
                      </audio>
                  </div>
                )}
                
                {entry.images && entry.images.length > 0 && (
                  <div className="relative w-full aspect-video mt-2 rounded-lg border overflow-hidden">
                    <Image
                      src={entry.images[0]}
                      alt={entry.content.split('\n')[0]}
                      fill
                      className="object-cover cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); onViewImage(entry.images[0]);}}
                    />
                  </div>
                )}
            </div>
            
            <div className="mt-2 pt-2 border-t -ml-4 -mr-4 border-black/10 dark:border-white/10">
                <SupportBar entry={entry} onCommentClick={onSelect} onReact={handleReaction} />
            </div>
        </Card>
    </motion.div>
  );
}
