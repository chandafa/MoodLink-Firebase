
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Link, Bookmark, MessageSquare, Flame, Wind, Snowflake } from 'lucide-react';
import { Button } from './ui/button';
import { useJournal, type JournalEntry } from '@/hooks/use-journal';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useMemo, useState, useEffect, useRef } from 'react';

type ReactionType = 'fire' | 'wind' | 'snow';

type ReactionButtonProps = {
    onReact: (e: React.MouseEvent, reaction: ReactionType) => void;
};

const reactionCycle: ReactionType[] = ['fire', 'wind', 'snow'];

const ReactionIcon = ({ type, className }: { type: ReactionType, className?: string }) => {
    switch (type) {
        case 'fire': return <Flame className={cn("h-4 w-4 text-orange-500", className)} />;
        case 'wind': return <Wind className={cn("h-4 w-4 text-blue-400", className)} />;
        case 'snow': return <Snowflake className={cn("h-4 w-4 text-sky-300", className)} />;
        default: return <Flame className={cn("h-4 w-4 text-orange-500", className)} />;
    }
};


function ReactionButton({ onReact }: ReactionButtonProps) {
    const [currentReactionIndex, setCurrentReactionIndex] = useState(0);
    const clickTimeout = useRef<NodeJS.Timeout | null>(null);

    const activeReaction = reactionCycle[currentReactionIndex];
    
    useEffect(() => {
        // Cleanup timeout on component unmount
        return () => {
            if (clickTimeout.current) {
                clearTimeout(clickTimeout.current);
            }
        };
    }, []);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        // If there's a pending timeout, it means it's a multi-click
        if (clickTimeout.current) {
            clearTimeout(clickTimeout.current);
            // Cycle to the next reaction
            setCurrentReactionIndex(prevIndex => (prevIndex + 1) % reactionCycle.length);
        } else {
             // This is the first click in a potential sequence, trigger the current reaction immediately
             onReact(e, activeReaction);
        }

        // Set a timeout. If no more clicks happen within 1s, reset the cycle.
        clickTimeout.current = setTimeout(() => {
            setCurrentReactionIndex(0);
            clickTimeout.current = null;
        }, 1000); 
    };

    return (
        <motion.div whileTap={{ scale: 0.9 }}>
            <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5"
                onClick={handleClick}
            >
                <AnimatePresence mode="popLayout">
                     <motion.div
                        key={activeReaction}
                        initial={{ scale: 0.5, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                     >
                        <ReactionIcon type={activeReaction} />
                     </motion.div>
                </AnimatePresence>
            </Button>
        </motion.div>
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

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
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
          onClick={handleCopyLink}
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
