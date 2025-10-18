
'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useJournal } from '@/hooks/use-journal';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { CheckCircle2, Award, Target } from 'lucide-react';
import { cn } from '@/lib/utils';


const POINTS_PER_LEVEL = 50;

const dailyQuests = [
    { id: 'login', title: 'Login ke MoodLink', points: 10, completed: true },
    { id: 'attend', title: 'Menghadiri sesi kelas', points: 10, completed: false },
    { id: 'study', title: 'Mempelajari materi', points: 10, completed: false },
    { id: 'task', title: 'Mengumpulkan tugas', points: 0, completed: true },
    { id: 'quiz', title: 'Mengerjakan kuis', points: 40, completed: false },
];


export function DailyQuest() {
  const { currentUser } = useJournal();
  
  if (!currentUser) {
    return null;
  }

  const pointsToNextLevel = POINTS_PER_LEVEL - (currentUser.points % POINTS_PER_LEVEL);
  const progressToNextLevel = (currentUser.points % POINTS_PER_LEVEL) / POINTS_PER_LEVEL * 100;
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="rounded-full h-16 w-16 shadow-lg bg-background">
          <Target className="h-8 w-8" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle>Misi Harian</SheetTitle>
          <SheetDescription>Selesaikan misi untuk mendapatkan poin dan naik level!</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
            {/* Profile Section */}
            <div className="p-4 rounded-lg bg-secondary/50 mb-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                        <AvatarFallback className="text-3xl">{currentUser.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-bold text-lg">{currentUser.displayName}</h3>
                        <p className="text-sm text-muted-foreground">Teknik Informatika</p>
                        <p className="text-sm text-muted-foreground">233040037</p>
                        <div className="mt-1 inline-flex items-center rounded-full border border-yellow-500 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-600">
                            {currentUser.points} poin
                        </div>
                    </div>
                </div>
                 <div className="mt-4 w-full">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-semibold">Bronze</p>
                        <p className="text-xs text-muted-foreground">{pointsToNextLevel} poin lagi naik level!</p>
                    </div>
                    <Progress value={progressToNextLevel} className="h-2" />
                </div>
            </div>

            {/* Quests Section */}
            <div className="space-y-3">
                {dailyQuests.map((quest) => (
                    <div key={quest.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                       <div className="flex items-center gap-3">
                         {quest.completed ? (
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                         ) : (
                             <div className="h-8 w-8 rounded-full bg-yellow-400 text-white flex items-center justify-center font-bold text-sm">
                                {quest.points}
                             </div>
                         )}
                         <p className={cn("font-medium", quest.completed && "text-muted-foreground line-through")}>
                            {quest.title}
                         </p>
                       </div>
                       <Button variant="outline" disabled={quest.completed || quest.points === 0}>
                         Klaim
                       </Button>
                    </div>
                ))}
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
