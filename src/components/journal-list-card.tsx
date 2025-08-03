'use client'

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useJournal, type JournalEntry, PostType, Visibility } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { MoreVertical, Edit, Flag, Trash2, Bookmark, Vote, BookText, Globe, Lock, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { SupportBar } from './support-bar';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import HashtagRenderer from './hashtag-renderer';

const VisibilityIcon = ({ visibility }: { visibility: Visibility }) => {
    switch (visibility) {
        case 'public':
            return <Globe className="h-3 w-3" />;
        case 'private':
            return <Lock className="h-3 w-3" />;
        case 'restricted':
            return <Users className="h-3 w-3" />;
        default:
            return <Globe className="h-3 w-3" />;
    }
};

function VotingSection({ entry, onVote }: { entry: JournalEntry; onVote: (entryId: string, optionIndex: number) => void; }) {
  const { currentAuthUserId } = useJournal();
  const hasVoted = entry.votedBy?.includes(currentAuthUserId);
  const totalVotes = entry.options.reduce((sum, opt) => sum + opt.votes, 0);

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


export function JournalEntryCard({ entry, onSelect, onDelete, onViewHashtag }: { entry: JournalEntry; onSelect: () => void; onDelete: (id: string) => void; onViewHashtag: (tag: string) => void; }) {
  const { toast } = useToast();
  const { toggleBookmark, voteOnEntry, currentAuthUserId } = useJournal();
  const isBookmarked = entry.bookmarkedBy.includes(currentAuthUserId);
  
  const formattedDate = entry.createdAt?.toDate().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) || 'Just now';

  const title = entry.content.split('\n')[0];
  const isOwner = entry.ownerId === currentAuthUserId;

  const handleReport = () => {
    toast({
        title: "Entri Dilaporkan",
        description: "Terima kasih atas laporan Anda. Kami akan meninjaunya."
    });
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click
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


  return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
    >
        <Card className="cursor-pointer h-full flex flex-col hover:border-primary transition-colors duration-200 relative group" onClick={onSelect}>
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
                {entry.postType === 'journal' ? (
                  <HashtagRenderer text={entry.content} onViewHashtag={onViewHashtag} isExcerpt />
                ) : (
                  <VotingSection entry={entry} onVote={voteOnEntry} />
                )}
            </CardContent>
            <Separator className="my-2" />
            <CardFooter className="p-2 pt-0">
                <SupportBar entry={entry} onCommentClick={onSelect} />
            </CardFooter>
        </Card>
    </motion.div>
  );
}
