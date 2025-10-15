

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Icons } from './icons';
import { useJournal, User } from '@/hooks/use-journal';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardPage } from './leaderboard-page';
import { User as UserIcon, Trophy, Hourglass, Camera, Trash2, LogIn } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CapsuleListPage } from './capsule-list-page';
import Image from 'next/image';
import { cn } from '@/lib/utils';


const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.').max(50, 'Name must be at most 50 characters.'),
  bio: z.string().max(160, 'Bio must be at most 160 characters.').optional(),
  avatar: z.string().max(2, 'Avatar should be a single emoji.').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
const POINTS_PER_LEVEL = 50;

function ProfileForm({ currentUser, onUpdate }: { currentUser: User | null; onUpdate: (data: ProfileFormValues, bannerFile?: File) => void; }) {
  const { toast } = useToast();
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      bio: '',
      avatar: '👤',
    },
  });
  
  useEffect(() => {
    if (currentUser) {
        form.reset({
            displayName: currentUser.displayName,
            bio: currentUser.bio,
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
  
  const avatarDisplay = form.watch('avatar') || '👤';

  const pointsToNextLevel = currentUser ? POINTS_PER_LEVEL - (currentUser.points % POINTS_PER_LEVEL) : POINTS_PER_LEVEL;
  const progressToNextLevel = currentUser ? (currentUser.points % POINTS_PER_LEVEL) / POINTS_PER_LEVEL * 100 : 0;

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
                    <p className="text-sm text-muted-foreground">Poin</p>
                </div>
            </div>
             <div className="mt-4 w-full max-w-sm">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-semibold">Level {currentUser?.level || 1}</p>
                    <p className="text-xs text-muted-foreground">{pointsToNextLevel} poin ke level berikutnya</p>
                </div>
                <Progress value={progressToNextLevel} className="h-2" />
            </div>
          </div>
        </CardHeader>
        <Separator className="my-4" />
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
               <h3 className="text-lg font-semibold">Edit Your Profile</h3>
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
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
                        placeholder="Tell us a little about yourself"
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
              <Button type="submit">Save Changes</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
  );
}

const emailAuthSchema = z.object({
  email: z.string().email('Alamat email tidak valid.'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter.'),
});
type EmailAuthFormValues = z.infer<typeof emailAuthSchema>;

function GuestProfileView() {
    const { linkWithGoogle, signInWithEmail, signUpWithEmail } = useJournal();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<EmailAuthFormValues>({
        resolver: zodResolver(emailAuthSchema),
        defaultValues: {
            email: '',
            password: '',
        },
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


    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle>Anda adalah Tamu</CardTitle>
                <CardDescription>
                    Masuk atau Daftar untuk menyimpan profil, poin, dan aktivitas Anda secara permanen.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Button onClick={linkWithGoogle} size="lg" className="w-full">
                    <LogIn className="mr-2 h-5 w-5" />
                    Masuk dengan Google
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                        Atau lanjutkan dengan
                        </span>
                    </div>
                </div>

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
                                <FormLabel>Kata Sandi</FormLabel>
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
                                {isSubmitting ? 'Memproses...' : 'Masuk'}
                            </Button>
                             <Button 
                                type="button" 
                                onClick={form.handleSubmit(d => handleEmailSubmit(d, true))}
                                disabled={isSubmitting}
                                variant="secondary"
                                className="w-full"
                             >
                                {isSubmitting ? 'Memproses...' : 'Daftar'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

export default function ProfilePage({ onSelectEntry }: { onSelectEntry: (id: string | null) => void; }) {
  const { currentUser, isLoaded, isAnonymous, uploadImageToHosting, linkWithGoogle } = useJournal();
  const { toast } = useToast();

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

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <header className="flex items-center gap-3 mb-8">
        <Icons.logo className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Profil & Aktivitas
        </h1>
      </header>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
                <UserIcon className="mr-0 md:mr-2 h-4 w-4" /> <span className="hidden md:inline">Profil</span>
            </TabsTrigger>
             <TabsTrigger value="capsules" disabled={isAnonymous}>
                <Hourglass className="mr-0 md:mr-2 h-4 w-4" /> <span className="hidden md:inline">Kapsul</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
                <Trophy className="mr-0 md:mr-2 h-4 w-4" /> <span className="hidden md:inline">Peringkat</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-6">
            {isAnonymous ? (
                <GuestProfileView />
            ) : (
                <ProfileForm currentUser={currentUser} onUpdate={handleUpdateUser} />
            )}
          </TabsContent>
           <TabsContent value="capsules" className="mt-6">
            {isAnonymous ? <GuestProfileView /> : <CapsuleListPage onSelectEntry={onSelectEntry} />}
          </TabsContent>
          <TabsContent value="leaderboard" className="mt-6">
            <LeaderboardPage />
          </TabsContent>
        </Tabs>
    </div>
  );
}

    