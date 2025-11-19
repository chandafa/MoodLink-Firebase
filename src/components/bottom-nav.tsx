

'use client';
import { useMemo } from 'react';
import { Home, MessageSquare, Settings, Bell, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { useNotifications } from '@/hooks/use-notifications';
import { useJournal, useConversations } from '@/hooks/use-journal';


export function BottomNav({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  const { t } = useLanguage();
  const { currentUser } = useJournal();
  const { unreadCount: unreadNotifications } = useNotifications(currentUser?.id || null);
  const { conversations } = useConversations(currentUser?.id || null);

  const unreadMessages = useMemo(() => {
    if (!conversations || !currentUser) return 0;
    return conversations.reduce((acc, convo) => {
        return acc + (convo.unreadCounts?.[currentUser.id] || 0);
    }, 0);
  }, [conversations, currentUser]);


  const navItems = [
    { name: 'Home', label: 'Beranda', icon: Home, badgeCount: 0 },
    { name: 'Explore', label: 'Jelajahi', icon: Compass, badgeCount: 0 },
    { name: 'Pesan', label: 'Pesan', icon: MessageSquare, badgeCount: unreadMessages },
    { name: 'Notifikasi', label: 'Notifikasi', icon: Bell, badgeCount: unreadNotifications },
    { name: 'Settings', label: 'Pengaturan', icon: Settings, badgeCount: 0 },
  ];

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-20 h-16",
      "md:bottom-6 md:flex md:justify-center pointer-events-none"
    )}>
      <nav className={cn(
        "pointer-events-auto flex h-full w-full items-center justify-around bg-background/80 backdrop-blur-sm border-t",
        "md:w-auto md:h-auto md:rounded-full md:border md:bg-zinc-800/20 md:backdrop-blur-lg md:shadow-lg md:p-2 md:gap-2 md:dark:border-white/30"
      )}>
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveTab(item.name)}
            className={cn(
              'relative flex flex-col items-center justify-center w-full h-full text-sm font-medium transition-colors',
              'md:w-auto md:h-auto md:px-4 md:py-2 md:rounded-full md:flex-row md:gap-2',
              activeTab === item.name
                ? 'text-primary md:text-white'
                : 'text-muted-foreground hover:text-primary md:text-neutral-200 md:hover:text-white'
            )}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <item.icon className="h-6 w-6 md:h-5 md:w-5" />
            <span className="text-xs mt-1 md:text-sm md:mt-0">{item.label}</span>
            
            {item.badgeCount > 0 && (
              <div className="absolute top-1 right-1/2 translate-x-4 md:static md:translate-x-0 md:ml-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {item.badgeCount}
              </div>
            )}

            {activeTab === item.name && (
              <motion.div
                layoutId="active-mobile-nav-indicator"
                className="absolute bottom-0 h-0.5 w-8 bg-primary rounded-full md:hidden"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            
            {activeTab === item.name && (
                <motion.div
                    layoutId="active-desktop-nav-indicator"
                    className="absolute inset-0 rounded-full bg-primary -z-10 hidden md:block"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
