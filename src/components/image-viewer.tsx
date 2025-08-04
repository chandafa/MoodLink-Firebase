'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Image from 'next/image';

type ImageViewerProps = {
  imageUrl: string;
  onClose: () => void;
};

export function ImageViewer({ imageUrl, onClose }: ImageViewerProps) {
  return (
    <Dialog open={!!imageUrl} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="p-0 border-0 bg-transparent max-w-4xl h-auto shadow-none">
        <DialogTitle className="sr-only">Enlarged Image</DialogTitle>
        <DialogDescription className="sr-only">A larger view of the selected image.</DialogDescription>
        <Image
          src={imageUrl}
          alt="Enlarged view"
          width={1920}
          height={1080}
          className="rounded-lg object-contain w-full h-auto max-h-[90vh]"
        />
      </DialogContent>
    </Dialog>
  );
}
