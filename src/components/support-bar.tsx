
'use client';
import { motion } from 'framer-motion';
import { Heart, Link, Bookmark, MessageSquare, Flame, Wind, Snowflake } from 'lucide-react';
import { Button } from './ui/button';
import { useJournal, type JournalEntry } from '@/hooks/use-journal';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

type ReactionType = 'fire' | 'wind' | 'snow';

type ReactionButtonProps = {
    onReact: (e: React.MouseEvent, reaction: ReactionType) => void;
};

function ReactionButton({ onReact }: ReactionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSimpleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onReact(e, 'fire');
    };

    const handleReactionSelect = (e: React.MouseEvent, reaction: ReactionType) => {
        e.stopPropagation();
        onReact(e, reaction);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <motion.div
                    whileTap={{ scale: 0.9 }}
                    onTapStart={(e) => e.stopPropagation()} // Prevent card click
                    onTapHold={(e) => {
                        e.stopPropagation();
                        setIsOpen(true);
                    }}
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1.5"
                        onClick={handleSimpleClick}
                    >
                        <Flame className="h-4 w-4 text-orange-500" />
                    </Button>
                </motion.div>
            </PopoverTrigger>
            <PopoverContent 
                className="w-auto p-2"
                onClick={(e) => e.stopPropagation()}
                onInteractOutside={() => setIsOpen(false)}
            >
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={(e) => handleReactionSelect(e, 'fire')}>
                        <Flame className="text-orange-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => handleReactionSelect(e, 'wind')}>
                        <Wind className="text-blue-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => handleReactionSelect(e, 'snow')}>
                        <Snowflake className="text-sky-300" />
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

type SupportBarProps = {
  entry: JournalEntry;
  onCommentClick?: () => void;
  onReact: (e: React.MouseEvent, reaction: ReactionType) => void;
};

export function SupportBar({ entry, onCommentClick, onReact }: SupportBarProps) {
  const { toggleLike, toggleBookmark, currentAuthUserId } = useJournal();
  const { toast } = useToast();
  
  const isLiked = useMemo(() => 
    (entry.likedBy || []).includes(currentAuthUserId)
  , [entry.likedBy, currentAuthUserId]);

  const isBookmarked = useMemo(() =>
    (entry.bookmarkedBy || []).includes(currentAuthUserId)
  , [entry.bookmarkedBy, currentAuthUserId]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?entryId=${entry.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Tautan disalin!',
      description: 'Tautan ke jurnal ini telah disalin ke clipboard Anda.',
    });
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(entry.id);
  }

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(entry.id);
  }

  const handleCopyClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleCopyLink();
  }

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(onCommentClick) {
        onCommentClick();
    }
  }

  return (
    <div className="w-full flex items-center justify-around text-muted-foreground">
      <motion.div whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5"
          onClick={handleLikeClick}
          disabled={!currentAuthUserId}
        >
          <Heart className={cn("h-4 w-4", isLiked && 'fill-red-500 text-red-500')} />
          <span className="text-xs font-semibold">{entry.likes || 0}</span>
        </Button>
      </motion.div>
      
      <ReactionButton onReact={onReact} />

       <motion.div whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5"
          onClick={handleCopyClick}
        >
          <Link className="h-4 w-4" />
        </Button>
      </motion.div>

        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={handleBookmarkClick}
            disabled={!currentAuthUserId}
          >
            <Bookmark className={cn("h-4 w-4", isBookmarked && 'fill-yellow-400 text-yellow-500')} />
          </Button>
        </motion.div>

      {onCommentClick && (
         <motion.div whileTap={{ scale: 0.9 }}>
            <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={handleCommentClick}
            >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs font-semibold">{entry.commentCount || 0}</span>
            </Button>
        </motion.div>
      )}
    </div>
  );
}
