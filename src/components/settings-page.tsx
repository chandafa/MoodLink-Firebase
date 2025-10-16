
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
import { Icons } from './icons';
import { ThemeToggle } from './theme-toggle';
import { useTheme } from "./theme-provider";
import { LogIn, LogOut, User, Trash2, ChevronRight, Bell, CaseSensitive, Languages } from "lucide-react";
import { useJournal } from "@/hooks/use-journal";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";
import { Switch } from "./ui/switch";

export default function SettingsPage() {
  const { toast } = useToast();
  const { currentUser, isAnonymous, signOutUser } = useJournal();
  const [language, setLanguage] = useState('id');
  const [font, setFont] = useState('body');

  const handleResetData = () => {
    localStorage.clear();
    toast({
      title: 'Data Dihapus',
      description: 'Semua data lokal Anda telah dihapus. Aplikasi akan dimuat ulang.',
    });
    setTimeout(() => window.location.reload(), 1500);
  };
  
  const fontOptions = [
    { value: 'font-body', label: 'Poppins' },
    { value: 'font-serif', label: 'Lora' },
    { value: 'font-script', label: 'Dancing Script' },
    { value: 'font-mono', label: 'Inconsolata' },
];


  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Akun</CardTitle>
                <CardDescription>Kelola sesi dan data akun Anda.</CardDescription>
            </CardHeader>
            <CardContent>
                {isAnonymous ? (
                     <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                       <div className="flex items-center gap-3">
                        <Avatar><AvatarFallback><User /></AvatarFallback></Avatar>
                        <div>
                            <p className="font-semibold">Akun Tamu</p>
                            <p className="text-sm text-muted-foreground">Data Anda tidak tersimpan permanen.</p>
                        </div>
                       </div>
                       <Button><LogIn className="mr-2"/> Masuk</Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                       <div className="flex items-center gap-3">
                        <Avatar><AvatarFallback>{currentUser?.avatar}</AvatarFallback></Avatar>
                        <div>
                            <p className="font-semibold">{currentUser?.displayName}</p>
                            <p className="text-sm text-muted-foreground">Masuk sebagai {currentUser?.displayName}</p>
                        </div>
                       </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline"><LogOut className="mr-2 h-4 w-4" /> Keluar</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Anda yakin ingin keluar?</AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={signOutUser}>Ya, Keluar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tampilan</CardTitle>
            <CardDescription>Sesuaikan tampilan dan nuansa aplikasi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 divide-y">
            <div className="flex items-center justify-between py-3">
              <Label htmlFor="dark-mode" className="flex items-center gap-3"><ThemeToggle/> Mode Gelap</Label>
              <Switch id="dark-mode" checked={useTheme().theme === 'dark'} onCheckedChange={() => useTheme().setTheme(useTheme().theme === 'light' ? 'dark' : 'light')} />
            </div>
             <div className="flex items-center justify-between py-3">
              <Label htmlFor="language" className="flex items-center gap-3"><Languages /> Bahasa</Label>
               <div className="flex gap-2">
                <Button size="sm" variant={language === 'id' ? 'default' : 'outline'} onClick={() => setLanguage('id')}>Indonesia</Button>
                <Button size="sm" variant={language === 'en' ? 'default' : 'outline'} onClick={() => setLanguage('en')} disabled>English</Button>
               </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <Label htmlFor="font" className="flex items-center gap-3"><CaseSensitive /> Font</Label>
               <Select value={font} onValueChange={setFont}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pilih font" />
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

        <Card>
            <CardHeader>
                <CardTitle>Lainnya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 divide-y">
                 <div className="flex items-center justify-between py-3">
                  <Label htmlFor="notifications" className="flex items-center gap-3"><Bell/> Notifikasi</Label>
                  <Switch id="notifications" />
                </div>
                 <div className="flex items-center justify-between py-3">
                    <Label htmlFor="reset-data" className="flex items-center gap-3"><Trash2 /> Hapus Data Lokal</Label>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">Hapus</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Ini akan menghapus semua data tamu (postingan anonim) dari perangkat ini. Tindakan ini tidak dapat diurungkan.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetData} className="bg-destructive hover:bg-destructive/90">Hapus Sekarang</AlertDialogAction>
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
