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
import { Bookmark, ChevronRight, LogIn, LogOut, User } from "lucide-react";
import { useJournal } from "@/hooks/use-journal";
import { Avatar, AvatarFallback } from "./ui/avatar";

export default function SettingsPage({ onNavigate }: { onNavigate: (view: 'main' | 'bookmarks') => void }) {
  const { toast } = useToast();
  const { theme } = useTheme();
  const { currentUser, isAnonymous, linkWithGoogle, signOutUser } = useJournal();

  const handleResetData = () => {
    localStorage.clear();
    toast({
      title: 'Data Dihapus',
      description: 'Semua data lokal Anda telah dihapus. Aplikasi akan dimuat ulang.',
    });
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <header className="flex items-center gap-3 mb-8">
        <Icons.logo className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Pengaturan
        </h1>
      </header>

      <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Akun</CardTitle>
                <CardDescription>Kelola sesi dan data akun Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isAnonymous ? (
                     <>
                        <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                           <div className="flex items-center gap-3">
                            <Avatar><AvatarFallback><User /></AvatarFallback></Avatar>
                            <div>
                                <p className="font-semibold">Akun Tamu</p>
                                <p className="text-sm text-muted-foreground">Data Anda tidak tersimpan permanen.</p>
                            </div>
                           </div>
                           <Button onClick={linkWithGoogle}><LogIn className="mr-2"/> Masuk</Button>
                        </div>
                     </>
                ) : (
                    <>
                        <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                           <div className="flex items-center gap-3">
                            <Avatar><AvatarFallback>{currentUser?.avatar}</AvatarFallback></Avatar>
                            <div>
                                <p className="font-semibold">{currentUser?.displayName}</p>
                                <p className="text-sm text-muted-foreground">Masuk dengan Google</p>
                            </div>
                           </div>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="outline"><LogOut className="mr-2" /> Keluar</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Anda yakin ingin keluar?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                       Anda akan kembali ke akun anonim. Anda dapat masuk kembali nanti untuk mengakses data Anda.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={signOutUser}>
                                        Ya, Keluar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                           </AlertDialog>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tampilan</CardTitle>
            <CardDescription>Sesuaikan tampilan dan nuansa aplikasi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Mode Gelap</Label>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="language">Bahasa</Label>
              <Button variant="outline" disabled>Indonesia</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Konten</CardTitle>
            <CardDescription>Kelola konten dan data Anda.</CardDescription>
          </CardHeader>
          <CardContent>
             <button onClick={() => onNavigate('bookmarks')} className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-center gap-4">
                    <Bookmark className="h-5 w-5 text-primary" />
                    <span className="font-medium">Jurnal Tersimpan</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manajemen Data</CardTitle>
            <CardDescription>Kelola data aplikasi Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Hapus Semua Data Lokal</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini tidak dapat dibatalkan. Ini akan menghapus semua
                    entri jurnal, informasi profil, dan pengaturan dari perangkat ini. Jika Anda sudah masuk, data Anda akan tetap aman di cloud.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetData}>
                    Ya, hapus data saya
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>Version 1.0.0</p>
        <p>Copyright &copy; 2025 chandafa - chann</p>
      </div>
    </div>
  );
}
