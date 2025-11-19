
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Code, Film, Wand2, Sparkles, SlidersHorizontal } from 'lucide-react';

export function DevTools({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const [cinematic, setCinematic] = useState(false);
  const [pixelDust, setPixelDust] = useState(true);
  
  const handleInjectCss = () => {
    const css = (document.getElementById('custom-css') as HTMLTextAreaElement)?.value;
    if (css) {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Developer Tools</DialogTitle>
          <DialogDescription>
            Fitur eksklusif untuk kustomisasi dan debug. Gunakan dengan hati-hati.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="visual-flavour" className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              <span>Visual Flavour Tweaks</span>
            </Label>
            <Button size="sm" variant="outline" disabled>Apply</Button>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cinematic-animation" className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              <span>Cinematic Animation</span>
            </Label>
            <Switch id="cinematic-animation" checked={cinematic} onCheckedChange={setCinematic} />
          </div>
           <div className="flex items-center justify-between">
            <Label htmlFor="pixel-dust" className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              <span>Pixel Dust Effect</span>
            </Label>
            <Switch id="pixel-dust" checked={pixelDust} onCheckedChange={setPixelDust} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="custom-css" className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              <span>Custom CSS Injection (Safe)</span>
            </Label>
            <Textarea id="custom-css" placeholder="body { background-color: papayawhip; }" className="min-h-[100px]" />
            <Button size="sm" onClick={handleInjectCss} className="mt-2">Inject CSS</Button>
          </div>
          <div className="flex items-center justify-between">
             <Label htmlFor="mood-logs" className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span>Debug Mood Logs Visualizer</span>
            </Label>
             <Button size="sm" variant="outline" disabled>Visualize</Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    