'use client';
import { motion } from 'framer-motion';
import { Heart, Link, Bookmark, MessageSquare, Flame } from 'lucide-react';
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
import { useMemo } from 'react';

type SupportBarProps = {
  entry: JournalEntry;
  onCommentClick?: () => void;
  onBoostClick?: () => void;
};

export function SupportBar({ entry, onCommentClick, onBoostClick }: SupportBarProps) {
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

  const handleBoost = (e: React.MouseEvent) => {
      e.stopPropagation();
      if(onBoostClick) onBoostClick();
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
      
      {onBoostClick && (
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5"
              onClick={handleBoost}
            >
              <Flame className="h-4 w-4 text-orange-500" />
            </Button>
          </motion.div>
      )}

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
