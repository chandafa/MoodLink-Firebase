

'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Icons } from './icons';
import { useJournal, User } from '@/hooks/use-journal';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardPage } from './leaderboard-page';
import { User as UserIcon, Trophy, Hourglass, Camera, Trash2, LogOut, BookCopy, Sparkles, LoaderCircle, Bookmark, Settings, ShieldCheck, Flag } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CapsuleListPage } from './capsule-list-page';
import Image from 'next/image';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CollectionListPage } from './collection-list-page';
import { BookmarkPage } from './bookmark-page';
import SettingsPage from './settings-page';
import { ReportManagementPage } from './report-management-page';
import { useLanguage } from '@/contexts/language-context';


const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.').max(50, 'Name must be at most 50 characters.'),
  bio: z.string().max(160, 'Bio must be at most 160 characters.').optional(),
  avatar: z.string().max(2, 'Avatar should be a single emoji.').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
const POINTS_PER_LEVEL = 50;

function ProfileForm({ currentUser, onUpdate, onSignOut, onAnalyze }: { currentUser: User | null; onUpdate: (data: ProfileFormValues, bannerFile?: File) => void; onSignOut: () => void; onAnalyze: () => Promise<void>; }) {
  const { toast } = useToast();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { t } = useLanguage();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: currentUser?.displayName || 'Tamu',
      bio: currentUser?.bio || '',
      avatar: currentUser?.avatar || '👤',
    },
  });
  
  useEffect(() => {
    if (currentUser) {
        form.reset({
            displayName: currentUser.displayName,
            bio: currentUser.bio || '',
            avatar: currentUser.avatar,
        });
    }
  }, [currentUser, form]);


  const onSubmit = (data: ProfileFormValues) => {
    onUpdate(data);
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been successfully saved.',
    });
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate(form.getValues(), file);
    }
  };
  
  const handleRemoveBanner = () => {
    if(currentUser) {
       const userRef = doc(db, 'users', currentUser.id);
       updateDoc(userRef, { bannerUrl: null });
       toast({ title: 'Banner dihapus' });
    }
  }

  const handleAnalysisClick = async () => {
      setIsAnalyzing(true);
      await onAnalyze();
      setIsAnalyzing(false);
  }

  const handleResetData = () => {
    localStorage.clear();
    toast({
      title: 'Data Dihapus',
      description: 'Semua data lokal Anda telah dihapus. Aplikasi akan dimuat ulang.',
    });
    setTimeout(() => window.location.reload(), 1500);
  };
  
  const avatarDisplay = form.watch('avatar') || '👤';

  const pointsToNextLevel = currentUser ? POINTS_PER_LEVEL - (currentUser.points % POINTS_PER_LEVEL) : POINTS_PER_LEVEL;
  const progressToNextLevel = currentUser ? (currentUser.points % POINTS_PER_LEVEL) / POINTS_PER_LEVEL * 100 : 0;
  
  const getBadgeIcon = (badge: string) => {
    switch (badge) {
        case 'pioneer': return '🚀';
        case 'dream_builder': return '☁️';
        case 'echo_thinker': return '🤔';
        default: return '🎖️';
    }
};

const getBadgeDescription = (badge: string) => {
    switch (badge) {
        case 'pioneer': return 'Pionir - Salah satu dari 10 pengguna pertama.';
        case 'dream_builder': return 'Pembangun Mimpi - Sering menulis hal positif dan ide baru.';
        case 'echo_thinker': return 'Pemikir Gema - Sering membalas dengan wawasan keren.';
        default: return 'Lencana Spesial';
    }
}


  return (
     <Card>
        <CardHeader className="p-0">
          <div className="relative h-48 bg-secondary flex items-center justify-center">
             {currentUser?.bannerUrl && (
                <Image
                    src={currentUser.bannerUrl}
                    alt="User Banner"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-t-lg"
                />
             )}
            <div className="absolute top-2 right-2 flex gap-2">
                <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => bannerInputRef.current?.click()}>
                    <Camera className="h-4 w-4" />
                </Button>
                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerChange}/>
                 {currentUser?.bannerUrl && (
                    <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={handleRemoveBanner}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                 )}
            </div>
             <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                <Avatar style={{ height: '8rem', width: '8rem' }} className="border-4 border-background">
                  <AvatarFallback style={{ fontSize: '4rem' }} className="bg-secondary text-secondary-foreground">
                    {avatarDisplay}
                  </AvatarFallback>
                </Avatar>
             </div>
          </div>
          <div className="pt-20 p-6 flex flex-col items-center">
             <CardTitle className="text-2xl">{currentUser?.displayName || 'Anonymous User'}</CardTitle>
             <CardDescription className="mt-1 text-center">{currentUser?.bio || 'No bio yet.'}</CardDescription>
             
              {currentUser?.displayName === 'cacann_aselii' ? (
                <div className="mt-4 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground">
                  <ShieldCheck className="mr-2 h-4 w-4"/> Admin
                </div>
              ) : (
                 <div className="mt-4 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground">
                    <UserIcon className="mr-2 h-4 w-4"/> Member
                 </div>
              )}

              {currentUser && currentUser.badges && currentUser.badges.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {currentUser.badges.map(badge => (
                         <div key={badge} className="flex items-center gap-1.5 bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-medium">
                            <span>{getBadgeIcon(badge)}</span>
                            <span>{getBadgeDescription(badge).split(' - ')[0]}</span>
                        </div>
                    ))}
                </div>
            )}

             <div className="flex justify-center gap-6 mt-4 w-full">
                <div>
                    <p className="text-lg font-bold">{currentUser?.followers.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div>
                    <p className="text-lg font-bold">{currentUser?.following.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Following</p>
                </div>
                 <div>
                    <p className="text-lg font-bold">{currentUser?.points || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('points')}</p>
                </div>
            </div>
             <div className="mt-4 w-full max-w-sm">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-semibold">Level {currentUser?.level || 1}</p>
                    <p className="text-xs text-muted-foreground">{pointsToNextLevel} {t('pointsToNextLevel')}</p>
                </div>
                <Progress value={progressToNextLevel} className="h-2" />
            </div>
          </div>
        </CardHeader>
        <Separator className="my-4" />
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
               <h3 className="text-lg font-semibold">{t('editProfile')}</h3>
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('displayName')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('bioPlaceholder')}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar (Emoji)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="👤"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">{t('saveChanges')}</Button>
            </form>
          </Form>
        </CardContent>

         <Separator className="my-4" />
        <CardContent>
            <h3 className="text-lg font-semibold mb-2">{t('aiAnalysis')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('aiAnalysisDescription')}</p>
             <Button onClick={handleAnalysisClick} disabled={isAnalyzing}>
                {isAnalyzing ? <LoaderCircle className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {t('analyzeMyEssence')}
            </Button>
        </CardContent>

        <CardFooter className="flex-col sm:flex-row gap-2 justify-end bg-muted/50 p-4 border-t">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline"><LogOut className="mr-2 h-4 w-4" /> {t('signOut')}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('signOutConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('signOutConfirmDescription')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={onSignOut}>{t('yesSignOut')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> {t('deleteLocalData')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('deleteLocalDataConfirm')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetData} className="bg-destructive hover:bg-destructive/90">
                    {t('yesDeleteData')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
      </Card>
  );
}

const emailAuthSchema = z.object({
  email: z.string().email('Alamat email tidak valid.'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter.'),
});
type EmailAuthFormValues = z.infer<typeof emailAuthSchema>;

const passwordResetSchema = z.object({
    email: z.string().email('Alamat email tidak valid.'),
});
type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

function GuestProfileView() {
    const { signInWithEmail, signUpWithEmail, sendPasswordResetEmail } = useJournal();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { t } = useLanguage();
    
    const form = useForm<EmailAuthFormValues>({
        resolver: zodResolver(emailAuthSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const resetForm = useForm<PasswordResetFormValues>({
        resolver: zodResolver(passwordResetSchema),
        defaultValues: {
          email: ''
        }
    });

    const handleEmailSubmit = async (data: EmailAuthFormValues, isSignUp: boolean) => {
        setIsSubmitting(true);
        if (isSignUp) {
            await signUpWithEmail(data.email, data.password);
        } else {
            await signInWithEmail(data.email, data.password);
        }
        setIsSubmitting(false);
    };

    const handlePasswordReset = async (data: PasswordResetFormValues) => {
        setIsSubmitting(true);
        const success = await sendPasswordResetEmail(data.email);
        if (success) {
            toast({
                title: 'Email Terkirim',
                description: 'Silakan periksa email Anda untuk tautan pengaturan ulang kata sandi.'
            });
        }
        // Error toast is handled inside sendPasswordResetEmail
        setIsSubmitting(false);
    }


    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle>{t('youAreAGuest')}</CardTitle>
                <CardDescription>
                    {t('guestDescription')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Form {...form}>
                    <form className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="email@anda.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('password')}</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="******" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                             <Button 
                                type="button" 
                                onClick={form.handleSubmit(d => handleEmailSubmit(d, false))}
                                disabled={isSubmitting}
                                className="w-full"
                            >
                                {isSubmitting ? t('processing') : t('signIn')}
                            </Button>
                             <Button 
                                type="button" 
                                onClick={form.handleSubmit(d => handleEmailSubmit(d, true))}
                                disabled={isSubmitting}
                                variant="secondary"
                                className="w-full"
                             >
                                {isSubmitting ? t('processing') : t('signUp')}
                            </Button>
                        </div>
                    </form>
                </Form>
                 <div className="text-center">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="link" className="text-sm">{t('forgotPassword')}</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('forgotPassword')}</DialogTitle>
                                <DialogDescription>
                                    {t('forgotPasswordDescription')}
                                </DialogDescription>
                            </DialogHeader>
                             <Form {...resetForm}>
                                <form onSubmit={resetForm.handleSubmit(handlePasswordReset)} className="space-y-4">
                                     <FormField
                                        control={resetForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="email@anda.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                         <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? t('sending') : t('sendLink')}
                                         </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    )
}

export default function ProfilePage({ onSelectEntry, onBuildCollection, onViewHashtag, onViewImage }: { onSelectEntry: (id: string | null) => void; onBuildCollection: (id: string | null) => void; onViewHashtag: (tag: string) => void; onViewImage: (url: string) => void; }) {
  const { currentUser, isLoaded, isAnonymous, uploadImageToHosting, signOutUser, analyzeUserForBadges, deleteEntry } = useJournal();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const isUserAdmin = currentUser?.displayName === 'cacann_aselii';

  const handleUpdateUser = async (data: ProfileFormValues, bannerFile?: File) => {
    if (currentUser) {
        const userRef = doc(db, 'users', currentUser.id);
        const updateData: any = { ...data };

        if (bannerFile) {
            const bannerUrl = await uploadImageToHosting(bannerFile);
            if (bannerUrl) {
                updateData.bannerUrl = bannerUrl;
            }
        }

        await updateDoc(userRef, updateData);
    }
  }
  
  const handleAnalyze = async () => {
    if (!currentUser) return;
    const result = await analyzeUserForBadges();
    if(result.badgeAwarded) {
        toast({ title: "Pencapaian Baru!", description: `Anda mendapatkan lencana: ${result.badgeName}`});
    } else {
        toast({ title: "Analisis Selesai", description: "Teruslah berkontribusi! Belum ada lencana baru yang sesuai saat ini."});
    }
  }


  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <header className="flex items-center gap-3 mb-8">
        <Icons.logo className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline text-foreground">
          {t('profileAndActivity')}
        </h1>
      </header>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className={cn("grid w-full", isUserAdmin ? "grid-cols-7" : "grid-cols-6")}>
            <TabsTrigger value="profile">
                <UserIcon className="mr-0 md:mr-2 h-4 w-4" /> <span className="hidden md:inline">{t('profile')}</span>
            </TabsTrigger>
             <TabsTrigger value="collections" disabled={isAnonymous}>
                <BookCopy className="mr-0 md:mr-2 h-4 w-4" /> <span className="hidden md:inline">{t('collections')}</span>
            </TabsTrigger>
             <TabsTrigger value="capsules" disabled={isAnonymous}>
                <Hourglass className="mr-0 md:mr-2 h-4 w-4" /> <span className="hidden md:inline">{t('capsules')}</span>
            </TabsTrigger>
            <TabsTrigger value="bookmarks" disabled={isAnonymous}>
                <Bookmark className="mr-0 md:mr-2 h-4 w-4" /> <span className="hidden md:inline">{t('saved')}</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
                <Trophy className="mr-0 md:mr-2 h-4 w-4" /> <span className="hidden md:inline">{t('leaderboard')}</span>
            </TabsTrigger>
             <TabsTrigger value="settings">
                <Settings className="mr-0 md:mr-2 h-4 w-4" /> <span className="hidden md:inline">{t('settings')}</span>
            </TabsTrigger>
            {isUserAdmin && (
                <TabsTrigger value="reports">
                    <Flag className="mr-0 md:mr-2 h-4 w-4" /> <span className="hidden md:inline">Laporan</span>
                </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="profile" className="mt-6">
            {isAnonymous ? (
                <GuestProfileView />
            ) : (
                <ProfileForm currentUser={currentUser} onUpdate={handleUpdateUser} onSignOut={signOutUser} onAnalyze={handleAnalyze} />
            )}
          </TabsContent>
          <TabsContent value="collections" className="mt-6">
             {isAnonymous ? <GuestProfileView /> : <CollectionListPage onBuildCollection={onBuildCollection} />}
          </TabsContent>
           <TabsContent value="capsules" className="mt-6">
            {isAnonymous ? <GuestProfileView /> : <CapsuleListPage onSelectEntry={onSelectEntry} />}
          </TabsContent>
          <TabsContent value="bookmarks" className="mt-6">
            {isAnonymous ? <GuestProfileView /> : <BookmarkPage onSelectEntry={onSelectEntry} onBack={() => {}} onViewHashtag={onViewHashtag} onViewImage={onViewImage}/>}
          </TabsContent>
          <TabsContent value="leaderboard" className="mt-6">
            <LeaderboardPage />
          </TabsContent>
           <TabsContent value="settings" className="mt-6">
            <SettingsPage />
          </TabsContent>
          {isUserAdmin && (
              <TabsContent value="reports" className="mt-6">
                <ReportManagementPage onDelete={deleteEntry} />
              </TabsContent>
          )}
        </Tabs>
    </div>
  );
}

    
