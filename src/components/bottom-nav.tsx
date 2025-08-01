'use client';
import { Home, MessageSquare, User, Settings, Hourglass } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', icon: Home },
  { name: 'Pesan', icon: MessageSquare },
  { name: 'Capsule', icon: Hourglass },
  { name: 'Profile', icon: User },
  { name: 'Settings', icon: Settings },
];

export function BottomNav({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-t z-20",
      "md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-auto md:h-auto md:rounded-full md:border md:bg-zinc-800/20 md:backdrop-blur-lg md:shadow-lg md:p-2 md:dark:border-white/30"
    )}>
      <div className="flex justify-around items-center h-full max-w-md mx-auto md:gap-2">
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
            <span className="text-xs mt-1 md:text-sm md:mt-0">{item.name}</span>
            
            {/* Mobile indicator */}
            {activeTab === item.name && (
              <motion.div
                layoutId="active-mobile-nav-indicator"
                className="absolute bottom-0 h-0.5 w-8 bg-primary rounded-full md:hidden"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            
            {/* Desktop indicator */}
            {activeTab === item.name && (
                <motion.div
                    layoutId="active-desktop-nav-indicator"
                    className="absolute inset-0 rounded-full bg-primary -z-10 hidden md:block"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
