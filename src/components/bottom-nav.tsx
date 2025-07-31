'use client';
import { Home, Users, User, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', icon: Home },
  { name: 'Grup', icon: Users },
  { name: 'Profile', icon: User },
  { name: 'Settings', icon: Settings },
];

export function BottomNav({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-t md:hidden z-20">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveTab(item.name)}
            className={cn(
              'relative flex flex-col items-center justify-center w-full h-full text-sm font-medium transition-colors',
              activeTab === item.name ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs mt-1">{item.name}</span>
            {activeTab === item.name && (
              <motion.div
                layoutId="active-nav-indicator"
                className="absolute bottom-0 h-0.5 w-8 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
