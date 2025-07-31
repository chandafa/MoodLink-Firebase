'use client';
import { motion } from 'framer-motion';
import { Heart, Link, Repeat, MessageSquare } from 'lucide-react';
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
};

export function SupportBar({ entry, onCommentClick }: SupportBarProps) {
  const { toggleLike, currentAuthUserId } = useJournal();
  const { toast } = useToast();
  
  const isLiked = useMemo(() => 
    entry.likedBy.includes(currentAuthUserId)
  , [entry.likedBy, currentAuthUserId]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?entryId=${entry.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Tautan disalin!',
      description: 'Tautan ke jurnal ini telah disalin ke clipboard Anda.',
    });
  };

  const handleRepost = () => {
     toast({
      title: 'Berhasil di-repost!',
      description: 'Jurnal ini telah di-repost di halaman Anda (fitur demo).',
    });
  }

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(entry.id);
  }

  const handleCopyClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleCopyLink();
  }

  const handleRepostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
          <span className="text-xs font-semibold">{entry.likes}</span>
        </Button>
      </motion.div>

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

        <AlertDialog>
            <AlertDialogTrigger asChild>
                <motion.div whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1.5" onClick={handleRepostClick}>
                        <Repeat className="h-4 w-4" />
                    </Button>
                </motion.div>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Repost Jurnal?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Apakah Anda yakin ingin me-repost jurnal ini ke halaman Anda?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRepost}>Ya, Repost</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      {onCommentClick && (
         <motion.div whileTap={{ scale: 0.9 }}>
            <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={handleCommentClick}
            >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs font-semibold">{entry.comments?.length || 0}</span>
            </Button>
        </motion.div>
      )}
    </div>
  );
}
