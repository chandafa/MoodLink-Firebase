

'use client';

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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from './theme-toggle';
import { useTheme } from "./theme-provider";
import { LogIn, LogOut, User, Trash2, Bell, CaseSensitive, Languages, Palette } from "lucide-react";
import { useJournal } from "@/hooks/use-journal";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { useLanguage } from "@/contexts/language-context";
import { AppearanceSettings } from "./appearance-settings";

export default function SettingsPage({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { toast } = useToast();
  const { currentUser, isAnonymous, signOutUser, toggleNotifications } = useJournal();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  
  const fontOptions = [
    { value: 'font-body', label: 'Poppins' },
    { value: 'font-serif', label: 'Lora' },
    { value: 'font-script', label: 'Dancing Script' },
    { value: 'font-mono', label: 'Inconsolata' },
];

const handleFontChange = (value: string) => {
    // This logic needs to be implemented globally, perhaps in a context
    // For now, this is a placeholder.
    document.body.className = document.body.className.replace(/font-\w+/g, '');
    document.body.classList.add(value);
    console.log("Font changed to:", value);
};

const handleResetData = () => {
    localStorage.clear();
    toast({
      title: 'Data Dihapus',
      description: 'Semua data lokal Anda telah dihapus. Aplikasi akan dimuat ulang.',
    });
    setTimeout(() => window.location.reload(), 1500);
  };


  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>{t('account')}</CardTitle>
                <CardDescription>{t('accountDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                {isAnonymous ? (
                     <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                       <div className="flex items-center gap-3">
                        <Avatar><AvatarFallback><User /></AvatarFallback></Avatar>
                        <div>
                            <p className="font-semibold">{t('guestAccount')}</p>
                            <p className="text-sm text-muted-foreground">{t('guestAccountDescription')}</p>
                        </div>
                       </div>
                       <Button onClick={() => setActiveTab('Profile')}><LogIn className="mr-2"/> {t('signIn')}</Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                       <div className="flex items-center gap-3">
                        <Avatar><AvatarFallback>{currentUser?.avatar}</AvatarFallback></Avatar>
                        <div>
                            <p className="font-semibold">{currentUser?.displayName}</p>
                            <p className="text-sm text-muted-foreground">{t('signedInAs')} {currentUser?.displayName}</p>
                        </div>
                       </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline"><LogOut className="mr-2 h-4 w-4" /> {t('signOut')}</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('signOutConfirmTitle')}</AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={signOutUser}>{t('yesSignOut')}</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('display')}</CardTitle>
            <CardDescription>{t('displayDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 divide-y">
            <div className="flex items-center justify-between py-3">
              <Label htmlFor="dark-mode" className="flex items-center gap-3"><ThemeToggle/> {t('darkMode')}</Label>
              <Switch id="dark-mode" checked={theme === 'dark'} onCheckedChange={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
            </div>
             <div className="flex items-center justify-between py-3">
              <Label htmlFor="language" className="flex items-center gap-3"><Languages /> {t('language')}</Label>
               <div className="flex gap-2">
                <Button size="sm" variant={locale === 'id' ? 'default' : 'outline'} onClick={() => setLocale('id')}>Indonesia</Button>
                <Button size="sm" variant={locale === 'en' ? 'default' : 'outline'} onClick={() => setLocale('en')}>English</Button>
               </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <Label htmlFor="font" className="flex items-center gap-3"><CaseSensitive /> {t('font')}</Label>
               <Select onValueChange={handleFontChange} defaultValue="font-body">
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                    {fontOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            </div>
          </CardContent>
        </Card>
        
        <AppearanceSettings />

        <Card>
            <CardHeader>
                <CardTitle>{t('other')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 divide-y">
                 <div className="flex items-center justify-between py-3">
                  <Label htmlFor="notifications" className="flex items-center gap-3"><Bell/> {t('notifications')}</Label>
                  <Switch 
                    id="notifications" 
                    checked={currentUser?.notificationsEnabled !== false}
                    onCheckedChange={(checked) => toggleNotifications(checked)}
                    disabled={isAnonymous}
                  />
                </div>
                 <div className="flex items-center justify-between py-3">
                    <Label htmlFor="reset-data" className="flex items-center gap-3"><Trash2 /> {t('deleteLocalData')}</Label>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">{t('delete')}</Button>
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
                            <AlertDialogAction onClick={handleResetData} className="bg-destructive hover:bg-destructive/90">{t('yesDeleteData')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
      
        <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>Version 1.0.0</p>
            <p>Copyright &copy; 2025 chandafa - chann</p>
        </div>
    </div>
  );
}
