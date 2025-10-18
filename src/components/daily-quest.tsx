
'use client';

import { useState, useMemo } from 'react';
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
import { CheckCircle2, Award, Target, LoaderCircle, ShieldCheck, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


const POINTS_PER_LEVEL = 50;

const dailyQuestsList = [
    { id: 'login', title: 'Login ke MoodLink', points: 10 },
    { id: 'grateful', title: 'Tulis apa yang paling kamu syukuri hari ini', points: 20 },
    { id: 'comment', title: 'Komentari 1 jurnal orang lain hari ini', points: 15 },
    { id: 'like', title: 'Like 1 jurnal orang lain hari ini', points: 10 },
    { id: 'secret', title: 'Tulis jurnal rahasia dan kunci dengan kode', points: 25 },
];


export function DailyQuest() {
  const { currentUser, claimQuestReward } = useJournal();
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleClaim = async (questId: string, points: number) => {
    if (!currentUser) return;
    setClaimingQuestId(questId);
    try {
        await claimQuestReward(questId, points);
        toast({ title: 'Misi Selesai!', description: `Anda mendapatkan ${points} poin!` });
    } catch (error) {
        toast({ title: 'Gagal Klaim', description: 'Terjadi kesalahan saat mengklaim hadiah.', variant: 'destructive'});
        console.error(error);
    } finally {
        setClaimingQuestId(null);
    }
  }
  
  if (!currentUser) {
    return null;
  }

  const isVerifiedOwner = currentUser.displayName === 'cacann_aselii';
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
                        <div className={cn(
                            "mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                            isVerifiedOwner ? "border-transparent bg-primary text-primary-foreground" : "border-transparent bg-secondary text-secondary-foreground"
                        )}>
                          {isVerifiedOwner ? <ShieldCheck className="mr-2 h-4 w-4"/> : <UserIcon className="mr-2 h-4 w-4"/>}
                          {isVerifiedOwner ? 'Admin' : 'Member'}
                        </div>
                        <div className="mt-2 inline-flex items-center rounded-full border border-yellow-500 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-600">
                            {currentUser.points} poin
                        </div>
                    </div>
                </div>
                 <div className="mt-4 w-full">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-semibold">Level {currentUser.level}</p>
                        <p className="text-xs text-muted-foreground">{pointsToNextLevel} poin lagi naik level!</p>
                    </div>
                    <Progress value={progressToNextLevel} className="h-2" />
                </div>
            </div>

            {/* Quests Section */}
            <div className="space-y-3">
                {dailyQuestsList.map((quest) => {
                    const isCompleted = currentUser.questState?.[quest.id] === true;
                    const isClaimed = currentUser.questState?.[quest.id] === 'claimed';
                    const isClaiming = claimingQuestId === quest.id;

                    return (
                        <div key={quest.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                           <div className="flex items-center gap-3">
                             {isClaimed ? (
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                             ) : (
                                 <div className={cn("h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm", isCompleted ? "bg-green-400 text-white" : "bg-yellow-400 text-white")}>
                                    {isCompleted ? <CheckCircle2 /> : quest.points}
                                 </div>
                             )}
                             <p className={cn("font-medium", isClaimed && "text-muted-foreground line-through")}>
                                {quest.title}
                             </p>
                           </div>
                           <Button 
                             variant="outline" 
                             disabled={!isCompleted || isClaimed || isClaiming}
                             onClick={() => handleClaim(quest.id, quest.points)}
                           >
                            {isClaiming ? <LoaderCircle className="animate-spin" /> : isClaimed ? 'Diklaim' : 'Klaim'}
                           </Button>
                        </div>
                    )
                })}
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
