'use client';

import { useState, useEffect } from 'react';
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
import { getCurrentUserId, useJournal, User } from '@/hooks/use-journal';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.').max(50, 'Name must be at most 50 characters.'),
  bio: z.string().max(160, 'Bio must be at most 160 characters.').optional(),
  avatar: z.string().max(2, 'Avatar should be a single emoji.').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
const POINTS_PER_LEVEL = 50;

export default function ProfilePage() {
  const { toast } = useToast();
  const { users, isLoaded } = useJournal();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      bio: '',
      avatar: '👤',
    },
  });

  useEffect(() => {
    if (isLoaded) {
        const currentUserId = getCurrentUserId();
        const user = users.find(u => u.id === currentUserId) || null;
        setCurrentUser(user);
        if (user) {
            form.reset({
                displayName: user.displayName,
                bio: user.bio,
                avatar: user.avatar,
            });
        }
    }
  }, [isLoaded, users, form]);

  const onSubmit = (data: ProfileFormValues) => {
    localStorage.setItem('moodlink-profile', JSON.stringify(data));
    if (currentUser) {
        // This is a mock update. In a real app, you'd call an update function from the hook.
        const updatedUser = { ...currentUser, ...data };
        setCurrentUser(updatedUser); 
        // In a real implementation, the hook would handle updating localStorage for the users array.
    }
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been successfully saved.',
    });
  };
  
  const avatarDisplay = form.watch('avatar') || '👤';

  const pointsToNextLevel = currentUser ? POINTS_PER_LEVEL - (currentUser.points % POINTS_PER_LEVEL) : POINTS_PER_LEVEL;
  const progressToNextLevel = currentUser ? (currentUser.points % POINTS_PER_LEVEL) / POINTS_PER_LEVEL * 100 : 0;


  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <header className="flex items-center gap-3 mb-8">
        <Icons.logo className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Profile
        </h1>
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-col items-center sm:flex-row gap-6">
            <Avatar style={{ height: '8rem', width: '8rem' }}>
              <AvatarFallback style={{ fontSize: '4rem' }} className="bg-secondary text-secondary-foreground">
                {avatarDisplay}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left w-full">
                <CardTitle>{currentUser?.displayName || 'Anonymous User'}</CardTitle>
                <CardDescription>{currentUser?.bio || 'No bio yet.'}</CardDescription>
                 <div className="flex justify-center sm:justify-start gap-6 mt-4">
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
                 <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-semibold">Level {currentUser?.level || 1}</p>
                        <p className="text-xs text-muted-foreground">{pointsToNextLevel} poin ke level berikutnya</p>
                    </div>
                    <Progress value={progressToNextLevel} className="h-2" />
                </div>
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
    </div>
  );
}
