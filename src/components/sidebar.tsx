
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { User, LogOut, X, User as UserIcon, BookCopy, Hourglass, Bookmark, Trophy } from 'lucide-react';

export function Sidebar({ user, onClose, onNavigate, onSignOut, onAvatarClick }) {
  if (!user) return null;

  const handleNavigation = (tabName) => {
    onNavigate(tabName);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="sidebar-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      <motion.div
        key="sidebar-content"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
        className="fixed top-0 left-0 h-full w-4/5 max-w-sm bg-background z-50 flex flex-col"
      >
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
             <Avatar className="h-12 w-12 cursor-pointer" onClick={() => { handleNavigation('Profile'); onAvatarClick(); }}>
                <AvatarFallback className="text-2xl">{user.avatar}</AvatarFallback>
             </Avatar>
             <Button variant="ghost" size="icon" onClick={onClose}><X/></Button>
          </div>
          <h2 className="font-bold text-lg mt-3">{user.displayName}</h2>
          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
            <span><span className="font-bold text-foreground">{user.following.length}</span> Mengikuti</span>
            <span><span className="font-bold text-foreground">{user.followers.length}</span> Pengikut</span>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2">
            <Button variant="ghost" className="w-full justify-start text-lg" onClick={() => handleNavigation('Profile')}>
                <UserIcon className="mr-4 h-6 w-6"/> Profil & Aktivitas
            </Button>
            <Button variant="ghost" className="w-full justify-start text-lg" onClick={() => handleNavigation('Profile')}>
                <BookCopy className="mr-4 h-6 w-6"/> Koleksi
            </Button>
            <Button variant="ghost" className="w-full justify-start text-lg" onClick={() => handleNavigation('Profile')}>
                <Hourglass className="mr-4 h-6 w-6"/> Kapsul Waktu
            </Button>
            <Button variant="ghost" className="w-full justify-start text-lg" onClick={() => handleNavigation('Profile')}>
                <Bookmark className="mr-4 h-6 w-6"/> Tersimpan
            </Button>
             <Button variant="ghost" className="w-full justify-start text-lg" onClick={() => handleNavigation('Profile')}>
                <Trophy className="mr-4 h-6 w-6"/> Papan Peringkat
            </Button>
        </nav>

        <div className="p-6 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={onSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

    